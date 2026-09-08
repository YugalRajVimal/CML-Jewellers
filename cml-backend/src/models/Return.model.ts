import { Schema, model, Document, Types } from 'mongoose';

export type ReturnStatus = 'Requested' | 'Approved' | 'PickedUp' | 'Received' | 'Inspected' | 'Refunded' | 'Rejected' | 'Cancelled';

export const RETURN_TRANSITIONS: Record<ReturnStatus, ReturnStatus[]> = {
  Requested: ['Approved', 'Rejected', 'Cancelled'],
  Approved: ['PickedUp', 'Rejected', 'Cancelled'],
  PickedUp: ['Received'],
  Received: ['Inspected'],
  Inspected: ['Refunded'],
  Refunded: [],
  Rejected: [],
  Cancelled: [],
};

export function canTransitionReturn(from: ReturnStatus, to: ReturnStatus): boolean {
  return RETURN_TRANSITIONS[from]?.includes(to) ?? false;
}

export interface IReturnItem {
  orderItemProductId: Types.ObjectId;
  variantId: Types.ObjectId;
  qty: number;
  reason: string;
}

export interface IReturn extends Document {
  _id: Types.ObjectId;
  orderId: Types.ObjectId;
  userId: Types.ObjectId;
  items: IReturnItem[];
  reason: string;
  status: ReturnStatus;
  inspectionNotes?: string;
  rejectionReason?: string;
  refundId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const returnItemSchema = new Schema<IReturnItem>(
  {
    orderItemProductId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    qty: { type: Number, required: true, min: 1 },
    reason: { type: String, required: true },
  },
  { _id: false }
);

const returnSchema = new Schema<IReturn>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [returnItemSchema], required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['Requested', 'Approved', 'PickedUp', 'Received', 'Inspected', 'Refunded', 'Rejected', 'Cancelled'],
      default: 'Requested',
      index: true,
    },
    inspectionNotes: { type: String },
    rejectionReason: { type: String },
    refundId: { type: Schema.Types.ObjectId, ref: 'Refund' },
  },
  { timestamps: true }
);

export const Return = model<IReturn>('Return', returnSchema);
