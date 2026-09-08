import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { Inventory } from '../models/Inventory.model';
import { InventoryTransaction } from '../models/InventoryTransaction.model';
import { parsePagination, buildMeta } from '../utils/pagination';

export const listInventory = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);

  const filter: Record<string, unknown> = {};
  if (req.query.lowStock === 'true') {
    filter.$expr = { $lte: ['$available', '$lowStockThreshold'] };
  }

  const [items, total] = await Promise.all([
    Inventory.find(filter).populate('variantId', 'sku attributes').skip(skip).limit(limit),
    Inventory.countDocuments(filter),
  ]);

  sendSuccess(res, { data: { inventory: items }, meta: buildMeta(page, limit, total) });
});

export const getInventoryTransactions = asyncHandler(async (req: Request, res: Response) => {
  const { variantId } = req.params;
  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);

  const [items, total] = await Promise.all([
    InventoryTransaction.find({ variantId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    InventoryTransaction.countDocuments({ variantId }),
  ]);

  sendSuccess(res, { data: { transactions: items }, meta: buildMeta(page, limit, total) });
});

/**
 * Manual stock adjustment (e.g. stocktake correction). Directly adjusts `available`
 * and logs an "adjustment" transaction — distinct from purchase/sale/return flows.
 */
export const adjustInventory = asyncHandler(async (req: Request, res: Response) => {
  const { variantId, delta, note } = req.body;

  const inventory = await Inventory.findOneAndUpdate(
    { variantId, available: { $gte: -delta } }, // prevents available from going negative on a negative delta
    { $inc: { available: delta } },
    { new: true }
  );

  if (!inventory) {
    throw AppError.conflict('Adjustment would result in negative available stock', 'INVALID_ADJUSTMENT');
  }

  await InventoryTransaction.create({
    inventoryId: inventory._id,
    variantId,
    type: 'adjustment',
    qty: delta,
    note,
  });

  sendSuccess(res, { message: 'Inventory adjusted', data: { inventory } });
});
