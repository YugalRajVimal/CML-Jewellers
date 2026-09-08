import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  adminUserId: Types.ObjectId;
  action: string; // e.g. "product.update"
  resource: string; // e.g. "Product"
  resourceId?: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    adminUserId: { type: Schema.Types.ObjectId, ref: 'AdminUser', required: true, index: true },
    action: { type: String, required: true },
    resource: { type: String, required: true },
    resourceId: { type: String },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    ip: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ resource: 1, resourceId: 1 });

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
