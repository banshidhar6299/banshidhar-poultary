import { Request, Response } from 'express';
import { Product } from '../models/Product';
import { AuthenticatedRequest } from '../types';
import { processUploadedFile } from '../middlewares/upload';

// Public: Get all active catalogue products
export const getActiveProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, featured } = req.query;
    const filter: any = { isActive: true };

    if (category) filter.category = category;
    if (featured === 'true') filter.isFeatured = true;

    const products = await Product.find(filter)
      .populate('category', 'name nameHi slug')
      .sort({ displayOrder: 1, createdAt: -1 });

    res.json({ success: true, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get all products with search & pagination
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search, page = 1, limit = 50 } = req.query;
    const filter: any = {};

    if (category && category !== 'ALL') filter.category = category;
    if (search) {
      const regex = new RegExp(String(search).trim(), 'i');
      filter.$or = [{ name: regex }, { nameHi: regex }, { brand: regex }];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name nameHi slug')
        .sort({ displayOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: products,
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

// Admin: Get single product
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate('category', 'name nameHi slug');
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    res.json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Create Product
export const createProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let {
      name,
      nameHi,
      category,
      brand,
      imageUrl,
      shortDescription,
      shortDescriptionHi,
      fullDescription,
      fullDescriptionHi,
      price,
      unit,
      unitHi,
      bagWeightKg,
      inStock,
      isFeatured,
      isActive,
      displayOrder
    } = req.body;

    if (req.file) {
      const uploadRes = await processUploadedFile(req.file, 'banshidhar_poultry/products');
      imageUrl = uploadRes.url;
    }

    if (!name || !nameHi || !category || !price || !imageUrl) {
      res.status(400).json({
        success: false,
        message: 'Name (EN & HI), Category, Price, and Product Image are required.'
      });
      return;
    }

    const product = await Product.create({
      name: name.trim(),
      nameHi: nameHi.trim(),
      category,
      brand: brand ? brand.trim() : 'Banshidhar Quality Feeds',
      imageUrl,
      shortDescription: shortDescription || name,
      shortDescriptionHi,
      fullDescription,
      fullDescriptionHi,
      price: Number(price),
      unit: unit || '50kg Bag',
      unitHi: unitHi || '50 किग्रा बोरी',
      bagWeightKg: bagWeightKg ? Number(bagWeightKg) : undefined,
      inStock: inStock !== undefined ? inStock : true,
      isFeatured: isFeatured !== undefined ? isFeatured : false,
      isActive: isActive !== undefined ? isActive : true,
      displayOrder: Number(displayOrder) || 0
    });

    const populated = await Product.findById(product._id).populate('category', 'name nameHi');
    res.status(201).json({ success: true, message: 'Product created successfully', data: populated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Update Product
export const updateProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (req.file) {
      const uploadRes = await processUploadedFile(req.file, 'banshidhar_poultry/products');
      updateData.imageUrl = uploadRes.url;
    }

    if (updateData.price) updateData.price = Number(updateData.price);
    if (updateData.displayOrder) updateData.displayOrder = Number(updateData.displayOrder);
    if (updateData.bagWeightKg) updateData.bagWeightKg = Number(updateData.bagWeightKg);

    const product = await Product.findByIdAndUpdate(id, updateData, { new: true }).populate(
      'category',
      'name nameHi'
    );

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    res.json({ success: true, message: 'Product updated successfully', data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Delete Product
export const deleteProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
