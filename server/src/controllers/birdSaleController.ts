import { Request, Response } from 'express';
import { BirdSale } from '../models/BirdSale';
import { ChickBatch } from '../models/ChickBatch';
import { Farmer } from '../models/Farmer';
import { LedgerTransaction } from '../models/LedgerTransaction';
import { Notification } from '../models/Notification';
import { AuditLog } from '../models/AuditLog';
import { AuthenticatedRequest } from '../types';
import { emitNotification, emitLedgerUpdate } from '../services/socketService';
import { getFarmerBalanceSummary } from './farmerController';
import { generateSettlementId } from '../utils/sequence';



// Admin: Create Bird Sale Settlement
export const createBirdSaleSettlement = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      farmerId,
      batchId,
      settlementDate,
      actualBirds,
      actualTotalKg,
      ratePerKg,
      deductions = 0,
      adjustments = 0,
      postToLedger = true,
      buyerName,
      vehicleNumber,
      notes,
      estimatedChickCost = 0,
      estimatedFeedCost = 0
    } = req.body;
    const user = req.user;

    if (!farmerId || !actualBirds || !actualTotalKg || !ratePerKg) {
      res.status(400).json({
        success: false,
        message: 'Farmer, actual birds, actual total KG, and rate per KG are required.'
      });
      return;
    }

    const farmer = await Farmer.findById(farmerId);
    if (!farmer) {
      res.status(404).json({ success: false, message: 'Farmer not found' });
      return;
    }

    const birds = Number(actualBirds);
    const totalKg = Number(actualTotalKg);
    const rate = Number(ratePerKg);
    const ded = Number(deductions) || 0;
    const adj = Number(adjustments) || 0;

    const avgWeight = totalKg / birds;
    const grossAmount = Math.round((totalKg * rate + Number.EPSILON) * 100) / 100;
    const netCreditAmount = Math.round((grossAmount - ded + adj + Number.EPSILON) * 100) / 100;

    // Gross margin calculation if costs provided
    const totalEstCost = (Number(estimatedChickCost) || 0) + (Number(estimatedFeedCost) || 0);
    const estimatedGrossMargin = totalEstCost > 0 ? netCreditAmount - totalEstCost : 0;

    const settlementId = await generateSettlementId();

    const settlement = await BirdSale.create({
      settlementId,
      farmerId: farmer._id,
      farmerName: farmer.name,
      batchId: batchId || undefined,
      settlementDate: settlementDate ? new Date(settlementDate) : new Date(),
      actualBirds: birds,
      actualTotalKg: totalKg,
      avgWeightKg: Math.round(avgWeight * 100) / 100,
      ratePerKg: rate,
      grossAmount,
      deductions: ded,
      adjustments: adj,
      netCreditAmount,
      isPostedToLedger: postToLedger,
      buyerName,
      vehicleNumber,
      notes,
      estimatedChickCost: Number(estimatedChickCost) || 0,
      estimatedFeedCost: Number(estimatedFeedCost) || 0,
      estimatedGrossMargin,
      createdBy: user?.name || 'ADMIN'
    });

    // Update Linked Batch
    if (batchId) {
      await ChickBatch.findByIdAndUpdate(batchId, {
        status: 'SOLD',
        settledSaleId: settlement._id
      });
    }

    // Post to Ledger
    if (postToLedger) {
      const ledgerTx = await LedgerTransaction.create({
        farmerId: farmer._id,
        farmerName: farmer.name,
        transactionDate: settlementDate ? new Date(settlementDate) : new Date(),
        transactionType: 'BIRD_SALE_CREDIT',
        description: `Chicken Sale #${settlementId}: ${totalKg} KG @ ₹${rate}/KG (Gross ₹${grossAmount} - Ded ₹${ded} + Adj ₹${adj})`,
        descriptionHi: `मुर्गी बिक्री निपटान #${settlementId}: ${totalKg} किग्रा @ ₹${rate}/किग्रा (जमा)`,
        quantity: totalKg,
        unit: 'KG',
        rate,
        debit: 0,
        credit: netCreditAmount,
        referenceId: settlementId,
        referenceType: 'BIRD_SALE',
        notes,
        createdBy: user?.name || 'ADMIN'
      });

      settlement.ledgerTransactionId = ledgerTx._id as any;
      await settlement.save();

      const balanceSummary = await getFarmerBalanceSummary(farmer._id.toString());
      emitLedgerUpdate(farmer._id.toString(), balanceSummary);
    }

    // Notify Farmer
    const notif = await Notification.create({
      recipientRole: 'FARMER',
      recipientId: farmer._id,
      type: 'BIRD_SALE_SETTLEMENT',
      title: 'Bird Sale Settlement Completed / मुर्गी बिक्री निपटान',
      titleHi: 'मुर्गी बिक्री हिसाब पूरा हुआ',
      message: `Settlement #${settlementId}: ${totalKg} KG @ ₹${rate} = ₹${netCreditAmount} credited to your ledger.`,
      messageHi: `निपटान #${settlementId}: ${totalKg} किग्रा @ ₹${rate} = ₹${netCreditAmount} आपके खाते में जमा किया गया।`,
      deepLink: `/farmer/ledger`,
      metadata: { settlementId: settlement._id, netCreditAmount }
    });

    emitNotification(notif);

    await AuditLog.create({
      actorId: user?.userId || 'ADMIN',
      actorName: user?.name || 'Admin',
      actorRole: 'ADMIN',
      action: 'BIRD_SALE_SETTLED',
      entityType: 'BirdSale',
      entityId: settlement._id.toString(),
      details: { settlementId, totalKg, rate, netCreditAmount, farmerId: farmer._id }
    });

    res.status(201).json({
      success: true,
      message: 'Bird sale settlement completed and credit posted to farmer ledger.',
      data: settlement
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "An internal error occurred." });
  }
};

// Get Settlements (Admin gets all, Farmer gets own)
export const getBirdSaleSettlements = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;
    const { farmerId } = req.query;

    const filter: any = {};
    if (user?.role === 'FARMER') {
      filter.farmerId = user.userId;
    } else if (farmerId) {
      filter.farmerId = farmerId;
    }

    const settlements = await BirdSale.find(filter).sort({ settlementDate: -1 });
    res.json({ success: true, data: settlements });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "An internal error occurred." });
  }
};
