import { Schema, model, Document, Types } from 'mongoose';

export type RefundStatus = 'Initiated' | 'Processing' | 'Completed' | 'Failed';

export const REFUND_TRANSITIONS: Record<RefundStatus, RefundStatus[]> = {
  Initiated: ['Processing', 'Failed'],
  Processing: ['Completed', 'Failed'],
  Completed: [],
  Failed: [],
};

export function canTransitionRefund(from: RefundStatus, to: RefundStatus): boolean {
  return REFUND_TRANSITIONS[from]?.includes(to) ?? false;
}

export interface IRefund extends Document {
  _id: Types.ObjectId;
  paymentId: Types.ObjectId;
  returnId?: Types.ObjectId;
  amount: number;
  status: RefundStatus;
  providerRefundId?: string;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const refundSchema = new Schema<IRefund>(
  {
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true, index: true },
    returnId: { type: Schema.Types.ObjectId, ref: 'Return', index: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['Initiated', 'Processing', 'Completed', 'Failed'], default: 'Initiated', index: true },
    providerRefundId: { type: String },
    failureReason: { type: String },
  },
  { timestamps: true }
);

export const Refund = model<IRefund>('Refund', refundSchema);
