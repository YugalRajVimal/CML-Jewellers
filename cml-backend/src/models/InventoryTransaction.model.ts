import { Schema, model, Document, Types } from 'mongoose';

export type InventoryTransactionType = 'purchase' | 'sale' | 'return' | 'adjustment' | 'damage' | 'reservation' | 'release';

export interface IInventoryTransaction extends Document {
  _id: Types.ObjectId;
  inventoryId: Types.ObjectId;
  variantId: Types.ObjectId;
  type: InventoryTransactionType;
  qty: number; // positive = stock in, negative = stock out (direction depends on `type`)
  refId?: string; // e.g. orderId, purchaseId, returnId — stringified for flexibility across sources
  note?: string;
  createdAt: Date;
}

const inventoryTransactionSchema = new Schema<IInventoryTransaction>(
  {
    inventoryId: { type: Schema.Types.ObjectId, ref: 'Inventory', required: true, index: true },
    variantId: { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true, index: true },
    type: {
      type: String,
      enum: ['purchase', 'sale', 'return', 'adjustment', 'damage', 'reservation', 'release'],
      required: true,
    },
    qty: { type: Number, required: true },
    refId: { type: String },
    note: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

inventoryTransactionSchema.index({ variantId: 1, createdAt: -1 });

export const InventoryTransaction = model<IInventoryTransaction>('InventoryTransaction', inventoryTransactionSchema);
