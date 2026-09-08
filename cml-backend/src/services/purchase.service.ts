import { Purchase, IPurchase, PurchaseStatus } from '../models/Purchase.model';
import { Supplier } from '../models/Supplier.model';
import { ProductVariant } from '../models/ProductVariant.model';
import { AppError } from '../utils/AppError';
import { receivePurchaseStock } from './inventory.service';

function generatePurchaseNumber(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `PO-${datePart}-${randomPart}`;
}

export interface CreatePurchaseInput {
  supplierId: string;
  items: { variantId: string; orderedQty: number; cost: number }[];
  notes?: string;
}

export async function createPurchase(input: CreatePurchaseInput): Promise<IPurchase> {
  const supplier = await Supplier.findById(input.supplierId);
  if (!supplier || !supplier.isActive) throw AppError.notFound('Supplier not found or inactive');

  for (const item of input.items) {
    const variant = await ProductVariant.findById(item.variantId);
    if (!variant) throw AppError.notFound(`Variant ${item.variantId} not found`);
  }

  const purchase = await Purchase.create({
    purchaseNumber: generatePurchaseNumber(),
    supplierId: input.supplierId,
    items: input.items.map((i) => ({ ...i, receivedQty: 0 })),
    status: 'Ordered',
    notes: input.notes,
  });

  return purchase;
}

export interface ReceivePurchaseInput {
  items: { variantId: string; receivedQty: number }[];
}

/**
 * Records stock received against a purchase order. Updates Inventory (available += qty)
 * and logs an InventoryTransaction of type "purchase" for each line, then recomputes
 * the PO's overall status (PartiallyReceived vs fully Received).
 */
export async function receivePurchase(purchaseId: string, input: ReceivePurchaseInput): Promise<IPurchase> {
  const purchase = await Purchase.findById(purchaseId);
  if (!purchase) throw AppError.notFound('Purchase order not found');

  if (purchase.status === 'Cancelled' || purchase.status === 'Received') {
    throw AppError.conflict(
      `Cannot receive stock against a purchase order in status "${purchase.status}"`,
      'PURCHASE_NOT_RECEIVABLE'
    );
  }

  const stockLines: { variantId: string; qty: number }[] = [];

  for (const receiveItem of input.items) {
    const line = purchase.items.find((i) => i.variantId.toString() === receiveItem.variantId);
    if (!line) {
      throw AppError.badRequest(`Variant ${receiveItem.variantId} is not part of this purchase order`, 'INVALID_PURCHASE_ITEM');
    }

    const remaining = line.orderedQty - line.receivedQty;
    if (receiveItem.receivedQty > remaining) {
      throw AppError.badRequest(
        `Cannot receive ${receiveItem.receivedQty} — only ${remaining} unit(s) remaining on this line`,
        'RECEIVED_QTY_EXCEEDS_ORDERED'
      );
    }

    line.receivedQty += receiveItem.receivedQty;
    stockLines.push({ variantId: receiveItem.variantId, qty: receiveItem.receivedQty });
  }

  await receivePurchaseStock(stockLines, purchase.purchaseNumber);

  const fullyReceived = purchase.items.every((i) => i.receivedQty >= i.orderedQty);
  const partiallyReceived = purchase.items.some((i) => i.receivedQty > 0);
  purchase.status = (fullyReceived ? 'Received' : partiallyReceived ? 'PartiallyReceived' : purchase.status) as PurchaseStatus;

  await purchase.save();
  return purchase;
}

export async function cancelPurchase(purchaseId: string): Promise<IPurchase> {
  const purchase = await Purchase.findById(purchaseId);
  if (!purchase) throw AppError.notFound('Purchase order not found');

  if (purchase.items.some((i) => i.receivedQty > 0)) {
    throw AppError.conflict('Cannot cancel a purchase order that has already received stock', 'PURCHASE_HAS_RECEIVED_STOCK');
  }

  purchase.status = 'Cancelled';
  await purchase.save();
  return purchase;
}
