import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { Collection } from '../models/Collection.model';
import { Product } from '../models/Product.model';
import { slugify } from '../utils/slugify';

export const listCollections = asyncHandler(async (_req: Request, res: Response) => {
  const collections = await Collection.find({ isActive: true }).sort({ displayOrder: 1, name: 1 });
  sendSuccess(res, { data: { collections } });
});

export const adminListCollections = asyncHandler(async (_req: Request, res: Response) => {
  const collections = await Collection.find().sort({ displayOrder: 1, name: 1 });
  sendSuccess(res, { data: { collections } });
});

export const adminCreateCollection = asyncHandler(async (req: Request, res: Response) => {
  const { name, slug, ...rest } = req.body;
  const finalSlug = slug || slugify(name);

  const existing = await Collection.findOne({ slug: finalSlug });
  if (existing) throw AppError.conflict('A collection with this slug already exists', 'COLLECTION_SLUG_EXISTS');

  const collection = await Collection.create({ name, slug: finalSlug, ...rest });
  sendSuccess(res, { message: 'Collection created', data: { collection }, statusCode: 201 });
});

export const adminUpdateCollection = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const collection = await Collection.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
  if (!collection) throw AppError.notFound('Collection not found');
  sendSuccess(res, { message: 'Collection updated', data: { collection } });
});

export const adminDeleteCollection = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const hasProducts = await Product.exists({ collectionId: id });
  if (hasProducts) {
    throw AppError.conflict('Cannot delete a collection that has products', 'COLLECTION_HAS_PRODUCTS');
  }

  const collection = await Collection.findByIdAndDelete(id);
  if (!collection) throw AppError.notFound('Collection not found');
  sendSuccess(res, { message: 'Collection deleted' });
});
