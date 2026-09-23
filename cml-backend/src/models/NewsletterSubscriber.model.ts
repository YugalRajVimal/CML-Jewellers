import { Schema, model, Document } from 'mongoose';

export interface INewsletterSubscriber extends Document {
  email: string;
  source: 'newsletter_band' | 'first_visit_modal';
  createdAt: Date;
  updatedAt: Date;
}

const newsletterSubscriberSchema = new Schema<INewsletterSubscriber>(
  {
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 200 },
    source: { type: String, enum: ['newsletter_band', 'first_visit_modal'], required: true },
  },
  { timestamps: true }
);

export const NewsletterSubscriber = model<INewsletterSubscriber>(
  'NewsletterSubscriber',
  newsletterSubscriberSchema
);