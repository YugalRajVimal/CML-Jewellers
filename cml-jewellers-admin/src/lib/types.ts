// Types mirror PART 6 — SHARED DATA MODELS and PART 7 — STATE MACHINES

export type Permission =
  | "products.view" | "products.write"
  | "categories.view" | "categories.write"
  | "inventory.view" | "inventory.write"
  | "purchases.view" | "purchases.write"
  | "orders.view" | "orders.write"
  | "sales.view"
  | "payments.view"
  | "returns.view" | "returns.write"
  | "refunds.view" | "refunds.write"
  | "customers.view"
  | "coupons.view" | "coupons.write"
  | "content.view" | "content.write"
  | "admin_users.view" | "admin_users.write"
  | "roles.view" | "roles.write"
  | "audit.view"
  | "dashboard.view";

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem?: boolean;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  status: "active" | "suspended";
  lastLoginAt?: string;
  createdAt: string;
}

export type OrderStatus =
  | "Pending" | "Confirmed" | "Processing" | "Shipped" | "Delivered"
  | "Cancelled" | "ReturnRequested";

export type PaymentStatus = "Created" | "Pending" | "Success" | "Failed" | "Cancelled";

export type ReturnStatus =
  | "Requested" | "Approved" | "PickedUp" | "Received" | "Inspected"
  | "Refunded" | "Rejected" | "Cancelled";

export type RefundStatus = "Initiated" | "Processing" | "Completed" | "Failed";

export type InventoryTxnType = "purchase" | "sale" | "return" | "adjustment" | "damage";

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  productCount: number;
  isActive: boolean;
}

export interface ProductVariant {
  id: string;
  sku: string;
  attributes: Record<string, string>;
  price: number;
  mrp: number;
  available: number;
  reserved: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  subcategoryId?: string | null;
  sku: string;
  basePrice: number;
  mrp: number;
  attributes: { material?: string; metal?: string; purity?: string; stone?: string; gender?: string; occasion?: string };
  images: string[];
  status: "draft" | "active" | "archived";
  isFeatured: boolean;
  ratingAvg: number;
  variants: ProductVariant[];
  createdAt: string;
}

export interface InventoryRow {
  id: string;
  variantId: string;
  productName: string;
  sku: string;
  available: number;
  reserved: number;
  sold: number;
  damaged: number;
  returned: number;
  lowStockThreshold: number;
}

export interface InventoryTransaction {
  id: string;
  inventoryId: string;
  sku: string;
  type: InventoryTxnType;
  qty: number;
  refId: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  address: string;
}

export interface PurchaseItem {
  variantId: string;
  sku: string;
  orderedQty: number;
  receivedQty: number;
  cost: number;
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  status: "Draft" | "Ordered" | "PartiallyReceived" | "Received" | "Cancelled";
  createdAt: string;
}

export interface OrderItem {
  variantId: string;
  productName: string;
  sku: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  items: OrderItem[];
  addressLine: string;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentId: string;
  paymentStatus: PaymentStatus;
  createdAt: string;
}

export interface Return {
  id: string;
  orderId: string;
  orderNumber: string;
  items: { productName: string; qty: number }[];
  reason: string;
  status: ReturnStatus;
  createdAt: string;
}

export interface Refund {
  id: string;
  paymentId: string;
  returnId: string;
  orderNumber: string;
  amount: number;
  status: RefundStatus;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  ordersCount: number;
  lifetimeValue: number;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: "flat" | "percent";
  value: number;
  minCartValue: number;
  expiry: string;
  usageLimit: number;
  used: number;
  isActive: boolean;
}

export interface Banner {
  id: string;
  title: string;
  ctaText: string;
  ctaUrl: string;
  order: number;
  isActive: boolean;
}

export interface Payment {
  id: string;
  orderId: string;
  orderNumber: string;
  provider: "cashfree";
  providerRefId: string;
  amount: number;
  status: PaymentStatus;
  verifiedAt?: string;
  createdAt: string;
}

export interface HomepageSection {
  id: string;
  type: "hero" | "category_strip" | "promo_grid" | "testimonials" | "newsletter";
  title: string;
  order: number;
  isActive: boolean;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  createdAt: string;
}
