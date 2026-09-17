import { Schema, model, Document, Types } from 'mongoose';

export interface IVariantAttributes {
  size?: string;
  color?: string;
  [key: string]: string | undefined;
}

export interface IProductVariant extends Document {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  sku: string;
  attributes: IVariantAttributes;
  price: number;
  mrp: number;
  images: string[];
  isActive: boolean;
  // Shiprocket's order-creation API requires weight + dimensions per
  // shipment. Optional here because existing variants won't have them yet —
  // shiprocket.service.ts falls back to a configurable default package size
  // when any of these are missing (see DEFAULT_PACKAGE in that file), so
  // shipment creation doesn't hard-fail for un-backfilled products.
  weightKg?: number;
  lengthCm?: number;
  breadthCm?: number;
  heightCm?: number;
  createdAt: Date;
  updatedAt: Date;
}

const productVariantSchema = new Schema<IProductVariant>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    attributes: { type: Schema.Types.Mixed, default: {} },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    images: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    weightKg: { type: Number, min: 0 },
    lengthCm: { type: Number, min: 0 },
    breadthCm: { type: Number, min: 0 },
    heightCm: { type: Number, min: 0 },
  },
  { timestamps: true }
);

productVariantSchema.index({ productId: 1, isActive: 1 });

export const ProductVariant = model<IProductVariant>('ProductVariant', productVariantSchema);
