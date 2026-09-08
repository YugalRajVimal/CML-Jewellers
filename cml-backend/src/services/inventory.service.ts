import mongoose from 'mongoose';
import { Inventory } from '../models/Inventory.model';
import { ProductVariant } from '../models/ProductVariant.model';
import { InventoryTransaction, InventoryTransactionType } from '../models/InventoryTransaction.model';
import { AppError } from '../utils/AppError';

export interface StockLineItem {
  variantId: mongoose.Types.ObjectId | string;
  qty: number;
}

async function logTransaction(
  inventoryId: mongoose.Types.ObjectId,
  variantId: mongoose.Types.ObjectId | string,
  type: InventoryTransactionType,
  qty: number,
  refId?: string,
  note?: string
): Promise<void> {
  await InventoryTransaction.create({ inventoryId, variantId, type, qty, refId, note });
}

/**
 * Atomically moves stock from available -> reserved for each line item.
 * Uses a per-item conditional findOneAndUpdate (available >= qty) so two
 * concurrent requests can never both reserve the last unit. If any item in
 * the batch fails, all previously reserved items in this call are rolled
 * back before throwing, so a checkout never partially reserves.
 */
export async function reserveStock(items: StockLineItem[], refId?: string): Promise<void> {
  const reserved: StockLineItem[] = [];

  try {
    for (const item of items) {
      const updated = await Inventory.findOneAndUpdate(
        { variantId: item.variantId, available: { $gte: item.qty } },
        { $inc: { available: -item.qty, reserved: item.qty } },
        { new: true }
      );

      if (!updated) {
        const variant = await ProductVariant.findById(item.variantId).select('sku');
        throw AppError.conflict(
          `Insufficient stock for ${variant?.sku || 'item'}`,
          'INSUFFICIENT_STOCK',
          { variantId: item.variantId, requestedQty: item.qty }
        );
      }

      await logTransaction(updated._id, item.variantId, 'reservation', item.qty, refId);
      reserved.push(item);
    }
  } catch (err) {
    // Roll back whatever we already reserved in this batch.
    for (const item of reserved) {
      const rolledBack = await Inventory.findOneAndUpdate(
        { variantId: item.variantId },
        { $inc: { available: item.qty, reserved: -item.qty } },
        { new: true }
      );
      if (rolledBack) {
        await logTransaction(rolledBack._id, item.variantId, 'release', item.qty, refId, 'Rollback after partial reservation failure');
      }
    }
    throw err;
  }
}

/** Releases previously reserved stock back to available (e.g. order cancellation, return rejection). */
export async function releaseStock(items: StockLineItem[], refId?: string): Promise<void> {
  for (const item of items) {
    const updated = await Inventory.findOneAndUpdate(
      { variantId: item.variantId },
      { $inc: { available: item.qty, reserved: -item.qty } },
      { new: true }
    );
    if (updated) {
      await logTransaction(updated._id, item.variantId, 'release', item.qty, refId);
    }
  }
}

/** Moves reserved stock to sold (called once payment is confirmed). */
export async function markStockSold(items: StockLineItem[], refId?: string): Promise<void> {
  for (const item of items) {
    const updated = await Inventory.findOneAndUpdate(
      { variantId: item.variantId },
      { $inc: { reserved: -item.qty, sold: item.qty } },
      { new: true }
    );
    if (updated) {
      await logTransaction(updated._id, item.variantId, 'sale', item.qty, refId);
    }
  }
}

/** Moves sold stock to returned (return received from customer). */
export async function markStockReturned(items: StockLineItem[], refId?: string): Promise<void> {
  for (const item of items) {
    const updated = await Inventory.findOneAndUpdate(
      { variantId: item.variantId },
      { $inc: { sold: -item.qty, returned: item.qty } },
      { new: true }
    );
    if (updated) {
      await logTransaction(updated._id, item.variantId, 'return', item.qty, refId);
    }
  }
}

/** Restores returned stock to available (return passed inspection). */
export async function restoreReturnedStockToAvailable(items: StockLineItem[], refId?: string): Promise<void> {
  for (const item of items) {
    const updated = await Inventory.findOneAndUpdate(
      { variantId: item.variantId },
      { $inc: { returned: -item.qty, available: item.qty } },
      { new: true }
    );
    if (updated) {
      await logTransaction(
        updated._id,
        item.variantId,
        'adjustment',
        item.qty,
        refId,
        'Returned stock restored to available after inspection'
      );
    }
  }
}

/** Marks returned stock as damaged (return failed inspection). */
export async function markReturnedStockDamaged(items: StockLineItem[], refId?: string): Promise<void> {
  for (const item of items) {
    const updated = await Inventory.findOneAndUpdate(
      { variantId: item.variantId },
      { $inc: { returned: -item.qty, damaged: item.qty } },
      { new: true }
    );
    if (updated) {
      await logTransaction(updated._id, item.variantId, 'damage', item.qty, refId, 'Returned stock marked damaged after inspection');
    }
  }
}

/** Adds newly received purchase stock directly to available. */
export async function receivePurchaseStock(items: StockLineItem[], refId?: string): Promise<void> {
  for (const item of items) {
    const updated = await Inventory.findOneAndUpdate(
      { variantId: item.variantId },
      { $inc: { available: item.qty }, $setOnInsert: { reserved: 0, sold: 0, damaged: 0, returned: 0 } },
      { new: true, upsert: true }
    );
    if (updated) {
      await logTransaction(updated._id, item.variantId, 'purchase', item.qty, refId);
    }
  }
}

export async function getAvailableStock(variantId: mongoose.Types.ObjectId | string): Promise<number> {
  const inv = await Inventory.findOne({ variantId }).select('available');
  return inv?.available ?? 0;
}
