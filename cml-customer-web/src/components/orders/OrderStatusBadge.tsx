import type { OrderStatus } from "@/lib/types";

const STYLES: Record<OrderStatus, string> = {
  Pending: "bg-[var(--color-cream-deep)] text-[var(--color-stone)]",
  Confirmed: "bg-[var(--color-gold-light)]/40 text-[var(--color-ink)]",
  Processing: "bg-[var(--color-gold-light)]/40 text-[var(--color-ink)]",
  Shipped: "bg-[var(--color-gold)]/30 text-[var(--color-ink)]",
  Delivered: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-700",
  ReturnRequested: "bg-[var(--color-cream-deep)] text-[var(--color-maroon)]",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs ${STYLES[status]}`}>{status}</span>
  );
}
