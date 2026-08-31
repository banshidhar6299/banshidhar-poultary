import { Request, Response } from 'express';
import { executeAIChat, getAIProvidersHealth } from '../services/aiService';
import { AISettings } from '../models/AISettings';
import { AIChatMessage, AuthenticatedRequest } from '../types';
import { processUploadedFile, AI_IMAGE_MAX_BYTES, validateFileSignature } from '../middlewares/upload';
import { logger } from '../utils/logger';
import fs from 'fs';

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
    logger.error('AI', 'Get AI status error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch AI status.' });
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
    logger.error('AI', 'Get AI health error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch AI health.' });
  }
};

// Authenticated: Ask AI Assistant (Text + Image support)
export const chatWithAI = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    // ── Enforce limits ─────────────────────────────────────────────────
    if (messages.length > 10) {
      res.status(400).json({ success: false, message: 'Maximum 10 messages per request.' });
      return;
    }

    // Validate roles, content length, strip remote imageUrls
    const validRoles = ['user', 'assistant', 'system'];
    let totalLen = 0;
    for (const msg of messages) {
      if (!validRoles.includes(msg.role)) {
        res.status(400).json({ success: false, message: `Invalid message role: ${msg.role}` });
        return;
      }
      if (typeof msg.content !== 'string' || msg.content.length > 2000) {
        res.status(400).json({ success: false, message: 'Each message must be a string of max 2000 characters.' });
        return;
      }
      totalLen += msg.content.length;
      // Prevent arbitrary client-provided remote image URLs
      if (msg.imageUrl && !msg.imageUrl.startsWith('data:') && !msg.imageUrl.startsWith('blob:')) {
        delete msg.imageUrl;
      }
    }

    if (totalLen > 10000) {
      res.status(400).json({ success: false, message: 'Total message content too large (max 10,000 characters).' });
      return;
    }

    // Check if an image was uploaded with this request
    if (req.file) {
      // Validate AI image: only genuine image formats, max 5MB
      const allowedAIMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedAIMimes.includes(req.file.mimetype)) {
        // Clean up temp file
        try { fs.unlinkSync(req.file.path); } catch {}
        res.status(400).json({ success: false, message: 'AI only accepts JPEG, PNG, WebP, or GIF images.' });
        return;
      }
      if (req.file.size > AI_IMAGE_MAX_BYTES) {
        try { fs.unlinkSync(req.file.path); } catch {}
        res.status(400).json({ success: false, message: 'AI image must be under 5MB.' });
        return;
      }
      if (!validateFileSignature(req.file.path, req.file.mimetype)) {
        try { fs.unlinkSync(req.file.path); } catch {}
        res.status(400).json({ success: false, message: 'Image file content does not match declared type.' });
        return;
      }

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
        reply: aiResult.text
        // Do not expose providerUsed to normal users
      }
    });
  } catch (error: any) {
    logger.error('AI', 'Chat error', error);
    res.status(500).json({ success: false, message: 'AI service temporarily unavailable. Please try again.' });
  }
};
