import mongoose from 'mongoose';
import { Product } from '../models/Product.model';
import { Category } from '../models/Category.model';
import { Collection } from '../models/Collection.model';
import { parsePagination, buildMeta } from '../utils/pagination';

export interface ProductListQuery {
  status?: string; // admin only — "draft" | "active" | "archived"
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

/**
 * Builds the $or clause for a `category` filter (BUG-23).
 *
 * Product.categoryId is not guaranteed to be the top-level category — the
 * admin form lets a product's categoryId be set to a subcategory directly,
 * and Product.subcategoryId is a separate, optional child reference. Simply
 * matching `categoryId === resolved` therefore missed products filed under
 * a subcategory when browsing the parent's page. This resolves the given
 * category/subcategory id-or-slug and, when it's a top-level category, also
 * matches its children (by categoryId or subcategoryId); when it's already a
 * subcategory, matches products that reference it either way.
 */
async function resolveCategoryCondition(value?: string): Promise<Record<string, unknown> | undefined> {
  if (!value) return undefined;

  const doc = mongoose.isValidObjectId(value)
    ? await Category.findById(value).select('_id parentId')
    : await Category.findOne({ slug: value }).select('_id parentId');

  if (!doc) {
    // Unknown category — match nothing rather than silently ignoring the filter.
    return { categoryId: new mongoose.Types.ObjectId() };
  }

  if (doc.parentId) {
    // Already a subcategory: no descendants to expand.
    return { $or: [{ categoryId: doc._id }, { subcategoryId: doc._id }] };
  }

  const children = await Category.find({ parentId: doc._id }).select('_id');
  const ids = [doc._id, ...children.map((c) => c._id)];
  return { $or: [{ categoryId: { $in: ids } }, { subcategoryId: { $in: ids } }] };
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

// Total `available` stock of the variant currently bound to `$$v` (see inStockVariantIds).
const availableForVariant = {
  $sum: {
    $map: {
      input: { $filter: { input: '$inventoryDocs', as: 'inv', cond: { $eq: ['$$inv.variantId', '$$v._id'] } } },
      as: 'stock',
      in: '$$stock.available',
    },
  },
};

// Ids of the active variants that have stock, in the same (oldest-first) order as `$variants`.
const inStockVariantIds = {
  $map: {
    input: { $filter: { input: '$variants', as: 'v', cond: { $gt: [availableForVariant, 0] } } },
    as: 'inStockVariant',
    in: '$$inStockVariant._id',
  },
};

export async function queryProducts(
  query: ProductListQuery,
  options: { includeAllStatuses?: boolean } = {}
) {
  const { page, limit, skip } = parsePagination(query as unknown as Record<string, unknown>);

  const [categoryCondition, subcategoryId, collectionId] = await Promise.all([
    resolveCategoryCondition(query.category),
    resolveCategoryRef(query.subcategory),
    resolveCollectionRef(query.collection),
  ]);

  // Public storefront always sees only active products. Admin (includeAllStatuses)
  // sees every status by default, or one specific status when `status` is passed —
  // otherwise drafts/archived products never show up in the admin list (BUG-02).
  const match: Record<string, unknown> = options.includeAllStatuses
    ? query.status
      ? { status: query.status }
      : {}
    : { status: 'active' };

  // BUG-23: category and subcategory filters both narrow further, so combine
  // them as separate $and clauses rather than one overwriting the other.
  const andConditions: Record<string, unknown>[] = [];
  if (categoryCondition) andConditions.push(categoryCondition);
  // An explicit ?subcategory= is always an exact match against that one
  // subcategory (no expansion — a subcategory has no children of its own).
  if (subcategoryId) andConditions.push({ subcategoryId });
  if (andConditions.length > 0) match.$and = andConditions;

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
        // Card "Add to cart" targets this variant: the first (oldest) active variant that is in stock,
        // falling back to the first active variant when none is (the card is then shown as out of stock).
        defaultVariantId: {
          $ifNull: [{ $arrayElemAt: [inStockVariantIds, 0] }, { $arrayElemAt: ['$variants._id', 0] }],
        },
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