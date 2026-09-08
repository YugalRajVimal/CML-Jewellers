import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { HomepageContent } from '../models/HomepageContent.model';

// ---------- Public ----------

export const getHomepageContent = asyncHandler(async (_req: Request, res: Response) => {
  const sections = await HomepageContent.find({ isActive: true }).sort({ order: 1 });
  sendSuccess(res, { data: { sections } });
});

// ---------- Admin ----------

export const adminListHomepageContent = asyncHandler(async (_req: Request, res: Response) => {
  const sections = await HomepageContent.find().sort({ order: 1 });
  sendSuccess(res, { data: { sections } });
});

export const adminUpsertHomepageSection = asyncHandler(async (req: Request, res: Response) => {
  const { section } = req.params;
  const { title, data, order, isActive } = req.body;

  const doc = await HomepageContent.findOneAndUpdate(
    { section },
    { section, title, data, order, isActive },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  sendSuccess(res, { message: 'Homepage section saved', data: { section: doc } });
});

export const adminDeleteHomepageSection = asyncHandler(async (req: Request, res: Response) => {
  const { section } = req.params;
  const doc = await HomepageContent.findOneAndDelete({ section });
  if (!doc) throw AppError.notFound('Homepage section not found');
  sendSuccess(res, { message: 'Homepage section deleted' });
});
