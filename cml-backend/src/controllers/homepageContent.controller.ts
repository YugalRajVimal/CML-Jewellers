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

// Partial update of an existing section (e.g. flipping isActive from the admin
// list) without having to re-send title/data/order and without ever creating a
// new section by accident — unlike the PUT upsert above (BUG-03).
export const adminUpdateHomepageSection = asyncHandler(async (req: Request, res: Response) => {
  const { section } = req.params;
  const { title, data, order, isActive } = req.body;

  const update: Record<string, unknown> = {};
  if (title !== undefined) update.title = title;
  if (data !== undefined) update.data = data;
  if (order !== undefined) update.order = order;
  if (isActive !== undefined) update.isActive = isActive;

  const doc = await HomepageContent.findOneAndUpdate({ section }, { $set: update }, { new: true, runValidators: true });
  if (!doc) throw AppError.notFound('Homepage section not found');

  sendSuccess(res, { message: 'Homepage section updated', data: { section: doc } });
});

export const adminDeleteHomepageSection = asyncHandler(async (req: Request, res: Response) => {
  const { section } = req.params;
  const doc = await HomepageContent.findOneAndDelete({ section });
  if (!doc) throw AppError.notFound('Homepage section not found');
  sendSuccess(res, { message: 'Homepage section deleted' });
});