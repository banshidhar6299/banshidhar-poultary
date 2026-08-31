import { Request, Response } from 'express';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { AuthenticatedRequest } from '../types';

// Public / Farmer: Get all active categories
export const getActiveCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
    res.json({ success: true, data: categories });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "An internal error occurred." });
  }
};

// Admin: Get all categories
export const getAllCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Category.find().sort({ displayOrder: 1, createdAt: 1 });
    res.json({ success: true, data: categories });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "An internal error occurred." });
  }
};

// Admin: Create Category
export const createCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, nameHi, description, descriptionHi, imageUrl, displayOrder, isActive } = req.body;

    if (!name || !nameHi) {
      res.status(400).json({ success: false, message: 'Category name in English & Hindi is required.' });
      return;
    }

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = await Category.findOne({ slug });
    if (existing) {
      res.status(400).json({ success: false, message: 'Category with this name already exists.' });
      return;
    }

    const category = await Category.create({
      name: name.trim(),
      nameHi: nameHi.trim(),
      slug,
      description,
      descriptionHi,
      imageUrl,
      displayOrder: Number(displayOrder) || 0,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({ success: true, message: 'Category created successfully', data: category });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "An internal error occurred." });
  }
};

// Admin: Update Category
export const updateCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, nameHi, description, descriptionHi, imageUrl, displayOrder, isActive } = req.body;

    const updatePayload: any = {};
    if (name) {
      updatePayload.name = name.trim();
      updatePayload.slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    if (nameHi) updatePayload.nameHi = nameHi.trim();
    if (description !== undefined) updatePayload.description = description;
    if (descriptionHi !== undefined) updatePayload.descriptionHi = descriptionHi;
    if (imageUrl !== undefined) updatePayload.imageUrl = imageUrl;
    if (displayOrder !== undefined) updatePayload.displayOrder = Number(displayOrder);
    if (isActive !== undefined) updatePayload.isActive = isActive;

    const category = await Category.findByIdAndUpdate(id, updatePayload, { new: true });
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    res.json({ success: true, message: 'Category updated successfully', data: category });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "An internal error occurred." });
  }
};

// Admin: Delete Category (Safely checking products)
export const deleteCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete category: ${productCount} products are linked to this category. Reassign or delete products first.`
      });
      return;
    }

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "An internal error occurred." });
  }
};
