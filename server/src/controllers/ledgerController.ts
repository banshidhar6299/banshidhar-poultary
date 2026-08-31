import { Request, Response } from 'express';
import { LedgerTransaction } from '../models/LedgerTransaction';
import { Farmer } from '../models/Farmer';
import { WebsiteSettings } from '../models/WebsiteSettings';
import { Notification } from '../models/Notification';
import { AuditLog } from '../models/AuditLog';
import { AuthenticatedRequest, TransactionType } from '../types';
import { generateLedgerPDF } from '../services/pdfService';
import { emitNotification, emitLedgerUpdate } from '../services/socketService';
import { getFarmerBalanceSummary } from './farmerController';

// Get Ledger Statement & Balances (Admin gets any farmer, Farmer gets own)
export const getFarmerLedger = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { farmerId } = req.params;
    const { fromDate, toDate, type, page = 1, limit = 50 } = req.query;

    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (user.role === 'FARMER' && user.userId !== farmerId && user.farmerId !== farmerId) {
      res.status(403).json({ success: false, message: 'Access denied to this ledger.' });
      return;
    }

    const farmer = await Farmer.findById(farmerId);
    if (!farmer) {
      res.status(404).json({ success: false, message: 'Farmer not found' });
      return;
    }

    const filter: any = { farmerId: farmer._id };

    if (type && type !== 'ALL') {
      filter.transactionType = type;
    }

    if (fromDate || toDate) {
      filter.transactionDate = {};
      if (fromDate) filter.transactionDate.$gte = new Date(String(fromDate));
      if (toDate) {
        const endOfDay = new Date(String(toDate));
        endOfDay.setHours(23, 59, 59, 999);
        filter.transactionDate.$lte = endOfDay;
      }
    }

    const [transactions, balanceSummary] = await Promise.all([
      LedgerTransaction.find(filter).sort({ transactionDate: 1, createdAt: 1 }),
      getFarmerBalanceSummary(farmer._id.toString())
    ]);

    // Compute running balance for the filtered list
    let runningBalance = 0;
    const transactionsWithRunningBalance = transactions.map((tx) => {
      if (!tx.isVoided) {
        runningBalance += (tx.debit || 0) - (tx.credit || 0);
      }
      return {
        ...tx.toObject(),
        calculatedRunningBalance: runningBalance
      };
    });

    res.json({
      success: true,
      data: {
        farmer: {
          id: farmer._id,
          farmerId: farmer.farmerId,
          name: farmer.name,
          phone: farmer.phone,
          village: farmer.village,
          district: farmer.district
        },
        balanceSummary,
        transactions: transactionsWithRunningBalance
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Add Ledger Transaction (Payment, Purchase, Adjustment)
export const addLedgerTransaction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      farmerId,
      transactionDate,
      transactionType,
      description,
      descriptionHi,
      quantity,
      unit,
      rate,
      amount,
      referenceId,
      notes
    } = req.body;
    const user = req.user;

    if (!farmerId || !transactionType || !amount || Number(amount) <= 0) {
      res.status(400).json({ success: false, message: 'Farmer, Transaction Type, and valid Amount are required.' });
      return;
    }

    const farmer = await Farmer.findById(farmerId);
    if (!farmer) {
      res.status(404).json({ success: false, message: 'Farmer not found' });
      return;
    }

    const numericAmount = Number(amount);
    let debit = 0;
    let credit = 0;

    // Determine debit vs credit
    if (['PRODUCT_PURCHASE', 'CHICK_PURCHASE', 'ADJUSTMENT_DEBIT'].includes(transactionType)) {
      debit = numericAmount;
    } else {
      credit = numericAmount;
    }

    const defaultDescriptions: Record<TransactionType, { en: string; hi: string }> = {
      PRODUCT_PURCHASE: { en: 'Product Purchase', hi: 'सामग्री / दाना खरीद' },
      CHICK_PURCHASE: { en: 'Chick Supply', hi: 'चूजा आपूर्ति' },
      PAYMENT_RECEIVED: { en: 'Payment Received (Cash/Online)', hi: 'भुगतान प्राप्त (जमा)' },
      ADVANCE_PAYMENT: { en: 'Advance Payment', hi: 'अग्रिम भुगतान (एडवांस)' },
      BIRD_SALE_CREDIT: { en: 'Bird Sale Settlement Credit', hi: 'मुर्गी बिक्री निपटान' },
      ADJUSTMENT_DEBIT: { en: 'Ledger Adjustment (Debit)', hi: 'खाता समायोजन (बकाया)' },
      ADJUSTMENT_CREDIT: { en: 'Ledger Adjustment (Credit)', hi: 'खाता समायोजन (जमा)' },
      DISCOUNT: { en: 'Special Discount / Rebate', hi: 'विशेष छूट / डिस्काउंट' }
    };

    const finalDesc = description?.trim() || defaultDescriptions[transactionType as TransactionType]?.en || 'Ledger Entry';
    const finalDescHi = descriptionHi?.trim() || defaultDescriptions[transactionType as TransactionType]?.hi;

    const transaction = await LedgerTransaction.create({
      farmerId: farmer._id,
      farmerName: farmer.name,
      transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      transactionType,
      description: finalDesc,
      descriptionHi: finalDescHi,
      quantity: quantity ? Number(quantity) : undefined,
      unit,
      rate: rate ? Number(rate) : undefined,
      debit,
      credit,
      referenceId,
      referenceType: 'MANUAL_ADJUSTMENT',
      notes,
      createdBy: user?.name || 'ADMIN'
    });

    const balanceSummary = await getFarmerBalanceSummary(farmer._id.toString());

    // Send Notification to Farmer
    const isPayment = ['PAYMENT_RECEIVED', 'ADVANCE_PAYMENT'].includes(transactionType);
    const notifTitle = isPayment ? 'Payment Received / भुगतान प्राप्त' : 'Account Entry Added / खाता प्रविष्टि';
    const notifMsg = isPayment
      ? `Received payment of ₹${numericAmount} on your Banshidhar Poultry account.`
      : `New entry of ₹${numericAmount} (${finalDesc}) posted to your account.`;

    const notif = await Notification.create({
      recipientRole: 'FARMER',
      recipientId: farmer._id,
      type: isPayment ? 'PAYMENT_ADDED' : 'LEDGER_ADJUSTMENT',
      title: notifTitle,
      message: notifMsg,
      deepLink: `/farmer/ledger`,
      metadata: { transactionId: transaction._id, amount: numericAmount }
    });

    emitNotification(notif);
    emitLedgerUpdate(farmer._id.toString(), balanceSummary);

    await AuditLog.create({
      actorId: user?.userId || 'ADMIN',
      actorName: user?.name || 'Admin',
      actorRole: 'ADMIN',
      action: 'LEDGER_TRANSACTION_ADDED',
      entityType: 'LedgerTransaction',
      entityId: transaction._id.toString(),
      details: { farmerId: farmer._id, type: transactionType, debit, credit }
    });

    res.status(201).json({
      success: true,
      message: 'Ledger transaction recorded successfully.',
      data: transaction,
      balanceSummary
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Void / Reverse Transaction
export const voidTransaction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user = req.user;

    if (!reason) {
      res.status(400).json({ success: false, message: 'Reason for voiding/reversing transaction is required.' });
      return;
    }

    const transaction = await LedgerTransaction.findById(id);
    if (!transaction) {
      res.status(404).json({ success: false, message: 'Transaction not found.' });
      return;
    }

    if (transaction.isVoided) {
      res.status(400).json({ success: false, message: 'This transaction is already voided.' });
      return;
    }

    transaction.isVoided = true;
    transaction.voidReason = reason;
    transaction.voidedAt = new Date();
    transaction.voidedBy = user?.name || 'Admin';
    await transaction.save();

    const balanceSummary = await getFarmerBalanceSummary(transaction.farmerId.toString());
    emitLedgerUpdate(transaction.farmerId.toString(), balanceSummary);

    await AuditLog.create({
      actorId: user?.userId || 'ADMIN',
      actorName: user?.name || 'Admin',
      actorRole: 'ADMIN',
      action: 'LEDGER_TRANSACTION_VOIDED',
      entityType: 'LedgerTransaction',
      entityId: transaction._id.toString(),
      details: { reason, farmerId: transaction.farmerId }
    });

    res.json({
      success: true,
      message: 'Transaction voided successfully with audit record.',
      data: transaction,
      balanceSummary
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Download PDF Statement (Server Generated)
export const downloadStatementPDF = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { farmerId } = req.params;
    const { fromDate, toDate } = req.query;
    const user = req.user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (user.role === 'FARMER' && user.userId !== farmerId && user.farmerId !== farmerId) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    const farmer = await Farmer.findById(farmerId);
    if (!farmer) {
      res.status(404).json({ success: false, message: 'Farmer not found' });
      return;
    }

    let settings = await WebsiteSettings.findOne();
    if (!settings) {
      settings = await WebsiteSettings.create({});
    }

    const filter: any = { farmerId: farmer._id, isVoided: false };
    if (fromDate || toDate) {
      filter.transactionDate = {};
      if (fromDate) filter.transactionDate.$gte = new Date(String(fromDate));
      if (toDate) {
        const endOfDay = new Date(String(toDate));
        endOfDay.setHours(23, 59, 59, 999);
        filter.transactionDate.$lte = endOfDay;
      }
    }

    const transactions = await LedgerTransaction.find(filter).sort({ transactionDate: 1, createdAt: 1 });
    const balanceSummary = await getFarmerBalanceSummary(farmer._id.toString());

    const pdfBuffer = await generateLedgerPDF({
      farmer,
      transactions,
      settings,
      fromDate: fromDate ? String(fromDate) : undefined,
      toDate: toDate ? String(toDate) : undefined,
      totalDebit: balanceSummary.totalDebit,
      totalCredit: balanceSummary.totalCredit,
      netBalance: balanceSummary.netBalance
    });

    const filename = `Statement_${farmer.farmerId}_${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('[PDF Download Error]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get Master Khatabook Overview
export const getAdminKhatabookOverview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { search, filterType = 'ALL' } = req.query;

    // 1. Get all farmers
    const farmerQuery: any = {};
    if (search) {
      const searchRegex = new RegExp(String(search).trim(), 'i');
      farmerQuery.$or = [
        { name: searchRegex },
        { farmerId: searchRegex },
        { phone: searchRegex },
        { village: searchRegex },
        { district: searchRegex },
        { farmName: searchRegex }
      ];
    }

    const farmers = await Farmer.find(farmerQuery).sort({ name: 1 });

    // 2. Compute balances for all farmers
    let totalReceivable = 0;
    let totalAdvance = 0;
    let dueFarmersCount = 0;
    let advanceFarmersCount = 0;
    let settledFarmersCount = 0;

    const farmerKhatas = await Promise.all(
      farmers.map(async (farmer) => {
        const balance = await getFarmerBalanceSummary(farmer._id.toString());
        if (balance.netBalance > 0) {
          totalReceivable += balance.netBalance;
          dueFarmersCount++;
        } else if (balance.netBalance < 0) {
          totalAdvance += Math.abs(balance.netBalance);
          advanceFarmersCount++;
        } else {
          settledFarmersCount++;
        }

        return {
          id: farmer._id,
          farmerId: farmer.farmerId,
          name: farmer.name,
          phone: farmer.phone,
          village: farmer.village,
          district: farmer.district,
          farmName: farmer.farmName,
          status: farmer.status,
          balanceSummary: balance
        };
      })
    );

    // 3. Filter by filterType (DUE, ADVANCE, SETTLED, ALL)
    let filteredKhatas = farmerKhatas;
    if (filterType === 'DUE') {
      filteredKhatas = farmerKhatas.filter((k) => k.balanceSummary.netBalance > 0);
    } else if (filterType === 'ADVANCE') {
      filteredKhatas = farmerKhatas.filter((k) => k.balanceSummary.netBalance < 0);
    } else if (filterType === 'SETTLED') {
      filteredKhatas = farmerKhatas.filter((k) => k.balanceSummary.netBalance === 0);
    }

    // 4. Today's collections
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayPayments = await LedgerTransaction.find({
      isVoided: false,
      transactionType: { $in: ['PAYMENT_RECEIVED', 'ADVANCE_PAYMENT'] },
      transactionDate: { $gte: startOfToday, $lte: endOfToday }
    });

    const todayCollectionAmount = todayPayments.reduce((sum, tx) => sum + (tx.credit || 0), 0);

    // 5. Recent 20 Transactions across dealership
    const recentTransactions = await LedgerTransaction.find()
      .sort({ transactionDate: -1, createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: {
        metrics: {
          totalReceivable,
          totalAdvance,
          todayCollectionAmount,
          totalFarmers: farmers.length,
          dueFarmersCount,
          advanceFarmersCount,
          settledFarmersCount
        },
        farmerKhatas: filteredKhatas,
        recentTransactions
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get all transactions with search, pagination, date, and type filters
export const getAllLedgerTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { farmerId, type, fromDate, toDate, page = 1, limit = 50 } = req.query;
    const filter: any = {};

    if (farmerId && farmerId !== 'ALL') {
      filter.farmerId = farmerId;
    }

    if (type && type !== 'ALL') {
      filter.transactionType = type;
    }

    if (fromDate || toDate) {
      filter.transactionDate = {};
      if (fromDate) filter.transactionDate.$gte = new Date(String(fromDate));
      if (toDate) {
        const endOfDay = new Date(String(toDate));
        endOfDay.setHours(23, 59, 59, 999);
        filter.transactionDate.$lte = endOfDay;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [transactions, total] = await Promise.all([
      LedgerTransaction.find(filter)
        .sort({ transactionDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      LedgerTransaction.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
