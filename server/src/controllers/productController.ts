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

    if (!name || !price) {
      res.status(400).json({
        success: false,
        message: 'Product Name and Price/Rate are required.'
      });
      return;
    }

    const defaultImg =
      'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=600&q=80';

    const product = await Product.create({
      name: name.trim(),
      nameHi: nameHi?.trim() || name.trim(),
      category: category && category !== '' ? category : undefined,
      brand: brand ? brand.trim() : 'Banshidhar Quality Feeds',
      imageUrl: imageUrl || defaultImg,
      shortDescription: shortDescription || name,
      shortDescriptionHi: shortDescriptionHi || nameHi || name,
      fullDescription,
      fullDescriptionHi,
      price: Number(price),
      unit: unit || '50kg Bag',
      unitHi: unitHi || '50 किग्रा बोरी',
      bagWeightKg: bagWeightKg ? Number(bagWeightKg) : undefined,
      inStock: inStock !== undefined ? (inStock === 'true' || inStock === true) : true,
      isFeatured: isFeatured !== undefined ? (isFeatured === 'true' || isFeatured === true) : false,
      isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : true,
      displayOrder: Number(displayOrder) || 0
    });

    res.status(201).json({ success: true, message: 'Product created successfully', data: product });
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

    if (updateData.price !== undefined) updateData.price = Number(updateData.price);
    if (updateData.displayOrder !== undefined) updateData.displayOrder = Number(updateData.displayOrder);
    if (updateData.bagWeightKg !== undefined) updateData.bagWeightKg = Number(updateData.bagWeightKg);
    if (updateData.inStock !== undefined) updateData.inStock = updateData.inStock === 'true' || updateData.inStock === true;
    if (updateData.isFeatured !== undefined) updateData.isFeatured = updateData.isFeatured === 'true' || updateData.isFeatured === true;
    if (updateData.isActive !== undefined) updateData.isActive = updateData.isActive === 'true' || updateData.isActive === true;

    if (!updateData.category || updateData.category === '') {
      delete updateData.category;
    }

    const product = await Product.findByIdAndUpdate(id, updateData, { new: true });

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
