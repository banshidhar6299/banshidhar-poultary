import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { FarmerJoinRequest } from '../models/FarmerJoinRequest';
import { Farmer } from '../models/Farmer';
import { Conversation } from '../models/Conversation';
import { Notification } from '../models/Notification';
import { AuditLog } from '../models/AuditLog';
import { AuthenticatedRequest } from '../types';
import { generateFarmerId, generateTemporaryPassword } from '../utils/helpers';
import { emitNotification } from '../services/socketService';
import { sendPushToRole } from '../services/pushService';

// Public: Submit Farmer Join Request
export const submitJoinRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      fullName,
      phone,
      email,
      farmName,
      farmAddress,
      village,
      district,
      state = 'Bihar',
      pinCode,
      farmSize,
      farmerType = 'NEW',
      expectedChicks,
      message
    } = req.body;

    if (!fullName || !phone || !farmAddress || !village || !district || !pinCode) {
      res.status(400).json({ success: false, message: 'Please fill all required fields.' });
      return;
    }

    const joinRequest = await FarmerJoinRequest.create({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email ? email.trim().toLowerCase() : undefined,
      farmName: farmName ? farmName.trim() : undefined,
      farmAddress: farmAddress.trim(),
      village: village.trim(),
      district: district.trim(),
      state: state.trim(),
      pinCode: pinCode.trim(),
      farmSize,
      farmerType,
      expectedChicks: Number(expectedChicks) || 500,
      message,
      status: 'NEW'
    });

    // Create In-App Notification for Admin
    const notification = await Notification.create({
      recipientRole: 'ADMIN',
      type: 'JOIN_REQUEST',
      title: 'New Farmer Join Application',
      titleHi: 'नया किसान पंजीकरण आवेदन',
      message: `${fullName} from ${village}, ${district} submitted an application.`,
      messageHi: `${fullName} (${village}, ${district}) ने जुड़ने के लिए आवेदन किया है।`,
      deepLink: '/admin/join-requests',
      metadata: { requestId: joinRequest._id }
    });

    emitNotification(notification);

    // Push to Admin in Hindi
    sendPushToRole('ADMIN', {
      title: `🌾 नया किसान पंजीकरण: ${fullName}`,
      body: `${fullName} (${village}, ${district}, फोन: ${phone}) ने जुड़ने का आवेदन भेजा है।`,
      url: '/admin/join-requests',
      tag: `join-${joinRequest._id}`
    }).catch((err) => console.error('Push error:', err));

    res.status(201).json({
      success: true,
      message: 'Your registration request has been submitted successfully! Banshidhar Poultry will contact you shortly.',
      data: joinRequest
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "An internal error occurred." });
  }
};

// Admin: Get all join requests
export const getAllJoinRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const filter: any = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(String(search).trim(), 'i');
      filter.$or = [
        { fullName: searchRegex },
        { phone: searchRegex },
        { village: searchRegex },
        { district: searchRegex }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [requests, total] = await Promise.all([
      FarmerJoinRequest.find(filter)
        .populate('createdFarmerId', 'farmerId name phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      FarmerJoinRequest.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: requests,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "An internal error occurred." });
  }
};

// Admin: Update Join Request Status
export const updateJoinRequestStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const request = await FarmerJoinRequest.findByIdAndUpdate(
      id,
      {
        ...(status ? { status } : {}),
        ...(adminNotes !== undefined ? { adminNotes } : {})
      },
      { new: true }
    );

    if (!request) {
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }

    res.json({ success: true, message: 'Status updated successfully', data: request });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "An internal error occurred." });
  }
};

// Admin: Convert Join Request to Active Farmer
export const convertToFarmer = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const request = await FarmerJoinRequest.findById(id);

    if (!request) {
      res.status(404).json({ success: false, message: 'Join request not found.' });
      return;
    }

    if (request.createdFarmerId) {
      res.status(400).json({ success: false, message: 'This request has already been converted to a farmer account.' });
      return;
    }

    const count = await Farmer.countDocuments();
    const farmerId = generateFarmerId(1001 + count);
    const tempPassword = generateTemporaryPassword(8);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    const farmer = await Farmer.create({
      farmerId,
      username: farmerId,
      passwordHash,
      mustChangePassword: true,
      name: request.fullName,
      phone: request.phone,
      email: request.email,
      farmName: request.farmName,
      address: request.farmAddress,
      village: request.village,
      district: request.district,
      state: request.state,
      pinCode: request.pinCode,
      farmCapacity: request.expectedChicks || 1000,
      notes: `Converted from Join Request: ${request.message || 'N/A'}`
    });

    await Conversation.create({
      farmerId: farmer._id,
      farmerName: farmer.name,
      lastMessage: 'Welcome to Banshidhar Poultry Farmer Portal!',
      lastMessageAt: new Date()
    });

    request.status = 'APPROVED';
    request.createdFarmerId = farmer._id as any;
    await request.save();

    await AuditLog.create({
      actorId: req.user?.userId || 'ADMIN',
      actorName: req.user?.name || 'Admin',
      actorRole: 'ADMIN',
      action: 'JOIN_REQUEST_CONVERTED',
      entityType: 'Farmer',
      entityId: farmer._id.toString(),
      details: { requestId: request._id, farmerId }
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
    res.status(500).json({ success: false, message: "An internal error occurred." });
  }
};
