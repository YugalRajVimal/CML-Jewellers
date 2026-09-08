import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { mediaService } from '../services/media/cloudinaryMedia.service';

/**
 * POST /admin/media/upload?folder=products|categories|banners
 * multipart/form-data field name: "image"
 */
export const uploadMedia = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) throw AppError.badRequest('No image file provided', 'FILE_MISSING');

  const folder = typeof req.query.folder === 'string' ? req.query.folder : undefined;
  const result = await mediaService.upload(file.buffer, { folder });

  sendSuccess(res, { message: 'Image uploaded', data: { image: result }, statusCode: 201 });
});

export const deleteMedia = asyncHandler(async (req: Request, res: Response) => {
  const { publicId } = req.params;
  await mediaService.delete(decodeURIComponent(publicId));
  sendSuccess(res, { message: 'Image deleted' });
});
