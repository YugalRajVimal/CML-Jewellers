import { Schema, model, Document, Types } from 'mongoose';

export type PaymentStatus = 'Created' | 'Pending' | 'Success' | 'Failed' | 'Cancelled';

export const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  Created: ['Pending'],
  Pending: ['Success', 'Failed', 'Cancelled'],
  Success: [],
  Failed: [],
  Cancelled: [],
};

export function canTransitionPayment(from: PaymentStatus, to: PaymentStatus): boolean {
  return PAYMENT_TRANSITIONS[from]?.includes(to) ?? false;
}

export interface IPayment extends Document {
  _id: Types.ObjectId;
  orderId: Types.ObjectId;
  provider: 'cashfree';
  providerRefId: string; // Cashfree order_id (we reuse our orderNumber as their order_id)
  cfPaymentSessionId?: string;
  amount: number;
  status: PaymentStatus;
  verifiedAt?: Date;
  failureReason?: string;
  rawWebhookEvents: { receivedAt: Date; eventType: string; payload: unknown }[];
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    provider: { type: String, enum: ['cashfree'], default: 'cashfree' },
    providerRefId: { type: String, required: true, unique: true, index: true },
    cfPaymentSessionId: { type: String },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['Created', 'Pending', 'Success', 'Failed', 'Cancelled'], default: 'Created', index: true },
    verifiedAt: { type: Date },
    failureReason: { type: String },
    rawWebhookEvents: [
      {
        receivedAt: { type: Date, default: Date.now },
        eventType: { type: String },
        payload: { type: Schema.Types.Mixed },
      },
    ],
  },
  { timestamps: true }
);

export const Payment = model<IPayment>('Payment', paymentSchema);
