import { Schema, model, Document, Types } from 'mongoose';

export type OtpChannel = 'email' | 'sms';
export type OtpPurpose = 'register' | 'login' | 'password_reset' | 'verify_contact';

export interface IOtp extends Document {
  _id: Types.ObjectId;
  identifier: string; // email or phone the OTP was sent to
  channel: OtpChannel;
  purpose: OtpPurpose;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  consumed: boolean;
  lastSentAt: Date;
  createdAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    identifier: { type: String, required: true, index: true },
    channel: { type: String, enum: ['email', 'sms'], required: true },
    purpose: {
      type: String,
      enum: ['register', 'login', 'password_reset', 'verify_contact'],
      required: true,
    },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    consumed: { type: Boolean, default: false },
    lastSentAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// TTL cleanup: auto-remove expired OTP docs 1 hour after expiry
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });
otpSchema.index({ identifier: 1, purpose: 1, consumed: 1 });

export const Otp = model<IOtp>('Otp', otpSchema);
