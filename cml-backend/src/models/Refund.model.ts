import { Schema, model, Document, Types } from 'mongoose';

export type RefundStatus = 'Initiated' | 'Processing' | 'Completed' | 'Failed';

/** 'cashfree' = money is moved through the payment gateway; 'manual' = paid back
 * outside the gateway (e.g. COD orders, which have no Payment record) and marked
 * Processing/Completed by an admin. */
export type RefundMethod = 'cashfree' | 'manual';

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
  // Absent for manual (COD) refunds — there is no gateway Payment to refund against.
  paymentId?: Types.ObjectId;
  orderId?: Types.ObjectId;
  returnId?: Types.ObjectId;
  amount: number;
  method: RefundMethod;
  status: RefundStatus;
  providerRefundId?: string;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const refundSchema = new Schema<IRefund>(
  {
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', index: true },
    returnId: { type: Schema.Types.ObjectId, ref: 'Return', index: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: ['cashfree', 'manual'], default: 'cashfree' },
    status: { type: String, enum: ['Initiated', 'Processing', 'Completed', 'Failed'], default: 'Initiated', index: true },
    providerRefundId: { type: String },
    failureReason: { type: String },
  },
  { timestamps: true }
);

export const Refund = model<IRefund>('Refund', refundSchema);