// Typed client for /api/v1/admin.
//
// Swap-out point: every function here currently resolves against the mock
// dataset in ./mock-data with a simulated network delay + the exact success
// envelope from PART 5 — API CONTRACT. Point ADMIN_API_BASE_URL at the real
// backend and replace the body of `request()` with a `fetch()` call; every
// call site (hooks, pages) stays unchanged because they only depend on the
// `ApiResponse<T>` shape below.

import * as db from "./mock-data";
import { canTransition, ORDER_TRANSITIONS, REFUND_TRANSITIONS, RETURN_TRANSITIONS } from "./state-machines";
import {
  AdminUser, Category, Coupon, InventoryRow, InventoryTransaction, Order,
  OrderStatus, Payment, Product, Purchase, Refund, RefundStatus, Return, ReturnStatus,
  Role, Supplier, Customer, Banner, HomepageSection, AuditLogEntry, Permission,
} from "./types";

export interface ApiMeta { page: number; limit: number; total: number }
export interface ApiResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: ApiMeta;
}
export interface ApiError {
  success: false;
  message: string;
  error: { code: string; details?: Record<string, unknown> };
}

export class ApiRequestError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

const LATENCY_MS = 260;

function ok<T>(data: T, message = "OK", meta?: ApiMeta): ApiResponse<T> {
  return { success: true, message, data, meta };
}

async function simulate<T>(fn: () => T): Promise<T> {
  await new Promise((r) => setTimeout(r, LATENCY_MS));
  return fn();
}

function paginate<T>(rows: T[], page = 1, limit = 20): { rows: T[]; meta: ApiMeta } {
  const start = (page - 1) * limit;
  return { rows: rows.slice(start, start + limit), meta: { page, limit, total: rows.length } };
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

const DEMO_CREDENTIALS: Record<string, { password: string; userId: string }> = {
  "meera@cmljewellers.com": { password: "super123", userId: "au_1" },
  "rohan@cmljewellers.com": { password: "catalog123", userId: "au_2" },
  "priya@cmljewellers.com": { password: "ops123", userId: "au_3" },
};

export interface Session {
  token: string;
  user: AdminUser;
  role: Role;
}

export async function login(email: string, password: string): Promise<ApiResponse<Session>> {
  return simulate(() => {
    const cred = DEMO_CREDENTIALS[email.trim().toLowerCase()];
    const user = db.ADMIN_USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!cred || cred.password !== password || !user) {
      throw new ApiRequestError("Incorrect email or password.", "INVALID_CREDENTIALS");
    }
    if (user.status === "suspended") {
      throw new ApiRequestError("This admin account has been suspended.", "ACCOUNT_SUSPENDED");
    }
    const role = db.ROLES.find((r) => r.id === user.roleId)!;
    const token = `demo.${user.id}.${Date.now()}`;
    return ok({ token, user, role }, "Signed in");
  });
}

export function permissionsFor(role: Role): Set<Permission> {
  return new Set(role.permissions);
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export async function getDashboard() {
  return simulate(() => {
    const revenue30d = db.ORDERS.filter((o) => o.status !== "Cancelled").reduce((s, o) => s + o.total, 0);
    const openOrders = db.ORDERS.filter((o) => !["Delivered", "Cancelled"].includes(o.status)).length;
    const lowStock = db.INVENTORY.filter((i) => i.available <= i.lowStockThreshold).length;
    const pendingReturns = db.RETURNS.filter((r) => !["Refunded", "Rejected", "Cancelled"].includes(r.status)).length;
    return ok({
      stats: {
        revenue30d,
        orders30d: db.ORDERS.length,
        customers: db.CUSTOMERS.length,
        openOrders,
        lowStock,
        pendingReturns,
      },
      trend: db.REVENUE_TREND,
      recentOrders: [...db.ORDERS].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 5),
      lowStockRows: db.INVENTORY.filter((i) => i.available <= i.lowStockThreshold),
    });
  });
}

// ---------------------------------------------------------------------------
// Products & categories
// ---------------------------------------------------------------------------

export async function listProducts(params: { page?: number; limit?: number; q?: string; status?: string; categoryId?: string } = {}) {
  return simulate(() => {
    let rows = [...db.PRODUCTS];
    if (params.q) {
      const q = params.q.toLowerCase();
      rows = rows.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    if (params.status) rows = rows.filter((p) => p.status === params.status);
    if (params.categoryId) rows = rows.filter((p) => p.categoryId === params.categoryId);
    const { rows: paged, meta } = paginate(rows, params.page, params.limit ?? 10);
    return ok(paged, "OK", meta);
  });
}

export async function getProduct(id: string) {
  return simulate(() => {
    const product = db.PRODUCTS.find((p) => p.id === id);
    if (!product) throw new ApiRequestError("Product not found.", "PRODUCT_NOT_FOUND");
    return ok(product);
  });
}

export async function createProduct(input: {
  name: string; sku: string; categoryId: string; basePrice: number; mrp: number; status: Product["status"];
}) {
  return simulate(() => {
    if (db.PRODUCTS.some((p) => p.sku.toLowerCase() === input.sku.toLowerCase())) {
      throw new ApiRequestError("A product with this SKU already exists.", "DUPLICATE_SKU");
    }
    const id = `p_${Date.now()}`;
    const product: Product = {
      id, name: input.name, slug: input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      categoryId: input.categoryId, subcategoryId: null, sku: input.sku,
      basePrice: input.basePrice, mrp: input.mrp, attributes: {}, images: [],
      status: input.status, isFeatured: false, ratingAvg: 0, createdAt: new Date().toISOString(),
      variants: [{ id: `v_${id}`, sku: input.sku, attributes: {}, price: input.basePrice, mrp: input.mrp, available: 0, reserved: 0 }],
    };
    db.PRODUCTS.unshift(product);
    const cat = db.CATEGORIES.find((c) => c.id === input.categoryId);
    if (cat) cat.productCount += 1;
    return ok(product, "Product created");
  });
}

export async function updateProductStatus(id: string, status: Product["status"]) {
  return simulate(() => {
    const product = db.PRODUCTS.find((p) => p.id === id);
    if (!product) throw new ApiRequestError("Product not found.", "PRODUCT_NOT_FOUND");
    product.status = status;
    return ok(product, `Product marked ${status}`);
  });
}

export async function updateProduct(id: string, patch: Partial<Pick<Product, "name" | "categoryId" | "basePrice" | "mrp" | "status">>) {
  return simulate(() => {
    const product = db.PRODUCTS.find((p) => p.id === id);
    if (!product) throw new ApiRequestError("Product not found.", "PRODUCT_NOT_FOUND");
    Object.assign(product, patch);
    return ok(product, "Product updated");
  });
}

export async function deleteProduct(id: string) {
  return simulate(() => {
    const idx = db.PRODUCTS.findIndex((p) => p.id === id);
    if (idx === -1) throw new ApiRequestError("Product not found.", "PRODUCT_NOT_FOUND");
    const [removed] = db.PRODUCTS.splice(idx, 1);
    const cat = db.CATEGORIES.find((c) => c.id === removed.categoryId);
    if (cat) cat.productCount = Math.max(0, cat.productCount - 1);
    return ok({ id }, "Product deleted");
  });
}

export async function toggleFeatured(id: string) {
  return simulate(() => {
    const product = db.PRODUCTS.find((p) => p.id === id);
    if (!product) throw new ApiRequestError("Product not found.", "PRODUCT_NOT_FOUND");
    product.isFeatured = !product.isFeatured;
    return ok(product);
  });
}

export async function listCategories() {
  return simulate(() => ok([...db.CATEGORIES]));
}

export async function createCategory(input: { name: string; parentId?: string | null }) {
  return simulate(() => {
    const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (db.CATEGORIES.some((c) => c.slug === slug)) {
      throw new ApiRequestError("A category with this name already exists.", "DUPLICATE_CATEGORY");
    }
    const category: Category = { id: `cat_${Date.now()}`, name: input.name, slug, parentId: input.parentId ?? null, productCount: 0, isActive: true };
    db.CATEGORIES.push(category);
    return ok(category, "Category created");
  });
}

export async function updateCategory(id: string, patch: Partial<Pick<Category, "name" | "isActive" | "parentId">>) {
  return simulate(() => {
    const category = db.CATEGORIES.find((c) => c.id === id);
    if (!category) throw new ApiRequestError("Category not found.", "CATEGORY_NOT_FOUND");
    Object.assign(category, patch);
    if (patch.name) category.slug = patch.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return ok(category, "Category updated");
  });
}

export async function deleteCategory(id: string) {
  return simulate(() => {
    const category = db.CATEGORIES.find((c) => c.id === id);
    if (!category) throw new ApiRequestError("Category not found.", "CATEGORY_NOT_FOUND");
    if (category.productCount > 0) {
      throw new ApiRequestError("Move or delete its products before deleting this category.", "CATEGORY_NOT_EMPTY");
    }
    if (db.CATEGORIES.some((c) => c.parentId === id)) {
      throw new ApiRequestError("Delete or reassign its subcategories first.", "CATEGORY_HAS_CHILDREN");
    }
    const idx = db.CATEGORIES.findIndex((c) => c.id === id);
    db.CATEGORIES.splice(idx, 1);
    return ok({ id }, "Category deleted");
  });
}

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

export async function listInventory(params: { page?: number; limit?: number; lowStockOnly?: boolean } = {}) {
  return simulate(() => {
    let rows = [...db.INVENTORY];
    if (params.lowStockOnly) rows = rows.filter((r) => r.available <= r.lowStockThreshold);
    const { rows: paged, meta } = paginate(rows, params.page, params.limit ?? 10);
    return ok(paged, "OK", meta);
  });
}

export async function listInventoryTransactions(sku?: string) {
  return simulate(() => {
    let rows = [...db.INVENTORY_TXNS];
    if (sku) rows = rows.filter((t) => t.sku === sku);
    return ok(rows.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)));
  });
}

export async function adjustInventory(sku: string, delta: number, reason: string) {
  return simulate(() => {
    const row = db.INVENTORY.find((r) => r.sku === sku);
    if (!row) throw new ApiRequestError("Inventory row not found.", "INVENTORY_NOT_FOUND");
    if (row.available + delta < 0) throw new ApiRequestError("Adjustment would take stock negative.", "INVALID_ADJUSTMENT");
    row.available += delta;
    const txn: InventoryTransaction = {
      id: `it_${Date.now()}`, inventoryId: row.id, sku, type: "adjustment",
      qty: delta, refId: reason || "manual", createdAt: new Date().toISOString(),
    };
    db.INVENTORY_TXNS.unshift(txn);
    return ok(row, "Stock adjusted");
  });
}

// ---------------------------------------------------------------------------
// Suppliers & purchases
// ---------------------------------------------------------------------------

export async function listSuppliers() {
  return simulate(() => ok([...db.SUPPLIERS]));
}

export async function createSupplier(input: { name: string; contact: string; address: string }) {
  return simulate(() => {
    if (!input.name.trim()) throw new ApiRequestError("Supplier name is required.", "INVALID_SUPPLIER");
    const supplier: Supplier = { id: `sup_${Date.now()}`, name: input.name, contact: input.contact, address: input.address };
    db.SUPPLIERS.push(supplier);
    return ok(supplier, "Supplier added");
  });
}

export async function listPurchases() {
  return simulate(() => ok([...db.PURCHASES].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))));
}

export async function createPurchase(input: { supplierId: string; items: { sku: string; orderedQty: number; cost: number }[] }) {
  return simulate(() => {
    const supplier = db.SUPPLIERS.find((s) => s.id === input.supplierId);
    if (!supplier) throw new ApiRequestError("Supplier not found.", "SUPPLIER_NOT_FOUND");
    if (input.items.length === 0) throw new ApiRequestError("Add at least one line item.", "EMPTY_PURCHASE");
    const items = input.items.map((i) => {
      const inv = db.INVENTORY.find((row) => row.sku === i.sku);
      const variantId = db.PRODUCTS.flatMap((p) => p.variants).find((v) => v.sku === i.sku)?.id ?? i.sku;
      if (!inv) throw new ApiRequestError(`Unknown SKU: ${i.sku}`, "SKU_NOT_FOUND");
      return { variantId, sku: i.sku, orderedQty: i.orderedQty, receivedQty: 0, cost: i.cost };
    });
    const purchase: Purchase = {
      id: `po_${Date.now()}`, supplierId: supplier.id, supplierName: supplier.name,
      items, status: "Ordered", createdAt: new Date().toISOString(),
    };
    db.PURCHASES.unshift(purchase);
    return ok(purchase, "Purchase order created");
  });
}

export async function receivePurchase(id: string) {
  return simulate(() => {
    const po = db.PURCHASES.find((p) => p.id === id);
    if (!po) throw new ApiRequestError("Purchase order not found.", "PURCHASE_NOT_FOUND");
    po.items.forEach((item) => {
      const pending = item.orderedQty - item.receivedQty;
      if (pending <= 0) return;
      item.receivedQty = item.orderedQty;
      const inv = db.INVENTORY.find((r) => r.sku === item.sku);
      if (inv) {
        inv.available += pending;
        db.INVENTORY_TXNS.unshift({
          id: `it_${Date.now()}_${item.sku}`, inventoryId: inv.id, sku: item.sku,
          type: "purchase", qty: pending, refId: po.id, createdAt: new Date().toISOString(),
        });
      }
    });
    po.status = "Received";
    return ok(po, "Purchase received — inventory updated");
  });
}

// ---------------------------------------------------------------------------
// Orders & sales
// ---------------------------------------------------------------------------

export async function listOrders(params: { page?: number; limit?: number; status?: OrderStatus; q?: string } = {}) {
  return simulate(() => {
    let rows = [...db.ORDERS].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (params.status) rows = rows.filter((o) => o.status === params.status);
    if (params.q) {
      const q = params.q.toLowerCase();
      rows = rows.filter((o) => o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q));
    }
    const { rows: paged, meta } = paginate(rows, params.page, params.limit ?? 10);
    return ok(paged, "OK", meta);
  });
}

export async function getOrder(id: string) {
  return simulate(() => {
    const order = db.ORDERS.find((o) => o.id === id);
    if (!order) throw new ApiRequestError("Order not found.", "ORDER_NOT_FOUND");
    return ok(order);
  });
}

export async function transitionOrder(id: string, to: OrderStatus) {
  return simulate(() => {
    const order = db.ORDERS.find((o) => o.id === id);
    if (!order) throw new ApiRequestError("Order not found.", "ORDER_NOT_FOUND");
    if (!canTransition(ORDER_TRANSITIONS, order.status, to)) {
      throw new ApiRequestError(`Cannot move an order from ${order.status} to ${to}.`, "ILLEGAL_TRANSITION");
    }
    order.status = to;
    return ok(order, `Order moved to ${to}`);
  });
}

export async function listPayments(params: { q?: string; status?: string } = {}) {
  return simulate(() => {
    let rows = [...db.PAYMENTS].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (params.status) rows = rows.filter((p) => p.status === params.status);
    if (params.q) {
      const q = params.q.toLowerCase();
      rows = rows.filter((p) => p.orderNumber.toLowerCase().includes(q) || p.providerRefId.toLowerCase().includes(q));
    }
    return ok(rows);
  });
}

export async function getSalesReport() {
  return simulate(() => {
    const byCategory = db.CATEGORIES.filter((c) => !c.parentId).map((cat) => {
      const skus = new Set(db.PRODUCTS.filter((p) => p.categoryId === cat.id).flatMap((p) => p.variants.map((v) => v.sku)));
      const revenue = db.ORDERS.filter((o) => o.status !== "Cancelled")
        .flatMap((o) => o.items)
        .filter((item) => skus.has(item.sku))
        .reduce((s, item) => s + item.price * item.qty, 0);
      return { category: cat.name, revenue };
    });
    const topProducts = [...db.PRODUCTS]
      .map((p) => {
        const unitsSold = db.ORDERS.filter((o) => o.status !== "Cancelled")
          .flatMap((o) => o.items)
          .filter((item) => p.variants.some((v) => v.sku === item.sku))
          .reduce((s, item) => s + item.qty, 0);
        return { name: p.name, sku: p.sku, unitsSold, revenue: unitsSold * p.basePrice };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    const totalRevenue = db.ORDERS.filter((o) => o.status !== "Cancelled").reduce((s, o) => s + o.total, 0);
    const avgOrderValue = totalRevenue / Math.max(1, db.ORDERS.length);
    return ok({ trend: db.REVENUE_TREND, byCategory, topProducts, totalRevenue, avgOrderValue, orderCount: db.ORDERS.length });
  });
}

// ---------------------------------------------------------------------------
// Returns & refunds
// ---------------------------------------------------------------------------

export async function listReturns() {
  return simulate(() => ok([...db.RETURNS].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))));
}

export async function transitionReturn(id: string, to: ReturnStatus) {
  return simulate(() => {
    const ret = db.RETURNS.find((r) => r.id === id);
    if (!ret) throw new ApiRequestError("Return not found.", "RETURN_NOT_FOUND");
    if (!canTransition(RETURN_TRANSITIONS, ret.status, to)) {
      throw new ApiRequestError(`Cannot move a return from ${ret.status} to ${to}.`, "ILLEGAL_TRANSITION");
    }
    ret.status = to;
    if (to === "Refunded") {
      const order = db.ORDERS.find((o) => o.id === ret.orderId);
      const amount = order ? order.total : 0;
      db.REFUNDS.unshift({
        id: `rf_${Date.now()}`, paymentId: order?.paymentId ?? "", returnId: ret.id,
        orderNumber: ret.orderNumber, amount, status: "Initiated", createdAt: new Date().toISOString(),
      });
    }
    return ok(ret, `Return moved to ${to}`);
  });
}

export async function listRefunds() {
  return simulate(() => ok([...db.REFUNDS].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))));
}

export async function transitionRefund(id: string, to: RefundStatus) {
  return simulate(() => {
    const rf = db.REFUNDS.find((r) => r.id === id);
    if (!rf) throw new ApiRequestError("Refund not found.", "REFUND_NOT_FOUND");
    if (!canTransition(REFUND_TRANSITIONS, rf.status, to)) {
      throw new ApiRequestError(`Cannot move a refund from ${rf.status} to ${to}.`, "ILLEGAL_TRANSITION");
    }
    rf.status = to;
    return ok(rf, `Refund moved to ${to}`);
  });
}

// ---------------------------------------------------------------------------
// Customers & coupons
// ---------------------------------------------------------------------------

export async function listCustomers(params: { page?: number; limit?: number; q?: string } = {}) {
  return simulate(() => {
    let rows = [...db.CUSTOMERS];
    if (params.q) {
      const q = params.q.toLowerCase();
      rows = rows.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q));
    }
    const { rows: paged, meta } = paginate(rows, params.page, params.limit ?? 10);
    return ok(paged, "OK", meta);
  });
}

export async function getCustomer(id: string) {
  return simulate(() => {
    const customer = db.CUSTOMERS.find((c) => c.id === id);
    if (!customer) throw new ApiRequestError("Customer not found.", "CUSTOMER_NOT_FOUND");
    const orders = db.ORDERS.filter((o) => o.userId === id).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return ok({ customer, orders });
  });
}

export async function listCoupons() {
  return simulate(() => ok([...db.COUPONS]));
}

export async function createCoupon(input: { code: string; type: Coupon["type"]; value: number; minCartValue: number; expiry: string; usageLimit: number }) {
  return simulate(() => {
    const code = input.code.trim().toUpperCase();
    if (!code) throw new ApiRequestError("Coupon code is required.", "INVALID_COUPON");
    if (db.COUPONS.some((c) => c.code === code)) {
      throw new ApiRequestError("A coupon with this code already exists.", "DUPLICATE_COUPON");
    }
    const coupon: Coupon = { id: `cp_${Date.now()}`, code, type: input.type, value: input.value, minCartValue: input.minCartValue, expiry: input.expiry, usageLimit: input.usageLimit, used: 0, isActive: true };
    db.COUPONS.unshift(coupon);
    return ok(coupon, "Coupon created");
  });
}

export async function updateCoupon(id: string, patch: Partial<Pick<Coupon, "value" | "minCartValue" | "expiry" | "usageLimit">>) {
  return simulate(() => {
    const coupon = db.COUPONS.find((c) => c.id === id);
    if (!coupon) throw new ApiRequestError("Coupon not found.", "COUPON_NOT_FOUND");
    Object.assign(coupon, patch);
    return ok(coupon, "Coupon updated");
  });
}

export async function deleteCoupon(id: string) {
  return simulate(() => {
    const idx = db.COUPONS.findIndex((c) => c.id === id);
    if (idx === -1) throw new ApiRequestError("Coupon not found.", "COUPON_NOT_FOUND");
    db.COUPONS.splice(idx, 1);
    return ok({ id }, "Coupon deleted");
  });
}

export async function toggleCoupon(id: string) {
  return simulate(() => {
    const c = db.COUPONS.find((c) => c.id === id);
    if (!c) throw new ApiRequestError("Coupon not found.", "COUPON_NOT_FOUND");
    c.isActive = !c.isActive;
    return ok(c);
  });
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export async function listBanners() {
  return simulate(() => ok([...db.BANNERS].sort((a, b) => a.order - b.order)));
}

export async function createBanner(input: { title: string; ctaText: string; ctaUrl: string }) {
  return simulate(() => {
    if (!input.title.trim()) throw new ApiRequestError("Banner title is required.", "INVALID_BANNER");
    const banner: Banner = {
      id: `bn_${Date.now()}`, title: input.title, ctaText: input.ctaText || "Shop now",
      ctaUrl: input.ctaUrl || "/", order: db.BANNERS.length + 1, isActive: true,
    };
    db.BANNERS.push(banner);
    return ok(banner, "Banner created");
  });
}

export async function toggleBanner(id: string) {
  return simulate(() => {
    const b = db.BANNERS.find((b) => b.id === id);
    if (!b) throw new ApiRequestError("Banner not found.", "BANNER_NOT_FOUND");
    b.isActive = !b.isActive;
    return ok(b);
  });
}

export async function listHomepageSections() {
  return simulate(() => ok([...db.HOMEPAGE_SECTIONS].sort((a, b) => a.order - b.order)));
}

export async function toggleHomepageSection(id: string) {
  return simulate(() => {
    const s = db.HOMEPAGE_SECTIONS.find((s) => s.id === id);
    if (!s) throw new ApiRequestError("Section not found.", "SECTION_NOT_FOUND");
    s.isActive = !s.isActive;
    return ok(s);
  });
}

// ---------------------------------------------------------------------------
// RBAC & audit
// ---------------------------------------------------------------------------

export async function listRoles() {
  return simulate(() => ok([...db.ROLES]));
}

const ALL_PERMISSIONS: Permission[] = [
  "dashboard.view",
  "products.view", "products.write", "categories.view", "categories.write",
  "inventory.view", "inventory.write", "purchases.view", "purchases.write",
  "orders.view", "orders.write", "sales.view", "payments.view",
  "returns.view", "returns.write", "refunds.view", "refunds.write",
  "customers.view", "coupons.view", "coupons.write", "content.view", "content.write",
  "admin_users.view", "admin_users.write", "roles.view", "roles.write", "audit.view",
];

export function allPermissions() {
  return ALL_PERMISSIONS;
}

export async function createRole(input: { name: string; description: string; permissions: Permission[] }) {
  return simulate(() => {
    if (!input.name.trim()) throw new ApiRequestError("Role name is required.", "INVALID_ROLE");
    if (db.ROLES.some((r) => r.name.toLowerCase() === input.name.trim().toLowerCase())) {
      throw new ApiRequestError("A role with this name already exists.", "DUPLICATE_ROLE");
    }
    const role: Role = { id: `role_${Date.now()}`, name: input.name.trim(), description: input.description, permissions: input.permissions };
    db.ROLES.push(role);
    return ok(role, "Role created");
  });
}

export async function updateRolePermissions(id: string, permissions: Permission[]) {
  return simulate(() => {
    const role = db.ROLES.find((r) => r.id === id);
    if (!role) throw new ApiRequestError("Role not found.", "ROLE_NOT_FOUND");
    if (role.isSystem) throw new ApiRequestError("The Super Admin role cannot be edited.", "SYSTEM_ROLE_LOCKED");
    role.permissions = permissions;
    return ok(role, "Role permissions updated");
  });
}

export async function listAdminUsers() {
  return simulate(() => ok([...db.ADMIN_USERS]));
}

export async function inviteAdminUser(input: { name: string; email: string; roleId: string }) {
  return simulate(() => {
    const email = input.email.trim().toLowerCase();
    if (!input.name.trim() || !email) throw new ApiRequestError("Name and email are required.", "INVALID_ADMIN_USER");
    if (db.ADMIN_USERS.some((u) => u.email.toLowerCase() === email)) {
      throw new ApiRequestError("An admin with this email already exists.", "DUPLICATE_ADMIN_USER");
    }
    const user: AdminUser = { id: `au_${Date.now()}`, name: input.name, email, roleId: input.roleId, status: "active", createdAt: new Date().toISOString() };
    db.ADMIN_USERS.push(user);
    return ok(user, "Invite sent");
  });
}

export async function toggleAdminUserStatus(id: string) {
  return simulate(() => {
    const user = db.ADMIN_USERS.find((u) => u.id === id);
    if (!user) throw new ApiRequestError("Admin user not found.", "ADMIN_USER_NOT_FOUND");
    user.status = user.status === "active" ? "suspended" : "active";
    return ok(user, user.status === "suspended" ? "Admin suspended" : "Admin reactivated");
  });
}

export async function listAuditLog() {
  return simulate(() => ok([...db.AUDIT_LOG].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))));
}

export type { Product, Category, InventoryRow, Supplier, Purchase, Order, Return, Refund, Customer, Coupon, Banner, HomepageSection, Payment, AuditLogEntry, Role, AdminUser };
