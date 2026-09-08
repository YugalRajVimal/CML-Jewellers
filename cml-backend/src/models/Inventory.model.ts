import { Schema, model, Document, Types } from 'mongoose';

export interface IInventory extends Document {
  _id: Types.ObjectId;
  variantId: Types.ObjectId;
  available: number;
  reserved: number;
  sold: number;
  damaged: number;
  returned: number;
  lowStockThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

const inventorySchema = new Schema<IInventory>(
  {
    variantId: { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true, unique: true, index: true },
    available: { type: Number, default: 0, min: 0 },
    reserved: { type: Number, default: 0, min: 0 },
    sold: { type: Number, default: 0, min: 0 },
    damaged: { type: Number, default: 0, min: 0 },
    returned: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5 },
  },
  { timestamps: true }
);

// NOTE: atomic reservation/decrement logic (findOneAndUpdate with conditions to
// prevent overselling under concurrency) is implemented in EPIC 3 alongside
// cart/checkout. This EPIC only establishes the schema and read-side availability.

export const Inventory = model<IInventory>('Inventory', inventorySchema);
