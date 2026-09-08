import { Schema, model, Document, Types } from 'mongoose';

export type ProductStatus = 'draft' | 'active' | 'archived';

export interface IProductAttributes {
  material?: string; // e.g. "Gold", "Silver", "Platinum"
  metal?: string; // e.g. "Yellow Gold", "Rose Gold"
  purity?: string; // e.g. "22K", "18K", "925 Silver"
  stone?: string; // e.g. "Diamond", "Ruby", "None"
  gender?: 'men' | 'women' | 'unisex' | 'kids';
  occasion?: string; // e.g. "Wedding", "Daily Wear", "Festive"
  jewelryType?: string; // e.g. "Ring", "Necklace", "Earrings", "Bangle"
}

export interface IProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  categoryId: Types.ObjectId;
  subcategoryId?: Types.ObjectId;
  collectionId?: Types.ObjectId;
  description?: string;
  basePrice: number;
  mrp: number;
  sku: string;
  attributes: IProductAttributes;
  images: string[];
  status: ProductStatus;
  isFeatured: boolean;
  isNewArrival: boolean;
  ratingAvg: number;
  ratingCount: number;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    subcategoryId: { type: Schema.Types.ObjectId, ref: 'Category', index: true },
    collectionId: { type: Schema.Types.ObjectId, ref: 'Collection', index: true },
    description: { type: String },
    basePrice: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    attributes: {
      material: { type: String, index: true },
      metal: { type: String, index: true },
      purity: { type: String, index: true },
      stone: { type: String, index: true },
      gender: { type: String, enum: ['men', 'women', 'unisex', 'kids'], index: true },
      occasion: { type: String, index: true },
      jewelryType: { type: String, index: true },
    },
    images: { type: [String], default: [] },
    status: { type: String, enum: ['draft', 'active', 'archived'], default: 'draft', index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    isNewArrival: { type: Boolean, default: false, index: true },
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

// Text index for search across name/SKU/description/attributes
productSchema.index(
  { name: 'text', sku: 'text', description: 'text', 'attributes.jewelryType': 'text', 'attributes.material': 'text' },
  { weights: { name: 10, sku: 8, 'attributes.jewelryType': 5, description: 1 }, name: 'product_search_index' }
);

// Common compound indexes for filter+sort combos
productSchema.index({ status: 1, basePrice: 1 });
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ status: 1, categoryId: 1, subcategoryId: 1 });

productSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'active' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

export const Product = model<IProduct>('Product', productSchema);
