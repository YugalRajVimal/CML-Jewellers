import { OrderStatus, ReturnStatus, RefundStatus } from "./types";

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Processing", "Cancelled"],
  Processing: ["Shipped"],
  Shipped: ["Delivered"],
  Delivered: ["ReturnRequested"],
  Cancelled: [],
  ReturnRequested: [],
};

export const RETURN_TRANSITIONS: Record<ReturnStatus, ReturnStatus[]> = {
  Requested: ["Approved", "Rejected", "Cancelled"],
  Approved: ["PickedUp", "Rejected", "Cancelled"],
  PickedUp: ["Received"],
  Received: ["Inspected"],
  Inspected: ["Refunded"],
  Refunded: [],
  Rejected: [],
  Cancelled: [],
};

export const REFUND_TRANSITIONS: Record<RefundStatus, RefundStatus[]> = {
  Initiated: ["Processing", "Failed"],
  Processing: ["Completed", "Failed"],
  Completed: [],
  Failed: [],
};

export function canTransition<T extends string>(
  map: Record<T, T[]>,
  from: T,
  to: T
): boolean {
  return map[from]?.includes(to) ?? false;
}
