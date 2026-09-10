// import { Request, Response } from 'express';
// import { asyncHandler } from '../utils/asyncHandler';
// import { sendSuccess } from '../utils/apiResponse';
// import { Order } from '../models/Order.model';
// import { parsePagination, buildMeta } from '../utils/pagination';
// import * as checkoutService from '../services/checkout.service';

// export const createOrder = asyncHandler(async (req: Request, res: Response) => {
//   const { addressId } = req.body;
//   const order = await checkoutService.createOrderFromCart(req.user!.sub, addressId);
//   sendSuccess(res, { message: 'Order placed', data: { order }, statusCode: 201 });
// });

// export const listMyOrders = asyncHandler(async (req: Request, res: Response) => {
//   const userId = req.user!.sub;
//   const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);

//   const [items, total] = await Promise.all([
//     Order.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
//     Order.countDocuments({ userId }),
//   ]);

//   sendSuccess(res, { data: { orders: items }, meta: buildMeta(page, limit, total) });
// });

// export const getOrder = asyncHandler(async (req: Request, res: Response) => {
//   const { id } = req.params;
//   const order = await checkoutService.getOrderForUser(req.user!.sub, id);
//   sendSuccess(res, { data: { order } });
// });

// export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
//   const { id } = req.params;
//   const { reason } = req.body;
//   const order = await checkoutService.cancelOrder(req.user!.sub, id, reason);
//   sendSuccess(res, { message: 'Order cancelled', data: { order } });
// });

import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { Order, IOrder } from '../models/Order.model';
import { Product } from '../models/Product.model';
import { ProductVariant } from '../models/ProductVariant.model';
import { parsePagination, buildMeta } from '../utils/pagination';
import * as checkoutService from '../services/checkout.service';

/** Shapes an Order into exactly what the storefront's Order/OrderLineItem types expect. */
async function serializeOrder(order: IOrder) {
  const productIds = order.items.map((i) => i.productId);
  const variantIds = order.items.map((i) => i.variantId);

  const [products, variants] = await Promise.all([
    Product.find({ _id: { $in: productIds } }).select('slug'),
    ProductVariant.find({ _id: { $in: variantIds } }).select('attributes'),
  ]);
  const slugByProduct = new Map(products.map((p) => [p._id.toString(), p.slug]));
  const attrsByVariant = new Map(variants.map((v) => [v._id.toString(), v.attributes]));

  const snapshot = (order.addressSnapshot ?? {}) as Record<string, unknown>;

  return {
    id: order._id.toString(),
    status: order.status,
    items: order.items.map((item) => ({
      id: `${item.productId.toString()}-${item.variantId.toString()}`,
      productName: item.name,
      productSlug: slugByProduct.get(item.productId.toString()) ?? '',
      image: item.image,
      variantAttributes: attrsByVariant.get(item.variantId.toString()) ?? {},
      quantity: item.qty,
      price: item.price,
    })),
    subtotal: order.subtotal,
    discount: order.discount,
    shipping: order.shipping,
    total: order.total,
    address: {
      id: order.addressId?.toString() ?? '',
      label: snapshot.label,
      line1: snapshot.line1,
      line2: snapshot.line2,
      city: snapshot.city,
      state: snapshot.state,
      postalCode: snapshot.pincode,
      country: snapshot.country,
      phone: snapshot.phone,
    },
    createdAt: order.createdAt,
    // No shipment-tracking integration exists yet — intentionally omitted rather than faked.
    trackingNumber: undefined,
    trackingCarrier: undefined,
  };
}

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { addressId } = req.body;
  const order = await checkoutService.createOrderFromCart(req.user!.sub, addressId);
  sendSuccess(res, { message: 'Order placed', data: await serializeOrder(order), statusCode: 201 });
});

export const listMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);

  const [items, total] = await Promise.all([
    Order.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments({ userId }),
  ]);

  const serialized = await Promise.all(items.map(serializeOrder));
  sendSuccess(res, { data: serialized, meta: buildMeta(page, limit, total) }); // bare array
});

export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const order = await checkoutService.getOrderForUser(req.user!.sub, id);
  sendSuccess(res, { data: await serializeOrder(order) });
});

export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const order = await checkoutService.cancelOrder(req.user!.sub, id, reason);
  sendSuccess(res, { message: 'Order cancelled', data: await serializeOrder(order) });
});