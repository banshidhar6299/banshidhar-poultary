import { Request, Response } from 'express';
import { executeAIChat, getAIProvidersHealth } from '../services/aiService';
import { AISettings } from '../models/AISettings';
import { AIChatMessage, AuthenticatedRequest } from '../types';
import { processUploadedFile } from '../middlewares/upload';

// Public / Farmer: Get AI status & config
export const getAIStatus = async (_req: Request, res: Response): Promise<void> => {
  try {
    let settings = await AISettings.findOne();
    if (!settings) {
      settings = await AISettings.create({});
    }

    res.json({
      success: true,
      data: {
        isEnabled: settings.isEnabled,
        emergencyDisclaimerEn: settings.emergencyDisclaimerEn,
        emergencyDisclaimerHi: settings.emergencyDisclaimerHi
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get detailed health & circuit-breaker status of all 3 providers
export const getAIHealth = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const health = await getAIProvidersHealth();
    res.json({
      success: true,
      data: health
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Ask AI Assistant (Text + Image support)
export const chatWithAI = async (req: Request, res: Response): Promise<void> => {
  try {
    let { messages } = req.body;

    // Parse messages if sent as form-data JSON string
    if (typeof messages === 'string') {
      try {
        messages = JSON.parse(messages);
      } catch {
        messages = [{ role: 'user', content: messages }];
      }
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ success: false, message: 'Messages array is required.' });
      return;
    }

    // Check if an image was uploaded with this request
    if (req.file) {
      const uploadRes = await processUploadedFile(req.file, 'banshidhar_poultry/ai');
      const lastMsg = messages[messages.length - 1];
      if (lastMsg) {
        lastMsg.imageUrl = uploadRes.url;
      }
    }

    const aiResult = await executeAIChat(messages as AIChatMessage[]);

    res.json({
      success: true,
      data: {
        reply: aiResult.text,
        providerUsed: aiResult.providerUsed
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
