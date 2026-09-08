import { Schema, model, Document, Types } from 'mongoose';

export type PurchaseStatus = 'Draft' | 'Ordered' | 'PartiallyReceived' | 'Received' | 'Cancelled';

export interface IPurchaseItem {
  variantId: Types.ObjectId;
  orderedQty: number;
  receivedQty: number;
  cost: number; // unit cost from supplier
}

export interface IPurchase extends Document {
  _id: Types.ObjectId;
  purchaseNumber: string;
  supplierId: Types.ObjectId;
  items: IPurchaseItem[];
  status: PurchaseStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const purchaseItemSchema = new Schema<IPurchaseItem>(
  {
    variantId: { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    orderedQty: { type: Number, required: true, min: 1 },
    receivedQty: { type: Number, default: 0, min: 0 },
    cost: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const purchaseSchema = new Schema<IPurchase>(
  {
    purchaseNumber: { type: String, required: true, unique: true, index: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    items: { type: [purchaseItemSchema], required: true },
    status: {
      type: String,
      enum: ['Draft', 'Ordered', 'PartiallyReceived', 'Received', 'Cancelled'],
      default: 'Draft',
      index: true,
    },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Purchase = model<IPurchase>('Purchase', purchaseSchema);
