import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { Banner } from '../models/Banner.model';

// ---------- Public ----------

export const listActiveBanners = asyncHandler(async (req: Request, res: Response) => {
  const now = new Date();
  const filter: Record<string, unknown> = {
    isActive: true,
    $and: [
      { $or: [{ startsAt: { $exists: false } }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: { $exists: false } }, { endsAt: { $gte: now } }] },
    ],
  };
  if (req.query.type) filter.type = req.query.type;

  const banners = await Banner.find(filter).sort({ order: 1 });
  sendSuccess(res, { data: { banners } });
});

// ---------- Admin ----------

export const adminListBanners = asyncHandler(async (_req: Request, res: Response) => {
  const banners = await Banner.find().sort({ type: 1, order: 1 });
  sendSuccess(res, { data: { banners } });
});

export const adminCreateBanner = asyncHandler(async (req: Request, res: Response) => {
  const banner = await Banner.create(req.body);
  sendSuccess(res, { message: 'Banner created', data: { banner }, statusCode: 201 });
});

export const adminUpdateBanner = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const banner = await Banner.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
  if (!banner) throw AppError.notFound('Banner not found');
  sendSuccess(res, { message: 'Banner updated', data: { banner } });
});

export const adminDeleteBanner = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const banner = await Banner.findByIdAndDelete(id);
  if (!banner) throw AppError.notFound('Banner not found');
  sendSuccess(res, { message: 'Banner deleted' });
});
