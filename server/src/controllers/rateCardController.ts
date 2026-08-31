import { Request, Response } from 'express';
import { RateCard } from '../models/RateCard';
import { AuthenticatedRequest } from '../types';

// Public / Farmer: Get all active rates
export const getActiveRates = async (_req: Request, res: Response): Promise<void> => {
  try {
    const rates = await RateCard.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
    res.json({ success: true, data: rates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get all rates
export const getAllRates = async (_req: Request, res: Response): Promise<void> => {
  try {
    const rates = await RateCard.find().sort({ displayOrder: 1, createdAt: 1 });
    res.json({ success: true, data: rates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Create Rate Card
export const createRateCard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, titleHi, rate, unit, unitHi, effectiveDate, note, noteHi, isActive, displayOrder } = req.body;

    if (!title || !titleHi || rate === undefined) {
      res.status(400).json({ success: false, message: 'Title, Hindi Title, and Rate are required.' });
      return;
    }

    const rateCard = await RateCard.create({
      title: title.trim(),
      titleHi: titleHi.trim(),
      rate: Number(rate),
      unit: unit || 'per Chick',
      unitHi: unitHi || 'प्रति चूजा',
      effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
      note,
      noteHi,
      isActive: isActive !== undefined ? isActive : true,
      displayOrder: Number(displayOrder) || 0
    });

    res.status(201).json({ success: true, message: 'Rate updated successfully', data: rateCard });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Update Rate Card
export const updateRateCard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.rate !== undefined) updateData.rate = Number(updateData.rate);
    if (updateData.displayOrder !== undefined) updateData.displayOrder = Number(updateData.displayOrder);
    if (updateData.effectiveDate) updateData.effectiveDate = new Date(updateData.effectiveDate);

    const rateCard = await RateCard.findByIdAndUpdate(id, updateData, { new: true });
    if (!rateCard) {
      res.status(404).json({ success: false, message: 'Rate card not found' });
      return;
    }

    res.json({ success: true, message: 'Rate updated successfully', data: rateCard });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Delete Rate Card
export const deleteRateCard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const rateCard = await RateCard.findByIdAndDelete(id);
    if (!rateCard) {
      res.status(404).json({ success: false, message: 'Rate card not found' });
      return;
    }
    res.json({ success: true, message: 'Rate card deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
