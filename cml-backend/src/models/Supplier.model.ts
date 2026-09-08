import { Schema, model, Document, Types } from 'mongoose';

export interface ISupplier extends Document {
  _id: Types.ObjectId;
  name: string;
  contact: {
    email?: string;
    phone?: string;
    contactPerson?: string;
  };
  address: {
    line1?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const supplierSchema = new Schema<ISupplier>(
  {
    name: { type: String, required: true, trim: true },
    contact: {
      email: { type: String },
      phone: { type: String },
      contactPerson: { type: String },
    },
    address: {
      line1: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
      country: { type: String, default: 'India' },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Supplier = model<ISupplier>('Supplier', supplierSchema);
