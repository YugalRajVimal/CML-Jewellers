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
  },
  { timestamps: true }
);

productVariantSchema.index({ productId: 1, isActive: 1 });

export const ProductVariant = model<IProductVariant>('ProductVariant', productVariantSchema);
