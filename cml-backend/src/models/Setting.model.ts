import { Schema, model, Document } from 'mongoose';
import { env } from '../config/env';

/**
 * Single-document collection for site-wide toggles that need to change at
 * runtime without a redeploy. Only one document ever exists — always fetch
 * it via getSettings() below rather than querying the model directly.
 */
export interface ISetting extends Document {
  key: 'global';
  codEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const settingSchema = new Schema<ISetting>(
  {
    key: { type: String, default: 'global', unique: true, index: true },
    codEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Setting = model<ISetting>('Setting', settingSchema);

/** Fetches the singleton settings doc, creating it (seeded from env) on first use. */
export async function getSettings(): Promise<ISetting> {
  let doc = await Setting.findOne({ key: 'global' });
  if (!doc) {
    doc = await Setting.create({ key: 'global', codEnabled: env.codDefaultEnabled });
  }
  return doc;
}
