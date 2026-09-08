import { Schema, model, Document, Types } from 'mongoose';

export type BannerType = 'hero' | 'promo' | 'category' | 'strip';

export interface IBanner extends Document {
  _id: Types.ObjectId;
  type: BannerType;
  title?: string;
  imageUrl: string;
  ctaText?: string;
  ctaUrl?: string;
  order: number;
  isActive: boolean;
  startsAt?: Date;
  endsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const bannerSchema = new Schema<IBanner>(
  {
    type: { type: String, enum: ['hero', 'promo', 'category', 'strip'], required: true, index: true },
    title: { type: String },
    imageUrl: { type: String, required: true },
    ctaText: { type: String },
    ctaUrl: { type: String },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    startsAt: { type: Date },
    endsAt: { type: Date },
  },
  { timestamps: true }
);

bannerSchema.index({ type: 1, isActive: 1, order: 1 });

export const Banner = model<IBanner>('Banner', bannerSchema);
