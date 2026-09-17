import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { Setting, getSettings } from '../models/Setting.model';

export const adminGetSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await getSettings();
  sendSuccess(res, { data: { settings } });
});

export const adminUpdateSettings = asyncHandler(async (req: Request, res: Response) => {
  const { codEnabled } = req.body as { codEnabled: boolean };
  await getSettings(); // ensure the singleton exists
  const settings = await Setting.findOneAndUpdate({ key: 'global' }, { codEnabled }, { new: true });
  sendSuccess(res, { message: 'Settings updated', data: { settings } });
});
