// Mirrors PERMISSIONS in the backend's constants/permissions.ts. `payment:read`,
// `sales:read` and `audit:read` are what the backend actually enforces on the
// Payments, Sales and Audit-log endpoints (BUG-05).
export type Permission =
  | "product:read" | "product:write"
  | "category:write"
  | "inventory:read" | "inventory:write"
  | "purchase:manage"
  | "order:read" | "order:write"
  | "return:manage"
  | "refund:manage"
  | "payment:read"
  | "sales:read"
  | "audit:read"
  | "customer:read"
  | "coupon:manage"
  | "content:manage"
  | "admin_user:manage"
  | "role:manage"
  | "dashboard:read";

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
  // Backend (`AdminUser.model.ts`) stores this as a boolean, not a
  // "active"/"suspended" string. `status` is kept optional for any UI code
  // that still derives a display string from it.
  isActive: boolean;
  status?: "active" | "suspended";
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
  image?: string | null;
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

export type ProductGender = "men" | "women" | "unisex" | "kids";

// Mirrors IProductAttributes in the backend's Product.model.ts.
export interface ProductAttributes {
  material?: string;
  metal?: string;
  purity?: string;
  stone?: string;
  gender?: ProductGender;
  occasion?: string;
  jewelryType?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isNewArrival: boolean;
  categoryId: string;
  category_id: string;
  subcategoryId?: string | null;
  collectionId?: string | null;
  sku: string;
  basePrice: number;
  mrp: number;
  attributes: ProductAttributes;
  images: string[];
  status: "draft" | "active" | "archived";
  isFeatured: boolean;
  ratingAvg: number;
  ratingCount?: number;
  variants: ProductVariant[];
  createdAt: string;
}

// Mirrors Collection.model.ts. The backend returns both `_id` and a virtual `id`.
export interface Collection {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  isActive: boolean;
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

// Matches Backend createSupplierSchema/Supplier.model.ts — contact and address
// are nested objects, not free-text strings (BUG-04).
export interface SupplierContact {
  contactPerson?: string;
  email?: string;
  phone?: string;
}

export interface SupplierAddress {
  line1?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact?: SupplierContact;
  address?: SupplierAddress;
  isActive?: boolean;
}

export interface PurchaseItem {
  variantId: string;
  orderedQty: number;
  receivedQty: number;
  cost: number;
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  supplierId: string;
  items: PurchaseItem[];
  status: "Draft" | "Ordered" | "PartiallyReceived" | "Received" | "Cancelled";
  notes?: string;
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

export type BannerType = "hero" | "promo" | "category" | "strip";

export interface Banner {
  id: string;
  // `type` and `imageUrl` are required by the backend when creating a banner
  // (BUG-06); optional here so older/mock rows without them still type-check.
  type?: BannerType;
  imageUrl?: string;
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
  // The backend keys sections by an arbitrary string (see
  // adminUpsertHomepageSection: `findOneAndUpdate({ section }, ...)`), not a
  // fixed enum. That key is returned as `section` (e.g. "hero", "promo_1") and
  // is what the PATCH/PUT/DELETE /content/homepage/:section routes take; `id`
  // is just the Mongo document id.
  id: string;
  section?: string;
  type: string;
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