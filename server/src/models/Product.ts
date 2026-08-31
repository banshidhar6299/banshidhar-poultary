import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  nameHi: string;
  category: mongoose.Types.ObjectId;
  brand: string;
  imageUrl: string;
  shortDescription: string;
  shortDescriptionHi?: string;
  fullDescription?: string;
  fullDescriptionHi?: string;
  price: number; // in INR (stored as float/paise handled carefully)
  unit: string; // e.g., '50kg Bag', '1kg Bottle', 'Chick', 'Kg'
  unitHi?: string;
  bagWeightKg?: number;
  inStock: boolean;
  isFeatured: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    nameHi: { type: String, default: '', trim: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: false, index: true },
    brand: { type: String, default: 'Banshidhar Quality Feeds' },
    imageUrl: { type: String, default: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=600&q=80' },
    shortDescription: { type: String, default: '' },
    shortDescriptionHi: { type: String, default: '' },
    fullDescription: { type: String, default: '' },
    fullDescriptionHi: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, default: '50kg Bag' },
    unitHi: { type: String, default: '50 किग्रा बोरी' },
    bagWeightKg: { type: Number },
    inStock: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
    displayOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
