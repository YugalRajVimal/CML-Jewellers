import mongoose from 'mongoose';
import { Product } from '../models/Product.model';
import { Category } from '../models/Category.model';
import { Collection } from '../models/Collection.model';
import { parsePagination, buildMeta } from '../utils/pagination';

export interface ProductListQuery {
  category?: string; // id or slug
  subcategory?: string; // id or slug
  collection?: string; // id or slug
  minPrice?: string;
  maxPrice?: string;
  gender?: string;
  jewelryType?: string;
  material?: string;
  metal?: string;
  purity?: string;
  stone?: string;
  occasion?: string;
  availability?: string; // "in_stock" | "out_of_stock"
  minDiscount?: string; // e.g. "10" => at least 10% off
  featured?: string; // "true"
  newArrival?: string; // "true"
  q?: string;
  sort?: string;
  page?: string;
  limit?: string;
}

async function resolveCategoryRef(value?: string): Promise<mongoose.Types.ObjectId | undefined> {
  if (!value) return undefined;
  if (mongoose.isValidObjectId(value)) return new mongoose.Types.ObjectId(value);
  const doc = await Category.findOne({ slug: value }).select('_id');
  return doc?._id;
}

async function resolveCollectionRef(value?: string): Promise<mongoose.Types.ObjectId | undefined> {
  if (!value) return undefined;
  if (mongoose.isValidObjectId(value)) return new mongoose.Types.ObjectId(value);
  const doc = await Collection.findOne({ slug: value }).select('_id');
  return doc?._id;
}

function resolveSortStage(sort?: string, hasTextSearch = false): Record<string, 1 | -1 | { $meta: string }> {
  switch (sort) {
    case 'newest':
      return { publishedAt: -1, createdAt: -1 };
    case 'price_asc':
      return { basePrice: 1 };
    case 'price_desc':
      return { basePrice: -1 };
    case 'popular':
      return { ratingCount: -1, ratingAvg: -1 };
    case 'bestselling':
      // NOTE: true sales-based ranking lands once Order data exists (EPIC 3/4).
      // Proxy on rating volume until then.
      return { ratingCount: -1 };
    case 'discount':
      return { discountPercent: -1 };
    case 'recommended':
    default:
      return hasTextSearch ? { score: { $meta: 'textScore' } } : { isFeatured: -1, createdAt: -1 };
  }
}

export async function queryProducts(query: ProductListQuery) {
  const { page, limit, skip } = parsePagination(query as unknown as Record<string, unknown>);

  const [categoryId, subcategoryId, collectionId] = await Promise.all([
    resolveCategoryRef(query.category),
    resolveCategoryRef(query.subcategory),
    resolveCollectionRef(query.collection),
  ]);

  const match: Record<string, unknown> = { status: 'active' };

  if (categoryId) match.categoryId = categoryId;
  if (subcategoryId) match.subcategoryId = subcategoryId;
  if (collectionId) match.collectionId = collectionId;
  if (query.gender) match['attributes.gender'] = query.gender;
  if (query.jewelryType) match['attributes.jewelryType'] = query.jewelryType;
  if (query.material) match['attributes.material'] = query.material;
  if (query.metal) match['attributes.metal'] = query.metal;
  if (query.purity) match['attributes.purity'] = query.purity;
  if (query.stone) match['attributes.stone'] = query.stone;
  if (query.occasion) match['attributes.occasion'] = query.occasion;
  if (query.featured === 'true') match.isFeatured = true;
  if (query.newArrival === 'true') match.isNewArrival = true;

  if (query.minPrice || query.maxPrice) {
    const priceRange: Record<string, number> = {};
    if (query.minPrice) priceRange.$gte = Number(query.minPrice);
    if (query.maxPrice) priceRange.$lte = Number(query.maxPrice);
    match.basePrice = priceRange;
  }

  if (query.q) {
    match.$text = { $search: query.q };
  }

  const pipeline: mongoose.PipelineStage[] = [{ $match: match }];

  if (query.q) {
    pipeline.push({ $addFields: { score: { $meta: 'textScore' } } });
  }

  // Join variants + their inventory to compute stock availability and variant count.
  pipeline.push(
    {
      $lookup: {
        from: 'productvariants',
        let: { productId: '$_id' },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ['$productId', '$$productId'] }, { $eq: ['$isActive', true] }] } } },
          { $sort: { createdAt: 1 } },
          { $project: { _id: 1 } },
        ],
        as: 'variants',
      },
    },
    {
      $lookup: {
        from: 'inventories',
        localField: 'variants._id',
        foreignField: 'variantId',
        as: 'inventoryDocs',
      },
    },
    {
      $addFields: {
        variantCount: { $size: '$variants' },
        totalAvailable: { $sum: '$inventoryDocs.available' },
        defaultVariantId: { $arrayElemAt: ['$variants._id', 0] },
        discountPercent: {
          $cond: [
            { $gt: ['$mrp', 0] },
            { $round: [{ $multiply: [{ $divide: [{ $subtract: ['$mrp', '$basePrice'] }, '$mrp'] }, 100] }, 0] },
            0,
          ],
        },
      },
    },
    { $addFields: { inStock: { $gt: ['$totalAvailable', 0] } } }
  );

  if (query.availability === 'in_stock') {
    pipeline.push({ $match: { inStock: true } });
  } else if (query.availability === 'out_of_stock') {
    pipeline.push({ $match: { inStock: false } });
  }

  if (query.minDiscount) {
    pipeline.push({ $match: { discountPercent: { $gte: Number(query.minDiscount) } } });
  }

  pipeline.push({ $sort: resolveSortStage(query.sort, Boolean(query.q)) as never });

  pipeline.push({
    $facet: {
      data: [
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            variants: 0,
            inventoryDocs: 0,
            score: 0,
          },
        },
      ],
      totalCount: [{ $count: 'count' }],
    },
  });

  const [result] = await Product.aggregate(pipeline);
  const items = result?.data || [];
  const total = result?.totalCount?.[0]?.count || 0;

  return { items, meta: buildMeta(page, limit, total) };
}
