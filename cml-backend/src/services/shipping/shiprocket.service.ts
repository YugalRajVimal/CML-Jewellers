import { IOrder, OrderStatus } from '../../models/Order.model';
import { IReturn } from '../../models/Return.model';
import { ProductVariant } from '../../models/ProductVariant.model';
import { User } from '../../models/User.model';
import { AppError } from '../../utils/AppError';
import { env } from '../../config/env';
import * as shiprocket from './shiprocketClient';

// No per-product weight/dimensions are backfilled yet, so shipments fall back
// to this single default package size. Swap for real per-variant values once
// ProductVariant.weightKg/lengthCm/breadthCm/heightCm are populated (question
// 2 in the original integration plan) — the business hasn't decided whether
// to backfill those or keep using one default.
const DEFAULT_PACKAGE = { weightKg: 0.5, lengthCm: 15, breadthCm: 10, heightCm: 5 };

function packageSizeForOrder(variants: { weightKg?: number; lengthCm?: number; breadthCm?: number; heightCm?: number }[]) {
  // Sum weight across line items; use the largest single-item dimensions as a
  // simple stand-in for "one box that fits everything" — good enough until
  // real per-product dimensions exist to do actual box-packing.
  let weightKg = 0;
  let lengthCm = 0;
  let breadthCm = 0;
  let heightCm = 0;
  let anyMissing = false;

  for (const v of variants) {
    if (v.weightKg === undefined || v.lengthCm === undefined || v.breadthCm === undefined || v.heightCm === undefined) {
      anyMissing = true;
      continue;
    }
    weightKg += v.weightKg;
    lengthCm = Math.max(lengthCm, v.lengthCm);
    breadthCm = Math.max(breadthCm, v.breadthCm);
    heightCm = Math.max(heightCm, v.heightCm);
  }

  if (anyMissing || weightKg === 0) {
    return DEFAULT_PACKAGE;
  }
  return { weightKg, lengthCm, breadthCm, heightCm };
}

function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/);
  return { first: parts[0] || fullName, last: parts.slice(1).join(' ') };
}

/** Creates the Shiprocket order for a forward shipment. Called when an admin
 * moves an order Confirmed -> Processing. Does NOT assign a courier/AWB —
 * per the chosen workflow, an admin picks the courier manually afterwards via
 * checkServiceabilityForOrder() + assignCourierToOrder(). */
export async function createShipmentForOrder(order: IOrder): Promise<{
  shiprocketOrderId: string;
  shipmentId: string;
}> {
  const variantIds = order.items.map((i) => i.variantId);
  const variants = await ProductVariant.find({ _id: { $in: variantIds } }).select(
    'weightKg lengthCm breadthCm heightCm'
  );
  const packageSize = packageSizeForOrder(variants);

  const customer = await User.findById(order.userId).select('name email phone');
  const address = order.addressSnapshot as Record<string, unknown>;
  const { first, last } = splitName(customer?.name || String(address.label || 'Customer'));

  const result = await shiprocket.createShiprocketOrder({
    orderNumber: order.orderNumber,
    orderDate: order.createdAt.toISOString().slice(0, 16).replace('T', ' '),
    pickupLocation: env.shiprocket.pickupLocation,
    billingCustomerName: first,
    billingLastName: last,
    billingAddress: [address.line1, address.line2].filter(Boolean).join(', '),
    billingCity: String(address.city || ''),
    billingPincode: String(address.pincode || ''),
    billingState: String(address.state || ''),
    billingCountry: String(address.country || 'India'),
    billingEmail: customer?.email || 'noreply@cmljewellers.in',
    billingPhone: String(address.phone || customer?.phone || ''),
    paymentMethod: order.paymentMethod,
    subTotal: order.total,
    items: order.items.map((i) => ({
      name: i.name,
      sku: i.sku,
      units: i.qty,
      selling_price: i.price,
    })),
    ...packageSize,
  });

  order.shipment = {
    ...(order.shipment ?? {}),
    shiprocketOrderId: result.shiprocketOrderId,
    shiprocketShipmentId: result.shipmentId,
  };
  await order.save();

  return result;
}

/** Lists serviceable couriers for an order's shipment so an admin can pick one. */
export async function checkServiceabilityForOrder(order: IOrder) {
  if (!order.shipment?.shiprocketShipmentId) {
    throw AppError.conflict('No Shiprocket shipment exists for this order yet', 'SHIPMENT_NOT_CREATED');
  }
  const address = order.addressSnapshot as Record<string, unknown>;
  const variantIds = order.items.map((i) => i.variantId);
  const variants = await ProductVariant.find({ _id: { $in: variantIds } }).select('weightKg');
  const packageSize = packageSizeForOrder(variants);

  return shiprocket.checkServiceability({
    pickupPincode: env.shiprocket.pickupPincode, // placeholder — Shiprocket resolves this from pickup_location internally on most plans
    deliveryPincode: String(address.pincode || ''),
    weightKg: packageSize.weightKg,
    cod: order.paymentMethod === 'COD',
  });
}

/** Assigns the admin-chosen courier's AWB to an order's shipment. */
export async function assignCourierToOrder(order: IOrder, courierId: string) {
  if (!order.shipment?.shiprocketShipmentId) {
    throw AppError.conflict('No Shiprocket shipment exists for this order yet', 'SHIPMENT_NOT_CREATED');
  }
  const result = await shiprocket.assignAWB(order.shipment.shiprocketShipmentId, courierId);
  order.shipment.awbCode = result.awbCode;
  order.shipment.courierName = result.courierName;
  order.shipment.courierId = result.courierId;
  await order.save();
  return result;
}

/** Requests courier pickup once an AWB has been assigned. */
export async function schedulePickupForOrder(order: IOrder) {
  if (!order.shipment?.shiprocketShipmentId || !order.shipment?.awbCode) {
    throw AppError.conflict('Assign a courier/AWB before scheduling pickup', 'AWB_NOT_ASSIGNED');
  }
  const result = await shiprocket.generatePickup(order.shipment.shiprocketShipmentId);
  order.shipment.pickupScheduledAt = result.pickupScheduledDate ? new Date(result.pickupScheduledDate) : new Date();
  await order.save();
  return result;
}

/** Maps Shiprocket's tracking vocabulary onto our OrderStatus. Returns null for
 * statuses that don't correspond to a forward-order transition (e.g. an RTO
 * or an intermediate courier-side hop we don't model). */
export function mapTrackingStatusToOrderStatus(shiprocketStatus: string): OrderStatus | null {
  const s = shiprocketStatus.toUpperCase();
  if (s.includes('OUT FOR DELIVERY') || s.includes('IN TRANSIT') || s.includes('SHIPPED') || s.includes('PICKED UP')) {
    return 'Shipped';
  }
  if (s.includes('DELIVERED')) return 'Delivered';
  // RTO (return to origin), lost, or other exception statuses are surfaced via
  // shipment.lastTrackingStatus but intentionally NOT auto-applied to
  // Order.status — those need a human to decide the right next step.
  return null;
}

/** Fetches the latest tracking status from Shiprocket and applies it to the order
 * if it maps to a real status change. Used by both the webhook receiver and the
 * defensive polling sync endpoint (mirrors syncPaymentStatus's role for Cashfree,
 * since Shiprocket webhooks — like Cashfree's — aren't guaranteed to always fire). */
export async function syncTrackingForOrder(order: IOrder) {
  if (!order.shipment?.awbCode) {
    throw AppError.conflict('No AWB assigned to this order yet', 'AWB_NOT_ASSIGNED');
  }

  const tracking = await shiprocket.trackShipment(order.shipment.awbCode);
  order.shipment.lastTrackingStatus = tracking.currentStatus;
  order.shipment.lastTrackingSyncedAt = new Date();
  if (tracking.trackingUrl) order.shipment.trackingUrl = tracking.trackingUrl;

  const mappedStatus = mapTrackingStatusToOrderStatus(tracking.currentStatus);
  if (mappedStatus && mappedStatus !== order.status) {
    // Only ever move forward along the normal flow — never let a stray/replayed
    // tracking event move an order backwards or out of a terminal state.
    const forwardOnly: Record<OrderStatus, OrderStatus[]> = {
      Pending: [],
      Confirmed: [],
      Processing: ['Shipped'],
      Shipped: ['Delivered'],
      Delivered: [],
      Cancelled: [],
      ReturnRequested: [],
    };
    if (forwardOnly[order.status]?.includes(mappedStatus)) {
      order.status = mappedStatus;
    }
  }

  await order.save();
  return order;
}

/** Auto-creates a Shiprocket reverse-pickup order when a return is approved, per
 * the business's choice to use Shiprocket's own return-order API (auto-generates
 * the reverse AWB) rather than handling return logistics manually. */
export async function createReverseShipmentForReturn(returnDoc: IReturn, order: IOrder) {
  const address = order.addressSnapshot as Record<string, unknown>;
  const customer = await User.findById(order.userId).select('name email phone');

  const variantIds = returnDoc.items.map((i) => i.variantId);
  const variants = await ProductVariant.find({ _id: { $in: variantIds } }).select('weightKg lengthCm breadthCm heightCm');
  const packageSize = packageSizeForOrder(variants);

  const lineByVariant = new Map(order.items.map((i) => [i.variantId.toString(), i]));
  const items = returnDoc.items.map((ri) => {
    const line = lineByVariant.get(ri.variantId.toString());
    return {
      name: line?.name ?? 'Item',
      sku: line?.sku ?? '',
      units: ri.qty,
      selling_price: line?.price ?? 0,
    };
  });
  const subTotal = items.reduce((sum, i) => sum + i.selling_price * i.units, 0);

  const result = await shiprocket.createReturnOrder({
    orderNumber: order.orderNumber,
    orderDate: new Date().toISOString().slice(0, 16).replace('T', ' '),
    pickupCustomerName: customer?.name || String(address.label || 'Customer'),
    pickupAddress: [address.line1, address.line2].filter(Boolean).join(', '),
    pickupCity: String(address.city || ''),
    pickupPincode: String(address.pincode || ''),
    pickupState: String(address.state || ''),
    pickupCountry: String(address.country || 'India'),
    pickupEmail: customer?.email || 'noreply@cmljewellers.in',
    pickupPhone: String(address.phone || customer?.phone || ''),
    warehouseName: env.shiprocket.pickupLocation || 'Warehouse',
    items,
    subTotal,
    ...packageSize,
  });

  returnDoc.reverseShipment = {
    shiprocketOrderId: result.shiprocketOrderId,
    shiprocketShipmentId: result.shipmentId,
  };
  await returnDoc.save();

  return result;
}
