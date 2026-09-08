import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { Category } from '../models/Category.model';
import { Product } from '../models/Product.model';
import { slugify } from '../utils/slugify';
import { parsePagination, buildMeta } from '../utils/pagination';

/** Public: full category tree (top-level categories with their subcategories nested). */
export const listCategoryTree = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1, name: 1 }).lean();

  const byParent = new Map<string, typeof categories>();
  for (const cat of categories) {
    const key = cat.parentId ? cat.parentId.toString() : 'root';
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(cat);
  }

  function attachChildren(cat: (typeof categories)[number]): Record<string, unknown> {
    const children = byParent.get(cat._id.toString()) || [];
    return { ...cat, subcategories: children.map(attachChildren) };
  }

  const tree = (byParent.get('root') || []).map(attachChildren);
  sendSuccess(res, { data: { categories: tree } });
});

/** Public: products under a category (or subcategory) slug, paginated. */
export const getCategoryProducts = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const category = await Category.findOne({ slug, isActive: true });
  if (!category) throw AppError.notFound('Category not found');

  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);

  const filter = {
    status: 'active',
    $or: [{ categoryId: category._id }, { subcategoryId: category._id }],
  };

  const [items, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  sendSuccess(res, { data: { category, products: items }, meta: buildMeta(page, limit, total) });
});

// ---------- Admin ----------

export const adminListCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await Category.find().sort({ displayOrder: 1, name: 1 });
  sendSuccess(res, { data: { categories } });
});

export const adminCreateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, slug, ...rest } = req.body;
  const finalSlug = slug || slugify(name);

  const existing = await Category.findOne({ slug: finalSlug });
  if (existing) throw AppError.conflict('A category with this slug already exists', 'CATEGORY_SLUG_EXISTS');

  const category = await Category.create({ name, slug: finalSlug, ...rest });
  sendSuccess(res, { message: 'Category created', data: { category }, statusCode: 201 });
});

export const adminUpdateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const category = await Category.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
  if (!category) throw AppError.notFound('Category not found');
  sendSuccess(res, { message: 'Category updated', data: { category } });
});

export const adminDeleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const hasChildren = await Category.exists({ parentId: id });
  if (hasChildren) {
    throw AppError.conflict('Cannot delete a category that has subcategories', 'CATEGORY_HAS_CHILDREN');
  }
  const hasProducts = await Product.exists({ $or: [{ categoryId: id }, { subcategoryId: id }] });
  if (hasProducts) {
    throw AppError.conflict('Cannot delete a category that has products', 'CATEGORY_HAS_PRODUCTS');
  }

  const category = await Category.findByIdAndDelete(id);
  if (!category) throw AppError.notFound('Category not found');
  sendSuccess(res, { message: 'Category deleted' });
});
