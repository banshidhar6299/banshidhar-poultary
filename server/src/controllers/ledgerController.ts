import { Request, Response } from 'express';
import { LedgerTransaction } from '../models/LedgerTransaction';
import { Farmer } from '../models/Farmer';
import { WebsiteSettings } from '../models/WebsiteSettings';
import { Notification } from '../models/Notification';
import { AuditLog } from '../models/AuditLog';
import { AuthenticatedRequest, TransactionType } from '../types';
import { generateLedgerPDF } from '../services/pdfService';
import { emitNotification, emitLedgerUpdate } from '../services/socketService';
import { sendPushToUser } from '../services/pushService';
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

// Admin: Add Ledger Transaction (Payment, Product Issue / Purchase, Adjustment)
export const addLedgerTransaction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      farmerId,
      transactionDate,
      transactionTime,
      transactionType = 'PRODUCT_PURCHASE',
      productId,
      productName,
      description,
      descriptionHi,
      quantity,
      unit,
      rate,
      amount,
      paymentMode,
      referenceId,
      notes
    } = req.body;
    const user = req.user;

    // Calculate numeric amount if quantity and rate are passed
    let finalAmount = Number(amount);
    if ((!finalAmount || isNaN(finalAmount) || finalAmount <= 0) && quantity && rate) {
      finalAmount = Number(quantity) * Number(rate);
    }

    if (!farmerId || !finalAmount || isNaN(finalAmount) || finalAmount <= 0) {
      res.status(400).json({ success: false, message: 'Farmer and a valid Amount (or Quantity & Rate) are required.' });
      return;
    }

    const farmer = await Farmer.findById(farmerId);
    if (!farmer) {
      res.status(404).json({ success: false, message: 'Farmer not found' });
      return;
    }

    let debit = 0;
    let credit = 0;

    // Determine debit vs credit
    if (['PRODUCT_PURCHASE', 'CHICK_PURCHASE', 'ADJUSTMENT_DEBIT'].includes(transactionType)) {
      debit = finalAmount;
    } else {
      credit = finalAmount;
    }

    // Compose intelligent descriptions
    let autoDesc = description?.trim();
    let autoDescHi = descriptionHi?.trim();

    if (!autoDesc) {
      if (transactionType === 'PRODUCT_PURCHASE' && productName) {
        const qtyStr = quantity ? `${quantity} ${unit || 'Units'}` : '';
        const rateStr = rate ? `@ ₹${rate}` : '';
        autoDesc = `${productName}${qtyStr ? ` (${qtyStr}${rateStr ? ` ${rateStr}` : ''})` : ''}`;
        autoDescHi = `${productName}${qtyStr ? ` (${qtyStr}${rateStr ? ` ${rateStr}` : ''})` : ''}`;
      } else if (transactionType === 'PAYMENT_RECEIVED') {
        const modeStr = paymentMode ? ` (${paymentMode})` : '';
        autoDesc = `Payment Received${modeStr}`;
        autoDescHi = `भुगतान प्राप्त${modeStr}`;
      } else {
        const defaultDescriptions: Record<string, { en: string; hi: string }> = {
          PRODUCT_PURCHASE: { en: 'Product Purchase / Goods Issued', hi: 'सामान दिया / दाना खरीद' },
          CHICK_PURCHASE: { en: 'Chick Supply', hi: 'चूजा आपूर्ति' },
          PAYMENT_RECEIVED: { en: 'Payment Received', hi: 'भुगतान प्राप्त (जमा)' },
          ADVANCE_PAYMENT: { en: 'Advance Payment', hi: 'अग्रिम भुगतान (एडवांस)' },
          BIRD_SALE_CREDIT: { en: 'Bird Sale Settlement Credit', hi: 'मुर्गी बिक्री निपटान' },
          ADJUSTMENT_DEBIT: { en: 'Ledger Adjustment (Debit)', hi: 'खाता समायोजन (बकाया)' },
          ADJUSTMENT_CREDIT: { en: 'Ledger Adjustment (Credit)', hi: 'खाता समायोजन (जमा)' },
          DISCOUNT: { en: 'Special Discount / Rebate', hi: 'विशेष छूट / डिस्काउंट' }
        };
        autoDesc = defaultDescriptions[transactionType]?.en || 'Ledger Entry';
        autoDescHi = defaultDescriptions[transactionType]?.hi || 'खाता प्रविष्टि';
      }
    }

    // Combine date and time if separate
    let finalTxDate = new Date();
    if (transactionDate) {
      if (transactionTime && typeof transactionDate === 'string' && !transactionDate.includes('T')) {
        finalTxDate = new Date(`${transactionDate}T${transactionTime}:00`);
      } else {
        finalTxDate = new Date(transactionDate);
      }
    }

    const transaction = await LedgerTransaction.create({
      farmerId: farmer._id,
      farmerName: farmer.name,
      transactionDate: isNaN(finalTxDate.getTime()) ? new Date() : finalTxDate,
      transactionType,
      productId: productId && productId !== '' ? productId : undefined,
      productName: productName || undefined,
      description: autoDesc,
      descriptionHi: autoDescHi,
      quantity: quantity ? Number(quantity) : undefined,
      unit: unit || undefined,
      rate: rate ? Number(rate) : undefined,
      paymentMode: paymentMode || undefined,
      debit,
      credit,
      referenceId,
      referenceType: transactionType === 'PAYMENT_RECEIVED' ? 'PAYMENT' : 'MANUAL_ADJUSTMENT',
      notes,
      createdBy: user?.name || 'ADMIN'
    });

    const balanceSummary = await getFarmerBalanceSummary(farmer._id.toString());

    // Send Notification to Farmer
    const isPayment = ['PAYMENT_RECEIVED', 'ADVANCE_PAYMENT'].includes(transactionType);
    const isBirdSale = transactionType === 'BIRD_SALE_CREDIT';
    const isDiscount = transactionType === 'DISCOUNT';
    const isCreditAdj = transactionType === 'ADJUSTMENT_CREDIT';
    
    let notifTitle = 'Account Entry Added / खाता प्रविष्टि';
    let notifMsg = `New entry of ₹${finalAmount} (${autoDesc}) posted to your account.`;
    let pushTitle = '🌾 नया सामान / दाना आपके खाते में जुड़ा';
    let pushBody = `डीलर द्वारा ${autoDescHi || autoDesc} (₹${finalAmount}) आपके खाते में नामे (Debit) किया गया।`;

    if (isPayment) {
      notifTitle = 'Payment Received / भुगतान प्राप्त';
      notifMsg = `Received payment of ₹${finalAmount} on your Banshidhar Poultry account. (${autoDesc})`;
      pushTitle = '✅ भुगतान जमा सफल (रसीद)';
      pushBody = `डीलर द्वारा ₹${finalAmount} का भुगतान जमा (${autoDescHi || autoDesc}) आपके खाते में दर्ज किया गया।`;
    } else if (isBirdSale) {
      notifTitle = 'Chicken Sale Credit / बड़ा मुर्गा बिक्री जमा';
      notifMsg = `A credit of ₹${finalAmount} for chicken sale/lifting (${autoDesc}) has been credited to your account.`;
      pushTitle = '🐔 बड़ा मुर्गा बिक्री राशि जमा हुई';
      pushBody = `डीलर द्वारा ${autoDescHi || autoDesc} (₹${finalAmount}) आपके खाते में जमा किया गया।`;
    } else if (isDiscount) {
      notifTitle = 'Special Discount / विशेष छूट';
      notifMsg = `A special discount of ₹${finalAmount} (${autoDesc}) has been credited to your account.`;
      pushTitle = '🎉 विशेष छूट प्रदान की गई';
      pushBody = `डीलर द्वारा ₹${finalAmount} की विशेष छूट आपके खाते में जमा की गई है।`;
    } else if (isCreditAdj) {
      notifTitle = 'Credit Adjustment / जमा समायोजन';
      notifMsg = `An adjustment credit of ₹${finalAmount} (${autoDesc}) has been applied to your account.`;
      pushTitle = '⚖️ जमा समायोजन प्रविष्टि';
      pushBody = `₹${finalAmount} का जमा समायोजन (${autoDescHi || autoDesc}) आपके खाते में दर्ज किया गया।`;
    } else if (transactionType === 'ADJUSTMENT_DEBIT') {
      notifTitle = 'Account Debit / नामे / उधारी प्रविष्टि';
      notifMsg = `An amount of ₹${finalAmount} (${autoDesc}) has been debited to your account.`;
      pushTitle = '💸 उधारी / नकद राशि दर्ज हुई';
      pushBody = `डीलर द्वारा ₹${finalAmount} (${autoDescHi || autoDesc}) आपके खाते में नामे (Debit) किया गया।`;
    }

    const notif = await Notification.create({
      recipientRole: 'FARMER',
      recipientId: farmer._id,
      type: isPayment ? 'PAYMENT_ADDED' : 'LEDGER_ADJUSTMENT',
      title: notifTitle,
      message: notifMsg,
      deepLink: `/farmer/ledger`,
      metadata: { transactionId: transaction._id, amount: finalAmount }
    });

    emitNotification(notif);
    emitLedgerUpdate(farmer._id.toString(), balanceSummary);

    // Dispatch Web Push Notification in Natural Hindi to Farmer
    sendPushToUser(farmer._id.toString(), {
      title: pushTitle,
      body: pushBody,
      url: '/farmer/ledger',
      tag: `ledger-${transaction._id}`
    }).catch((err) => console.error('Push error:', err));

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
