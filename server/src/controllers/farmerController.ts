import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Farmer } from '../models/Farmer';
import { LedgerTransaction } from '../models/LedgerTransaction';
import { Order } from '../models/Order';
import { ChickBatch } from '../models/ChickBatch';
import { Conversation } from '../models/Conversation';
import { AuditLog } from '../models/AuditLog';
import { AuthenticatedRequest } from '../types';
import { generateFarmerId, generateTemporaryPassword } from '../utils/helpers';

// Helper to compute live balance for a farmer
export const getFarmerBalanceSummary = async (farmerId: string) => {
  const transactions = await LedgerTransaction.find({
    farmerId,
    isVoided: false
  });

  let totalDebit = 0;
  let totalCredit = 0;

  for (const tx of transactions) {
    totalDebit += tx.debit || 0;
    totalCredit += tx.credit || 0;
  }

  const netBalance = totalDebit - totalCredit; // > 0 = Due (Baki), < 0 = Advance
  return {
    totalDebit,
    totalCredit,
    netBalance,
    isDue: netBalance > 0,
    isAdvance: netBalance < 0,
    amountDue: netBalance > 0 ? netBalance : 0,
    advanceAmount: netBalance < 0 ? Math.abs(netBalance) : 0
  };
};

// Admin: Get all farmers with search & pagination
export const getAllFarmers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const filter: any = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(String(search).trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { farmerId: searchRegex },
        { phone: searchRegex },
        { village: searchRegex },
        { district: searchRegex },
        { farmName: searchRegex }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [farmers, total] = await Promise.all([
      Farmer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Farmer.countDocuments(filter)
    ]);

    // Attach current balance summary to each farmer
    const farmersWithBalance = await Promise.all(
      farmers.map(async (farmer) => {
        const balance = await getFarmerBalanceSummary(farmer._id.toString());
        return {
          ...farmer.toObject(),
          balanceSummary: balance
        };
      })
    );

    res.json({
      success: true,
      data: farmersWithBalance,
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

// Admin: Get Single Farmer
export const getFarmerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const farmer = await Farmer.findById(id);
    if (!farmer) {
      res.status(404).json({ success: false, message: 'Farmer not found' });
      return;
    }

    const [balanceSummary, ordersCount, activeBatches] = await Promise.all([
      getFarmerBalanceSummary(farmer._id.toString()),
      Order.countDocuments({ farmerId: farmer._id }),
      ChickBatch.find({ farmerId: farmer._id, status: { $ne: 'CLOSED' } })
    ]);

    res.json({
      success: true,
      data: {
        ...farmer.toObject(),
        balanceSummary,
        ordersCount,
        activeBatches
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Create Farmer
export const createFarmer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      phone,
      email,
      farmName,
      address,
      village,
      district,
      state = 'Bihar',
      pinCode,
      farmCapacity = 1000,
      notes,
      password // Admin custom password
    } = req.body;

    if (!name || !phone || !address || !village || !district || !pinCode) {
      res.status(400).json({ success: false, message: 'All required address & contact fields must be filled.' });
      return;
    }

    // Auto-generate Farmer ID
    const count = await Farmer.countDocuments();
    const farmerId = generateFarmerId(1001 + count);
    const tempPassword = password && password.trim().length >= 4 ? password.trim() : generateTemporaryPassword(8);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    const farmer = await Farmer.create({
      farmerId,
      username: farmerId,
      passwordHash,
      mustChangePassword: !password, // If admin sets custom password, farmer doesn't necessarily need to change it
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim().toLowerCase() : undefined,
      farmName: farmName ? farmName.trim() : undefined,
      address: address.trim(),
      village: village.trim(),
      district: district.trim(),
      state: state.trim(),
      pinCode: pinCode.trim(),
      farmCapacity: Number(farmCapacity) || 1000,
      notes,
      status: 'ACTIVE'
    });

    // Create a 1-on-1 chat conversation container for this farmer
    await Conversation.create({
      farmerId: farmer._id,
      farmerName: farmer.name,
      lastMessage: 'Welcome to Banshidhar Poultry Farmer Portal!',
      lastMessageAt: new Date()
    });

    // Audit Log
    await AuditLog.create({
      actorId: req.user?.userId || 'ADMIN',
      actorName: req.user?.name || 'Admin',
      actorRole: 'ADMIN',
      action: 'FARMER_CREATED',
      entityType: 'Farmer',
      entityId: farmer._id.toString(),
      details: { farmerId, name: farmer.name, phone: farmer.phone }
    });

    res.status(201).json({
      success: true,
      message: 'Farmer account created successfully.',
      data: farmer,
      credentials: {
        farmerId: farmer.farmerId,
        username: farmer.username,
        temporaryPassword: tempPassword,
        name: farmer.name,
        phone: farmer.phone
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Update Farmer
export const updateFarmer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Do not allow raw password updates via this endpoint
    delete updateData.passwordHash;
    delete updateData.farmerId;

    const farmer = await Farmer.findByIdAndUpdate(id, updateData, { new: true });
    if (!farmer) {
      res.status(404).json({ success: false, message: 'Farmer not found' });
      return;
    }

    await AuditLog.create({
      actorId: req.user?.userId || 'ADMIN',
      actorName: req.user?.name || 'Admin',
      actorRole: 'ADMIN',
      action: 'FARMER_UPDATED',
      entityType: 'Farmer',
      entityId: farmer._id.toString(),
      details: updateData
    });

    res.json({ success: true, message: 'Farmer updated successfully', data: farmer });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Reset Farmer Password
export const resetFarmerPassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const farmer = await Farmer.findById(id);
    if (!farmer) {
      res.status(404).json({ success: false, message: 'Farmer not found' });
      return;
    }

    const finalPassword = newPassword && newPassword.trim().length >= 4 ? newPassword.trim() : generateTemporaryPassword(8);
    const salt = await bcrypt.genSalt(10);
    farmer.passwordHash = await bcrypt.hash(finalPassword, salt);
    farmer.mustChangePassword = false;
    await farmer.save();

    await AuditLog.create({
      actorId: req.user?.userId || 'ADMIN',
      actorName: req.user?.name || 'Admin',
      actorRole: 'ADMIN',
      action: 'FARMER_PASSWORD_RESET',
      entityType: 'Farmer',
      entityId: farmer._id.toString()
    });

    res.json({
      success: true,
      message: 'Password updated successfully.',
      credentials: {
        farmerId: farmer.farmerId,
        username: farmer.username,
        temporaryPassword: finalPassword,
        name: farmer.name,
        phone: farmer.phone
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Delete Farmer Account
export const deleteFarmer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const farmer = await Farmer.findById(id);
    if (!farmer) {
      res.status(404).json({ success: false, message: 'Farmer not found' });
      return;
    }

    // Completely remove farmer from database
    await Farmer.findByIdAndDelete(id);

    // Also remove or clean related conversation
    await Conversation.deleteMany({ farmerId: id });

    await AuditLog.create({
      actorId: req.user?.userId || 'ADMIN',
      actorName: req.user?.name || 'Admin',
      actorRole: 'ADMIN',
      action: 'FARMER_DELETED',
      entityType: 'Farmer',
      entityId: id,
      details: { farmerId: farmer.farmerId, name: farmer.name, phone: farmer.phone }
    });

    res.json({
      success: true,
      message: `Farmer ${farmer.name} (${farmer.farmerId}) has been deleted successfully. They can no longer log in.`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Farmer: Update Own Profile
export const updateOwnProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const farmerId = req.user?.userId;
    const { email, farmName, address, village, district, pinCode, farmCapacity } = req.body;

    const farmer = await Farmer.findByIdAndUpdate(
      farmerId,
      {
        ...(email !== undefined ? { email: email.trim().toLowerCase() } : {}),
        ...(farmName !== undefined ? { farmName } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(village !== undefined ? { village } : {}),
        ...(district !== undefined ? { district } : {}),
        ...(pinCode !== undefined ? { pinCode } : {}),
        ...(farmCapacity !== undefined ? { farmCapacity: Number(farmCapacity) } : {})
      },
      { new: true }
    );

    res.json({ success: true, message: 'Profile updated successfully', data: farmer });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
