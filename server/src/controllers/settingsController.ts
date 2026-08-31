import { Request, Response } from 'express';
import { WebsiteSettings } from '../models/WebsiteSettings';
import { AISettings } from '../models/AISettings';
import { Farmer } from '../models/Farmer';
import { FarmerJoinRequest } from '../models/FarmerJoinRequest';
import { Order } from '../models/Order';
import { LedgerTransaction } from '../models/LedgerTransaction';
import { RateCard } from '../models/RateCard';
import { Conversation } from '../models/Conversation';
import { Notification } from '../models/Notification';
import { AuditLog } from '../models/AuditLog';
import { AuthenticatedRequest } from '../types';
import { processUploadedFile } from '../middlewares/upload';

// Public: Get Website Settings
export const getWebsiteSettings = async (_req: Request, res: Response): Promise<void> => {
  try {
    let settings = await WebsiteSettings.findOne();
    if (!settings) {
      settings = await WebsiteSettings.create({
        whyChooseUs: [
          {
            title: 'Quality Broiler Chicks',
            titleHi: 'उच्च गुणवत्ता वाले चूजे',
            description: 'Healthy, vaccinated day-old chicks from certified high-yield hatcheries.',
            descriptionHi: 'प्रमाणित हैचरी से स्वस्थ, टीकाकरण युक्त एक-दिवसीय चूजे।',
            iconName: 'Award'
          },
          {
            title: 'Balanced Protein Feed',
            titleHi: 'संतुलित प्रोटीन दाना',
            description: 'Scientifically formulated Pre-Starter, Starter, and Finisher feeds for optimal FCR.',
            descriptionHi: 'बेहतर FCR और तेज वजन वृद्धि के लिए वैज्ञानिक रूप से तैयार दाना।',
            iconName: 'PackageCheck'
          },
          {
            title: 'Transparent Market Rates',
            titleHi: 'पारदर्शी बाजार दरें',
            description: 'Daily fair chick and broiler market rates with zero hidden charges.',
            descriptionHi: 'बिना किसी छुपे खर्च के दैनिक निष्पक्ष चूजा और ब्रायलर दरें।',
            iconName: 'TrendingUp'
          },
          {
            title: 'Digital Passbook & Support',
            titleHi: 'डिजिटल खाता व त्वरित सहायता',
            description: 'Instant mobile statement, flock management advice, and prompt bird lifting.',
            descriptionHi: 'मोबाइल पर तुरंत खाता पर्ची, फार्म प्रबंधन सलाह और समय पर मुर्गी उठान।',
            iconName: 'Smartphone'
          }
        ]
      });
    }
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "An internal error occurred." });
  }
};

// Admin: Update Website Settings
export const updateWebsiteSettings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const updateData = { ...req.body };

    // Handle uploaded logo or banner video/poster files
    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (files.logo && files.logo[0]) {
        const res = await processUploadedFile(files.logo[0], 'banshidhar_poultry/brand');
        updateData.logoUrl = res.url;
      }
      if (files.heroVideo && files.heroVideo[0]) {
        const res = await processUploadedFile(files.heroVideo[0], 'banshidhar_poultry/brand');
        updateData.heroVideoUrl = res.url;
      }
      if (files.heroPoster && files.heroPoster[0]) {
        const res = await processUploadedFile(files.heroPoster[0], 'banshidhar_poultry/brand');
        updateData.heroPosterUrl = res.url;
      }
    }

    if (typeof updateData.whyChooseUs === 'string') {
      try {
        updateData.whyChooseUs = JSON.parse(updateData.whyChooseUs);
      } catch {}
    }

    let settings = await WebsiteSettings.findOne();
    if (!settings) {
      settings = await WebsiteSettings.create(updateData);
    } else {
      settings = await WebsiteSettings.findByIdAndUpdate(settings._id, updateData, { new: true });
    }

    await AuditLog.create({
      actorId: req.user?.userId || 'ADMIN',
      actorName: req.user?.name || 'Admin',
      actorRole: 'ADMIN',
      action: 'WEBSITE_SETTINGS_UPDATED',
      entityType: 'WebsiteSettings',
      entityId: settings?._id?.toString()
    });

    res.json({ success: true, message: 'Website settings updated successfully', data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "An internal error occurred." });
  }
};

// Admin: Get AI Settings
export const getAISettings = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let settings = await AISettings.findOne();
    if (!settings) {
      settings = await AISettings.create({});
    }
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "An internal error occurred." });
  }
};

// Admin: Update AI Settings
export const updateAISettings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const updateData = req.body;
    let settings = await AISettings.findOne();
    if (!settings) {
      settings = await AISettings.create(updateData);
    } else {
      settings = await AISettings.findByIdAndUpdate(settings._id, updateData, { new: true });
    }

    await AuditLog.create({
      actorId: req.user?.userId || 'ADMIN',
      actorName: req.user?.name || 'Admin',
      actorRole: 'ADMIN',
      action: 'AI_SETTINGS_UPDATED',
      entityType: 'AISettings',
      entityId: settings?._id?.toString(),
      details: updateData
    });

    res.json({ success: true, message: 'AI settings updated successfully', data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "An internal error occurred." });
  }
};

// Admin: Dashboard Overview Statistics
export const getDashboardStats = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalFarmers,
      activeFarmers,
      pendingJoinRequests,
      todayOrders,
      pendingOrders,
      confirmedOrders,
      deliveredOrders,
      todayRates,
      unreadMessages,
      unreadNotifications,
      transactions
    ] = await Promise.all([
      Farmer.countDocuments(),
      Farmer.countDocuments({ status: 'ACTIVE' }),
      FarmerJoinRequest.countDocuments({ status: 'NEW' }),
      Order.countDocuments({ createdAt: { $gte: startOfToday } }),
      Order.countDocuments({ status: 'PENDING' }),
      Order.countDocuments({ status: 'CONFIRMED' }),
      Order.countDocuments({ status: 'DELIVERED' }),
      RateCard.find({ isActive: true }).sort({ displayOrder: 1 }),
      Conversation.aggregate([{ $group: { _id: null, total: { $sum: '$unreadCountAdmin' } } }]),
      Notification.countDocuments({ recipientRole: 'ADMIN', isRead: false }),
      LedgerTransaction.find({ isVoided: false })
    ]);

    // Calculate Total Receivable (due from farmers) and Total Advance
    // Group transactions by farmerId to get net balance per farmer
    const farmerTotals: Record<string, { debit: number; credit: number }> = {};
    for (const tx of transactions) {
      const fId = tx.farmerId.toString();
      if (!farmerTotals[fId]) farmerTotals[fId] = { debit: 0, credit: 0 };
      farmerTotals[fId].debit += tx.debit || 0;
      farmerTotals[fId].credit += tx.credit || 0;
    }

    let totalReceivable = 0;
    let totalAdvance = 0;

    for (const fId in farmerTotals) {
      const net = farmerTotals[fId].debit - farmerTotals[fId].credit;
      if (net > 0) {
        totalReceivable += net;
      } else if (net < 0) {
        totalAdvance += Math.abs(net);
      }
    }

    res.json({
      success: true,
      data: {
        totalFarmers,
        activeFarmers,
        pendingJoinRequests,
        todayOrders,
        pendingOrders,
        confirmedOrders,
        deliveredOrders,
        totalReceivable: Math.round(totalReceivable * 100) / 100,
        totalAdvance: Math.round(totalAdvance * 100) / 100,
        todayRates,
        unreadMessagesCount: unreadMessages[0]?.total || 0,
        unreadNotificationsCount: unreadNotifications
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "An internal error occurred." });
  }
};
