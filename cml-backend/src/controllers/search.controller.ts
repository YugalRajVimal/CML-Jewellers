import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { Product } from '../models/Product.model';
import { queryProducts } from '../services/productQuery.service';

/**
 * GET /search?q=...
 * Returns lightweight suggestions (name/sku/image for a fast dropdown) plus
 * full paginated results using the same filter/sort machinery as /products.
 */
export const search = asyncHandler(async (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim();

  if (!q) {
    return sendSuccess(res, { data: { suggestions: [], products: [] }, meta: { page: 1, limit: 20, total: 0 } });
  }

  const [suggestions, { items, meta }] = await Promise.all([
    Product.find({ status: 'active', $text: { $search: q } })
      .select('name slug images basePrice')
      .limit(6),
    queryProducts({ ...(req.query as Record<string, string>), q }),
  ]);

  sendSuccess(res, { data: { suggestions, products: items }, meta });
});
