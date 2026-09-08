import { Schema, model, Document, Types } from 'mongoose';

export interface IPermission extends Document {
  _id: Types.ObjectId;
  key: string; // e.g. "product:write"
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const permissionSchema = new Schema<IPermission>(
  {
    key: { type: String, required: true, unique: true, index: true },
    description: { type: String },
  },
  { timestamps: true }
);

export const Permission = model<IPermission>('Permission', permissionSchema);
