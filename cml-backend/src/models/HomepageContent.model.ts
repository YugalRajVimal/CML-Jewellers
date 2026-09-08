import { Schema, model, Document, Types } from 'mongoose';

export interface IHomepageContent extends Document {
  _id: Types.ObjectId;
  section: string; // e.g. "featured_collections", "testimonials", "newsletter_band"
  title?: string;
  data: unknown; // flexible per-section payload — shape owned by the frontend
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const homepageContentSchema = new Schema<IHomepageContent>(
  {
    section: { type: String, required: true, unique: true, index: true },
    title: { type: String },
    data: { type: Schema.Types.Mixed, default: {} },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const HomepageContent = model<IHomepageContent>('HomepageContent', homepageContentSchema);
