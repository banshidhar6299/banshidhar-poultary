import { Request, Response } from 'express';
import { ChickBatch } from '../models/ChickBatch';
import { ChickSupply } from '../models/ChickSupply';
import { Farmer } from '../models/Farmer';
import { LedgerTransaction } from '../models/LedgerTransaction';
import { Notification } from '../models/Notification';
import { AuditLog } from '../models/AuditLog';
import { AuthenticatedRequest } from '../types';
import { emitNotification, emitLedgerUpdate } from '../services/socketService';
import { getFarmerBalanceSummary } from './farmerController';

// Get Batches (Admin gets all/farmer-specific, Farmer gets own)
export const getBatches = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { farmerId, status } = req.query;

    const filter: any = {};
    if (user?.role === 'FARMER') {
      filter.farmerId = user.userId;
    } else if (farmerId) {
      filter.farmerId = farmerId;
    }

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    const batches = await ChickBatch.find(filter).sort({ startDate: -1 });
    res.json({ success: true, data: batches });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Add Chick Supply & Auto-Create Batch & Post Debit
export const addChickSupply = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      farmerId,
      supplyDate,
      breed = 'Broiler (Cobb 500)',
      quantity,
      ratePerChick,
      createNewBatch = true,
      hatcheryName,
      postToLedger = true,
      notes
    } = req.body;
    const user = req.user;

    if (!farmerId || !quantity || !ratePerChick) {
      res.status(400).json({ success: false, message: 'Farmer, quantity, and rate per chick are required.' });
      return;
    }

    const farmer = await Farmer.findById(farmerId);
    if (!farmer) {
      res.status(404).json({ success: false, message: 'Farmer not found' });
      return;
    }

    const qty = Number(quantity);
    const rate = Number(ratePerChick);
    const totalAmount = qty * rate;

    let batchDoc: any = null;
    let batchNumber = '';

    if (createNewBatch) {
      const batchCount = await ChickBatch.countDocuments();
      batchNumber = `BATCH-${new Date().getFullYear()}-${String(batchCount + 1).padStart(3, '0')}`;

      batchDoc = await ChickBatch.create({
        batchNumber,
        farmerId: farmer._id,
        farmerName: farmer.name,
        breed,
        chicksSupplied: qty,
        startDate: supplyDate ? new Date(supplyDate) : new Date(),
        initialChicksCost: totalAmount,
        ratePerChick: rate,
        status: 'ACTIVE',
        notes
      });
    }

    // Create Chick Supply Record
    const supply = await ChickSupply.create({
      farmerId: farmer._id,
      farmerName: farmer.name,
      batchId: batchDoc?._id,
      batchNumber: batchNumber || undefined,
      supplyDate: supplyDate ? new Date(supplyDate) : new Date(),
      breed,
      quantity: qty,
      ratePerChick: rate,
      totalAmount,
      isPostedToLedger: postToLedger,
      hatcheryName,
      notes,
      createdBy: user?.name || 'ADMIN'
    });

    // Post to Ledger
    if (postToLedger) {
      const ledgerTx = await LedgerTransaction.create({
        farmerId: farmer._id,
        farmerName: farmer.name,
        transactionDate: supplyDate ? new Date(supplyDate) : new Date(),
        transactionType: 'CHICK_PURCHASE',
        description: `Chick Supply: ${qty} Chicks (${breed}) @ ₹${rate}`,
        descriptionHi: `चूजा आपूर्ति: ${qty} चूजे (${breed}) @ ₹${rate}`,
        quantity: qty,
        unit: 'Chicks',
        rate,
        debit: totalAmount,
        credit: 0,
        referenceId: batchNumber || supply._id.toString(),
        referenceType: 'CHICK_SUPPLY',
        notes,
        createdBy: user?.name || 'ADMIN'
      });

      supply.ledgerTransactionId = ledgerTx._id as any;
      await supply.save();

      const balanceSummary = await getFarmerBalanceSummary(farmer._id.toString());
      emitLedgerUpdate(farmer._id.toString(), balanceSummary);
    }

    // Notification to Farmer
    const notif = await Notification.create({
      recipientRole: 'FARMER',
      recipientId: farmer._id,
      type: 'CHICK_SUPPLY_ADDED',
      title: 'New Chick Supply Added / चूजा आपूर्ति',
      titleHi: 'नया चूजा बैच प्राप्त हुआ',
      message: `Banshidhar Poultry supplied ${qty} chicks (${breed}) @ ₹${rate}/chick (Total: ₹${totalAmount}).`,
      messageHi: `बंशीधर पोल्ट्री द्वारा ${qty} चूजे (${breed}) @ ₹${rate}/चूजा (कुल: ₹${totalAmount}) जोड़े गए।`,
      deepLink: `/farmer/ledger`,
      metadata: { supplyId: supply._id, batchNumber }
    });

    emitNotification(notif);

    await AuditLog.create({
      actorId: user?.userId || 'ADMIN',
      actorName: user?.name || 'Admin',
      actorRole: 'ADMIN',
      action: 'CHICK_SUPPLY_ADDED',
      entityType: 'ChickSupply',
      entityId: supply._id.toString(),
      details: { farmerId: farmer._id, qty, rate, totalAmount }
    });

    res.status(201).json({
      success: true,
      message: 'Chick supply recorded successfully.',
      data: { supply, batch: batchDoc }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Farmer: Submit Bird Sale Inquiry (Ready for Sale)
export const submitBirdSaleInquiry = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { batchId } = req.params;
    const { approxBirds, approxAvgWeightKg, approxTotalKg, notes } = req.body;
    const user = req.user;

    const batch = await ChickBatch.findById(batchId);
    if (!batch) {
      res.status(404).json({ success: false, message: 'Batch not found' });
      return;
    }

    if (user?.role === 'FARMER' && batch.farmerId.toString() !== user.userId) {
      res.status(403).json({ success: false, message: 'Access denied to this batch.' });
      return;
    }

    batch.saleInquiry = {
      isInquired: true,
      inquiredAt: new Date(),
      approxBirds: Number(approxBirds),
      approxAvgWeightKg: Number(approxAvgWeightKg),
      approxTotalKg: Number(approxTotalKg),
      notes
    };
    batch.status = 'READY_FOR_SALE';
    await batch.save();

    // Notification to Admin
    const notif = await Notification.create({
      recipientRole: 'ADMIN',
      type: 'BIRD_SALE_SETTLEMENT',
      title: `Flock Ready for Sale: ${batch.farmerName}`,
      titleHi: `मुर्गी तैयार सूचना: ${batch.farmerName}`,
      message: `Farmer ${batch.farmerName} submitted sale inquiry for Batch ${batch.batchNumber} (Approx ${approxTotalKg} KG).`,
      messageHi: `किसान ${batch.farmerName} ने बैच ${batch.batchNumber} (लगभग ${approxTotalKg} किग्रा) की बिक्री सूचना दी है।`,
      deepLink: `/admin/farmers/${batch.farmerId}`,
      metadata: { batchId: batch._id, farmerId: batch.farmerId }
    });

    emitNotification(notif);

    res.json({
      success: true,
      message: 'Bird sale inquiry submitted to Banshidhar Poultry.',
      data: batch
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
