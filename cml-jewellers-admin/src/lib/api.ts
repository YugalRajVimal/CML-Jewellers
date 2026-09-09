// // // // // Typed client for /api/v1/admin.
// // // // //
// // // // // Swap-out point: every function here currently resolves against the mock
// // // // // dataset in ./mock-data with a simulated network delay + the exact success
// // // // // envelope from PART 5 — API CONTRACT. Point ADMIN_API_BASE_URL at the real
// // // // // backend and replace the body of `request()` with a `fetch()` call; every
// // // // // call site (hooks, pages) stays unchanged because they only depend on the
// // // // // `ApiResponse<T>` shape below.

// // // // import * as db from "./mock-data";
// // // // import { canTransition, ORDER_TRANSITIONS, REFUND_TRANSITIONS, RETURN_TRANSITIONS } from "./state-machines";
// // // // import {
// // // //   AdminUser, Category, Coupon, InventoryRow, InventoryTransaction, Order,
// // // //   OrderStatus, Payment, Product, Purchase, Refund, RefundStatus, Return, ReturnStatus,
// // // //   Role, Supplier, Customer, Banner, HomepageSection, AuditLogEntry, Permission,
// // // // } from "./types";

// // // // export interface ApiMeta { page: number; limit: number; total: number }
// // // // export interface ApiResponse<T> {
// // // //   success: true;
// // // //   message: string;
// // // //   data: T;
// // // //   meta?: ApiMeta;
// // // // }
// // // // export interface ApiError {
// // // //   success: false;
// // // //   message: string;
// // // //   error: { code: string; details?: Record<string, unknown> };
// // // // }

// // // // export class ApiRequestError extends Error {
// // // //   code: string;
// // // //   constructor(message: string, code: string) {
// // // //     super(message);
// // // //     this.code = code;
// // // //   }
// // // // }

// // // // const LATENCY_MS = 260;

// // // // function ok<T>(data: T, message = "OK", meta?: ApiMeta): ApiResponse<T> {
// // // //   return { success: true, message, data, meta };
// // // // }

// // // // async function simulate<T>(fn: () => T): Promise<T> {
// // // //   await new Promise((r) => setTimeout(r, LATENCY_MS));
// // // //   return fn();
// // // // }

// // // // function paginate<T>(rows: T[], page = 1, limit = 20): { rows: T[]; meta: ApiMeta } {
// // // //   const start = (page - 1) * limit;
// // // //   return { rows: rows.slice(start, start + limit), meta: { page, limit, total: rows.length } };
// // // // }

// // // // // ---------------------------------------------------------------------------
// // // // // Auth
// // // // // ---------------------------------------------------------------------------

// // // // const DEMO_CREDENTIALS: Record<string, { password: string; userId: string }> = {
// // // //   "meera@cmljewellers.com": { password: "super123", userId: "au_1" },
// // // //   "rohan@cmljewellers.com": { password: "catalog123", userId: "au_2" },
// // // //   "priya@cmljewellers.com": { password: "ops123", userId: "au_3" },
// // // // };

// // // // export interface Session {
// // // //   token: string;
// // // //   user: AdminUser;
// // // //   role: Role;
// // // // }

// // // // export async function login(email: string, password: string): Promise<ApiResponse<Session>> {
// // // //   return simulate(() => {
// // // //     const cred = DEMO_CREDENTIALS[email.trim().toLowerCase()];
// // // //     const user = db.ADMIN_USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
// // // //     if (!cred || cred.password !== password || !user) {
// // // //       throw new ApiRequestError("Incorrect email or password.", "INVALID_CREDENTIALS");
// // // //     }
// // // //     if (user.status === "suspended") {
// // // //       throw new ApiRequestError("This admin account has been suspended.", "ACCOUNT_SUSPENDED");
// // // //     }
// // // //     const role = db.ROLES.find((r) => r.id === user.roleId)!;
// // // //     const token = `demo.${user.id}.${Date.now()}`;
// // // //     return ok({ token, user, role }, "Signed in");
// // // //   });
// // // // }

// // // // export function permissionsFor(role: Role): Set<Permission> {
// // // //   return new Set(role.permissions);
// // // // }

// // // // // ---------------------------------------------------------------------------
// // // // // Dashboard
// // // // // ---------------------------------------------------------------------------

// // // // export async function getDashboard() {
// // // //   return simulate(() => {
// // // //     const revenue30d = db.ORDERS.filter((o) => o.status !== "Cancelled").reduce((s, o) => s + o.total, 0);
// // // //     const openOrders = db.ORDERS.filter((o) => !["Delivered", "Cancelled"].includes(o.status)).length;
// // // //     const lowStock = db.INVENTORY.filter((i) => i.available <= i.lowStockThreshold).length;
// // // //     const pendingReturns = db.RETURNS.filter((r) => !["Refunded", "Rejected", "Cancelled"].includes(r.status)).length;
// // // //     return ok({
// // // //       stats: {
// // // //         revenue30d,
// // // //         orders30d: db.ORDERS.length,
// // // //         customers: db.CUSTOMERS.length,
// // // //         openOrders,
// // // //         lowStock,
// // // //         pendingReturns,
// // // //       },
// // // //       trend: db.REVENUE_TREND,
// // // //       recentOrders: [...db.ORDERS].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 5),
// // // //       lowStockRows: db.INVENTORY.filter((i) => i.available <= i.lowStockThreshold),
// // // //     });
// // // //   });
// // // // }

// // // // // ---------------------------------------------------------------------------
// // // // // Products & categories
// // // // // ---------------------------------------------------------------------------

// // // // export async function listProducts(params: { page?: number; limit?: number; q?: string; status?: string; categoryId?: string } = {}) {
// // // //   return simulate(() => {
// // // //     let rows = [...db.PRODUCTS];
// // // //     if (params.q) {
// // // //       const q = params.q.toLowerCase();
// // // //       rows = rows.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
// // // //     }
// // // //     if (params.status) rows = rows.filter((p) => p.status === params.status);
// // // //     if (params.categoryId) rows = rows.filter((p) => p.categoryId === params.categoryId);
// // // //     const { rows: paged, meta } = paginate(rows, params.page, params.limit ?? 10);
// // // //     return ok(paged, "OK", meta);
// // // //   });
// // // // }

// // // // export async function getProduct(id: string) {
// // // //   return simulate(() => {
// // // //     const product = db.PRODUCTS.find((p) => p.id === id);
// // // //     if (!product) throw new ApiRequestError("Product not found.", "PRODUCT_NOT_FOUND");
// // // //     return ok(product);
// // // //   });
// // // // }

// // // // export async function createProduct(input: {
// // // //   name: string; sku: string; categoryId: string; basePrice: number; mrp: number; status: Product["status"];
// // // // }) {
// // // //   return simulate(() => {
// // // //     if (db.PRODUCTS.some((p) => p.sku.toLowerCase() === input.sku.toLowerCase())) {
// // // //       throw new ApiRequestError("A product with this SKU already exists.", "DUPLICATE_SKU");
// // // //     }
// // // //     const id = `p_${Date.now()}`;
// // // //     const product: Product = {
// // // //       id, name: input.name, slug: input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
// // // //       categoryId: input.categoryId, subcategoryId: null, sku: input.sku,
// // // //       basePrice: input.basePrice, mrp: input.mrp, attributes: {}, images: [],
// // // //       status: input.status, isFeatured: false, ratingAvg: 0, createdAt: new Date().toISOString(),
// // // //       variants: [{ id: `v_${id}`, sku: input.sku, attributes: {}, price: input.basePrice, mrp: input.mrp, available: 0, reserved: 0 }],
// // // //     };
// // // //     db.PRODUCTS.unshift(product);
// // // //     const cat = db.CATEGORIES.find((c) => c.id === input.categoryId);
// // // //     if (cat) cat.productCount += 1;
// // // //     return ok(product, "Product created");
// // // //   });
// // // // }

// // // // export async function updateProductStatus(id: string, status: Product["status"]) {
// // // //   return simulate(() => {
// // // //     const product = db.PRODUCTS.find((p) => p.id === id);
// // // //     if (!product) throw new ApiRequestError("Product not found.", "PRODUCT_NOT_FOUND");
// // // //     product.status = status;
// // // //     return ok(product, `Product marked ${status}`);
// // // //   });
// // // // }

// // // // export async function updateProduct(id: string, patch: Partial<Pick<Product, "name" | "categoryId" | "basePrice" | "mrp" | "status">>) {
// // // //   return simulate(() => {
// // // //     const product = db.PRODUCTS.find((p) => p.id === id);
// // // //     if (!product) throw new ApiRequestError("Product not found.", "PRODUCT_NOT_FOUND");
// // // //     Object.assign(product, patch);
// // // //     return ok(product, "Product updated");
// // // //   });
// // // // }

// // // // export async function deleteProduct(id: string) {
// // // //   return simulate(() => {
// // // //     const idx = db.PRODUCTS.findIndex((p) => p.id === id);
// // // //     if (idx === -1) throw new ApiRequestError("Product not found.", "PRODUCT_NOT_FOUND");
// // // //     const [removed] = db.PRODUCTS.splice(idx, 1);
// // // //     const cat = db.CATEGORIES.find((c) => c.id === removed.categoryId);
// // // //     if (cat) cat.productCount = Math.max(0, cat.productCount - 1);
// // // //     return ok({ id }, "Product deleted");
// // // //   });
// // // // }

// // // // export async function toggleFeatured(id: string) {
// // // //   return simulate(() => {
// // // //     const product = db.PRODUCTS.find((p) => p.id === id);
// // // //     if (!product) throw new ApiRequestError("Product not found.", "PRODUCT_NOT_FOUND");
// // // //     product.isFeatured = !product.isFeatured;
// // // //     return ok(product);
// // // //   });
// // // // }

// // // // export async function listCategories() {
// // // //   return simulate(() => ok([...db.CATEGORIES]));
// // // // }

// // // // export async function createCategory(input: { name: string; parentId?: string | null }) {
// // // //   return simulate(() => {
// // // //     const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
// // // //     if (db.CATEGORIES.some((c) => c.slug === slug)) {
// // // //       throw new ApiRequestError("A category with this name already exists.", "DUPLICATE_CATEGORY");
// // // //     }
// // // //     const category: Category = { id: `cat_${Date.now()}`, name: input.name, slug, parentId: input.parentId ?? null, productCount: 0, isActive: true };
// // // //     db.CATEGORIES.push(category);
// // // //     return ok(category, "Category created");
// // // //   });
// // // // }

// // // // export async function updateCategory(id: string, patch: Partial<Pick<Category, "name" | "isActive" | "parentId">>) {
// // // //   return simulate(() => {
// // // //     const category = db.CATEGORIES.find((c) => c.id === id);
// // // //     if (!category) throw new ApiRequestError("Category not found.", "CATEGORY_NOT_FOUND");
// // // //     Object.assign(category, patch);
// // // //     if (patch.name) category.slug = patch.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
// // // //     return ok(category, "Category updated");
// // // //   });
// // // // }

// // // // export async function deleteCategory(id: string) {
// // // //   return simulate(() => {
// // // //     const category = db.CATEGORIES.find((c) => c.id === id);
// // // //     if (!category) throw new ApiRequestError("Category not found.", "CATEGORY_NOT_FOUND");
// // // //     if (category.productCount > 0) {
// // // //       throw new ApiRequestError("Move or delete its products before deleting this category.", "CATEGORY_NOT_EMPTY");
// // // //     }
// // // //     if (db.CATEGORIES.some((c) => c.parentId === id)) {
// // // //       throw new ApiRequestError("Delete or reassign its subcategories first.", "CATEGORY_HAS_CHILDREN");
// // // //     }
// // // //     const idx = db.CATEGORIES.findIndex((c) => c.id === id);
// // // //     db.CATEGORIES.splice(idx, 1);
// // // //     return ok({ id }, "Category deleted");
// // // //   });
// // // // }

// // // // // ---------------------------------------------------------------------------
// // // // // Inventory
// // // // // ---------------------------------------------------------------------------

// // // // export async function listInventory(params: { page?: number; limit?: number; lowStockOnly?: boolean } = {}) {
// // // //   return simulate(() => {
// // // //     let rows = [...db.INVENTORY];
// // // //     if (params.lowStockOnly) rows = rows.filter((r) => r.available <= r.lowStockThreshold);
// // // //     const { rows: paged, meta } = paginate(rows, params.page, params.limit ?? 10);
// // // //     return ok(paged, "OK", meta);
// // // //   });
// // // // }

// // // // export async function listInventoryTransactions(sku?: string) {
// // // //   return simulate(() => {
// // // //     let rows = [...db.INVENTORY_TXNS];
// // // //     if (sku) rows = rows.filter((t) => t.sku === sku);
// // // //     return ok(rows.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)));
// // // //   });
// // // // }

// // // // export async function adjustInventory(sku: string, delta: number, reason: string) {
// // // //   return simulate(() => {
// // // //     const row = db.INVENTORY.find((r) => r.sku === sku);
// // // //     if (!row) throw new ApiRequestError("Inventory row not found.", "INVENTORY_NOT_FOUND");
// // // //     if (row.available + delta < 0) throw new ApiRequestError("Adjustment would take stock negative.", "INVALID_ADJUSTMENT");
// // // //     row.available += delta;
// // // //     const txn: InventoryTransaction = {
// // // //       id: `it_${Date.now()}`, inventoryId: row.id, sku, type: "adjustment",
// // // //       qty: delta, refId: reason || "manual", createdAt: new Date().toISOString(),
// // // //     };
// // // //     db.INVENTORY_TXNS.unshift(txn);
// // // //     return ok(row, "Stock adjusted");
// // // //   });
// // // // }

// // // // // ---------------------------------------------------------------------------
// // // // // Suppliers & purchases
// // // // // ---------------------------------------------------------------------------

// // // // export async function listSuppliers() {
// // // //   return simulate(() => ok([...db.SUPPLIERS]));
// // // // }

// // // // export async function createSupplier(input: { name: string; contact: string; address: string }) {
// // // //   return simulate(() => {
// // // //     if (!input.name.trim()) throw new ApiRequestError("Supplier name is required.", "INVALID_SUPPLIER");
// // // //     const supplier: Supplier = { id: `sup_${Date.now()}`, name: input.name, contact: input.contact, address: input.address };
// // // //     db.SUPPLIERS.push(supplier);
// // // //     return ok(supplier, "Supplier added");
// // // //   });
// // // // }

// // // // export async function listPurchases() {
// // // //   return simulate(() => ok([...db.PURCHASES].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))));
// // // // }

// // // // export async function createPurchase(input: { supplierId: string; items: { sku: string; orderedQty: number; cost: number }[] }) {
// // // //   return simulate(() => {
// // // //     const supplier = db.SUPPLIERS.find((s) => s.id === input.supplierId);
// // // //     if (!supplier) throw new ApiRequestError("Supplier not found.", "SUPPLIER_NOT_FOUND");
// // // //     if (input.items.length === 0) throw new ApiRequestError("Add at least one line item.", "EMPTY_PURCHASE");
// // // //     const items = input.items.map((i) => {
// // // //       const inv = db.INVENTORY.find((row) => row.sku === i.sku);
// // // //       const variantId = db.PRODUCTS.flatMap((p) => p.variants).find((v) => v.sku === i.sku)?.id ?? i.sku;
// // // //       if (!inv) throw new ApiRequestError(`Unknown SKU: ${i.sku}`, "SKU_NOT_FOUND");
// // // //       return { variantId, sku: i.sku, orderedQty: i.orderedQty, receivedQty: 0, cost: i.cost };
// // // //     });
// // // //     const purchase: Purchase = {
// // // //       id: `po_${Date.now()}`, supplierId: supplier.id, supplierName: supplier.name,
// // // //       items, status: "Ordered", createdAt: new Date().toISOString(),
// // // //     };
// // // //     db.PURCHASES.unshift(purchase);
// // // //     return ok(purchase, "Purchase order created");
// // // //   });
// // // // }

// // // // export async function receivePurchase(id: string) {
// // // //   return simulate(() => {
// // // //     const po = db.PURCHASES.find((p) => p.id === id);
// // // //     if (!po) throw new ApiRequestError("Purchase order not found.", "PURCHASE_NOT_FOUND");
// // // //     po.items.forEach((item) => {
// // // //       const pending = item.orderedQty - item.receivedQty;
// // // //       if (pending <= 0) return;
// // // //       item.receivedQty = item.orderedQty;
// // // //       const inv = db.INVENTORY.find((r) => r.sku === item.sku);
// // // //       if (inv) {
// // // //         inv.available += pending;
// // // //         db.INVENTORY_TXNS.unshift({
// // // //           id: `it_${Date.now()}_${item.sku}`, inventoryId: inv.id, sku: item.sku,
// // // //           type: "purchase", qty: pending, refId: po.id, createdAt: new Date().toISOString(),
// // // //         });
// // // //       }
// // // //     });
// // // //     po.status = "Received";
// // // //     return ok(po, "Purchase received — inventory updated");
// // // //   });
// // // // }

// // // // // ---------------------------------------------------------------------------
// // // // // Orders & sales
// // // // // ---------------------------------------------------------------------------

// // // // export async function listOrders(params: { page?: number; limit?: number; status?: OrderStatus; q?: string } = {}) {
// // // //   return simulate(() => {
// // // //     let rows = [...db.ORDERS].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
// // // //     if (params.status) rows = rows.filter((o) => o.status === params.status);
// // // //     if (params.q) {
// // // //       const q = params.q.toLowerCase();
// // // //       rows = rows.filter((o) => o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q));
// // // //     }
// // // //     const { rows: paged, meta } = paginate(rows, params.page, params.limit ?? 10);
// // // //     return ok(paged, "OK", meta);
// // // //   });
// // // // }

// // // // export async function getOrder(id: string) {
// // // //   return simulate(() => {
// // // //     const order = db.ORDERS.find((o) => o.id === id);
// // // //     if (!order) throw new ApiRequestError("Order not found.", "ORDER_NOT_FOUND");
// // // //     return ok(order);
// // // //   });
// // // // }

// // // // export async function transitionOrder(id: string, to: OrderStatus) {
// // // //   return simulate(() => {
// // // //     const order = db.ORDERS.find((o) => o.id === id);
// // // //     if (!order) throw new ApiRequestError("Order not found.", "ORDER_NOT_FOUND");
// // // //     if (!canTransition(ORDER_TRANSITIONS, order.status, to)) {
// // // //       throw new ApiRequestError(`Cannot move an order from ${order.status} to ${to}.`, "ILLEGAL_TRANSITION");
// // // //     }
// // // //     order.status = to;
// // // //     return ok(order, `Order moved to ${to}`);
// // // //   });
// // // // }

// // // // export async function listPayments(params: { q?: string; status?: string } = {}) {
// // // //   return simulate(() => {
// // // //     let rows = [...db.PAYMENTS].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
// // // //     if (params.status) rows = rows.filter((p) => p.status === params.status);
// // // //     if (params.q) {
// // // //       const q = params.q.toLowerCase();
// // // //       rows = rows.filter((p) => p.orderNumber.toLowerCase().includes(q) || p.providerRefId.toLowerCase().includes(q));
// // // //     }
// // // //     return ok(rows);
// // // //   });
// // // // }

// // // // export async function getSalesReport() {
// // // //   return simulate(() => {
// // // //     const byCategory = db.CATEGORIES.filter((c) => !c.parentId).map((cat) => {
// // // //       const skus = new Set(db.PRODUCTS.filter((p) => p.categoryId === cat.id).flatMap((p) => p.variants.map((v) => v.sku)));
// // // //       const revenue = db.ORDERS.filter((o) => o.status !== "Cancelled")
// // // //         .flatMap((o) => o.items)
// // // //         .filter((item) => skus.has(item.sku))
// // // //         .reduce((s, item) => s + item.price * item.qty, 0);
// // // //       return { category: cat.name, revenue };
// // // //     });
// // // //     const topProducts = [...db.PRODUCTS]
// // // //       .map((p) => {
// // // //         const unitsSold = db.ORDERS.filter((o) => o.status !== "Cancelled")
// // // //           .flatMap((o) => o.items)
// // // //           .filter((item) => p.variants.some((v) => v.sku === item.sku))
// // // //           .reduce((s, item) => s + item.qty, 0);
// // // //         return { name: p.name, sku: p.sku, unitsSold, revenue: unitsSold * p.basePrice };
// // // //       })
// // // //       .sort((a, b) => b.revenue - a.revenue)
// // // //       .slice(0, 5);
// // // //     const totalRevenue = db.ORDERS.filter((o) => o.status !== "Cancelled").reduce((s, o) => s + o.total, 0);
// // // //     const avgOrderValue = totalRevenue / Math.max(1, db.ORDERS.length);
// // // //     return ok({ trend: db.REVENUE_TREND, byCategory, topProducts, totalRevenue, avgOrderValue, orderCount: db.ORDERS.length });
// // // //   });
// // // // }

// // // // // ---------------------------------------------------------------------------
// // // // // Returns & refunds
// // // // // ---------------------------------------------------------------------------

// // // // export async function listReturns() {
// // // //   return simulate(() => ok([...db.RETURNS].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))));
// // // // }

// // // // export async function transitionReturn(id: string, to: ReturnStatus) {
// // // //   return simulate(() => {
// // // //     const ret = db.RETURNS.find((r) => r.id === id);
// // // //     if (!ret) throw new ApiRequestError("Return not found.", "RETURN_NOT_FOUND");
// // // //     if (!canTransition(RETURN_TRANSITIONS, ret.status, to)) {
// // // //       throw new ApiRequestError(`Cannot move a return from ${ret.status} to ${to}.`, "ILLEGAL_TRANSITION");
// // // //     }
// // // //     ret.status = to;
// // // //     if (to === "Refunded") {
// // // //       const order = db.ORDERS.find((o) => o.id === ret.orderId);
// // // //       const amount = order ? order.total : 0;
// // // //       db.REFUNDS.unshift({
// // // //         id: `rf_${Date.now()}`, paymentId: order?.paymentId ?? "", returnId: ret.id,
// // // //         orderNumber: ret.orderNumber, amount, status: "Initiated", createdAt: new Date().toISOString(),
// // // //       });
// // // //     }
// // // //     return ok(ret, `Return moved to ${to}`);
// // // //   });
// // // // }

// // // // export async function listRefunds() {
// // // //   return simulate(() => ok([...db.REFUNDS].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))));
// // // // }

// // // // export async function transitionRefund(id: string, to: RefundStatus) {
// // // //   return simulate(() => {
// // // //     const rf = db.REFUNDS.find((r) => r.id === id);
// // // //     if (!rf) throw new ApiRequestError("Refund not found.", "REFUND_NOT_FOUND");
// // // //     if (!canTransition(REFUND_TRANSITIONS, rf.status, to)) {
// // // //       throw new ApiRequestError(`Cannot move a refund from ${rf.status} to ${to}.`, "ILLEGAL_TRANSITION");
// // // //     }
// // // //     rf.status = to;
// // // //     return ok(rf, `Refund moved to ${to}`);
// // // //   });
// // // // }

// // // // // ---------------------------------------------------------------------------
// // // // // Customers & coupons
// // // // // ---------------------------------------------------------------------------

// // // // export async function listCustomers(params: { page?: number; limit?: number; q?: string } = {}) {
// // // //   return simulate(() => {
// // // //     let rows = [...db.CUSTOMERS];
// // // //     if (params.q) {
// // // //       const q = params.q.toLowerCase();
// // // //       rows = rows.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q));
// // // //     }
// // // //     const { rows: paged, meta } = paginate(rows, params.page, params.limit ?? 10);
// // // //     return ok(paged, "OK", meta);
// // // //   });
// // // // }

// // // // export async function getCustomer(id: string) {
// // // //   return simulate(() => {
// // // //     const customer = db.CUSTOMERS.find((c) => c.id === id);
// // // //     if (!customer) throw new ApiRequestError("Customer not found.", "CUSTOMER_NOT_FOUND");
// // // //     const orders = db.ORDERS.filter((o) => o.userId === id).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
// // // //     return ok({ customer, orders });
// // // //   });
// // // // }

// // // // export async function listCoupons() {
// // // //   return simulate(() => ok([...db.COUPONS]));
// // // // }

// // // // export async function createCoupon(input: { code: string; type: Coupon["type"]; value: number; minCartValue: number; expiry: string; usageLimit: number }) {
// // // //   return simulate(() => {
// // // //     const code = input.code.trim().toUpperCase();
// // // //     if (!code) throw new ApiRequestError("Coupon code is required.", "INVALID_COUPON");
// // // //     if (db.COUPONS.some((c) => c.code === code)) {
// // // //       throw new ApiRequestError("A coupon with this code already exists.", "DUPLICATE_COUPON");
// // // //     }
// // // //     const coupon: Coupon = { id: `cp_${Date.now()}`, code, type: input.type, value: input.value, minCartValue: input.minCartValue, expiry: input.expiry, usageLimit: input.usageLimit, used: 0, isActive: true };
// // // //     db.COUPONS.unshift(coupon);
// // // //     return ok(coupon, "Coupon created");
// // // //   });
// // // // }

// // // // export async function updateCoupon(id: string, patch: Partial<Pick<Coupon, "value" | "minCartValue" | "expiry" | "usageLimit">>) {
// // // //   return simulate(() => {
// // // //     const coupon = db.COUPONS.find((c) => c.id === id);
// // // //     if (!coupon) throw new ApiRequestError("Coupon not found.", "COUPON_NOT_FOUND");
// // // //     Object.assign(coupon, patch);
// // // //     return ok(coupon, "Coupon updated");
// // // //   });
// // // // }

// // // // export async function deleteCoupon(id: string) {
// // // //   return simulate(() => {
// // // //     const idx = db.COUPONS.findIndex((c) => c.id === id);
// // // //     if (idx === -1) throw new ApiRequestError("Coupon not found.", "COUPON_NOT_FOUND");
// // // //     db.COUPONS.splice(idx, 1);
// // // //     return ok({ id }, "Coupon deleted");
// // // //   });
// // // // }

// // // // export async function toggleCoupon(id: string) {
// // // //   return simulate(() => {
// // // //     const c = db.COUPONS.find((c) => c.id === id);
// // // //     if (!c) throw new ApiRequestError("Coupon not found.", "COUPON_NOT_FOUND");
// // // //     c.isActive = !c.isActive;
// // // //     return ok(c);
// // // //   });
// // // // }

// // // // // ---------------------------------------------------------------------------
// // // // // Content
// // // // // ---------------------------------------------------------------------------

// // // // export async function listBanners() {
// // // //   return simulate(() => ok([...db.BANNERS].sort((a, b) => a.order - b.order)));
// // // // }

// // // // export async function createBanner(input: { title: string; ctaText: string; ctaUrl: string }) {
// // // //   return simulate(() => {
// // // //     if (!input.title.trim()) throw new ApiRequestError("Banner title is required.", "INVALID_BANNER");
// // // //     const banner: Banner = {
// // // //       id: `bn_${Date.now()}`, title: input.title, ctaText: input.ctaText || "Shop now",
// // // //       ctaUrl: input.ctaUrl || "/", order: db.BANNERS.length + 1, isActive: true,
// // // //     };
// // // //     db.BANNERS.push(banner);
// // // //     return ok(banner, "Banner created");
// // // //   });
// // // // }

// // // // export async function toggleBanner(id: string) {
// // // //   return simulate(() => {
// // // //     const b = db.BANNERS.find((b) => b.id === id);
// // // //     if (!b) throw new ApiRequestError("Banner not found.", "BANNER_NOT_FOUND");
// // // //     b.isActive = !b.isActive;
// // // //     return ok(b);
// // // //   });
// // // // }

// // // // export async function listHomepageSections() {
// // // //   return simulate(() => ok([...db.HOMEPAGE_SECTIONS].sort((a, b) => a.order - b.order)));
// // // // }

// // // // export async function toggleHomepageSection(id: string) {
// // // //   return simulate(() => {
// // // //     const s = db.HOMEPAGE_SECTIONS.find((s) => s.id === id);
// // // //     if (!s) throw new ApiRequestError("Section not found.", "SECTION_NOT_FOUND");
// // // //     s.isActive = !s.isActive;
// // // //     return ok(s);
// // // //   });
// // // // }

// // // // // ---------------------------------------------------------------------------
// // // // // RBAC & audit
// // // // // ---------------------------------------------------------------------------

// // // // export async function listRoles() {
// // // //   return simulate(() => ok([...db.ROLES]));
// // // // }

// // // // const ALL_PERMISSIONS: Permission[] = [
// // // //   "dashboard.view",
// // // //   "products.view", "products.write", "categories.view", "categories.write",
// // // //   "inventory.view", "inventory.write", "purchases.view", "purchases.write",
// // // //   "orders.view", "orders.write", "sales.view", "payments.view",
// // // //   "returns.view", "returns.write", "refunds.view", "refunds.write",
// // // //   "customers.view", "coupons.view", "coupons.write", "content.view", "content.write",
// // // //   "admin_users.view", "admin_users.write", "roles.view", "roles.write", "audit.view",
// // // // ];

// // // // export function allPermissions() {
// // // //   return ALL_PERMISSIONS;
// // // // }

// // // // export async function createRole(input: { name: string; description: string; permissions: Permission[] }) {
// // // //   return simulate(() => {
// // // //     if (!input.name.trim()) throw new ApiRequestError("Role name is required.", "INVALID_ROLE");
// // // //     if (db.ROLES.some((r) => r.name.toLowerCase() === input.name.trim().toLowerCase())) {
// // // //       throw new ApiRequestError("A role with this name already exists.", "DUPLICATE_ROLE");
// // // //     }
// // // //     const role: Role = { id: `role_${Date.now()}`, name: input.name.trim(), description: input.description, permissions: input.permissions };
// // // //     db.ROLES.push(role);
// // // //     return ok(role, "Role created");
// // // //   });
// // // // }

// // // // export async function updateRolePermissions(id: string, permissions: Permission[]) {
// // // //   return simulate(() => {
// // // //     const role = db.ROLES.find((r) => r.id === id);
// // // //     if (!role) throw new ApiRequestError("Role not found.", "ROLE_NOT_FOUND");
// // // //     if (role.isSystem) throw new ApiRequestError("The Super Admin role cannot be edited.", "SYSTEM_ROLE_LOCKED");
// // // //     role.permissions = permissions;
// // // //     return ok(role, "Role permissions updated");
// // // //   });
// // // // }

// // // // export async function listAdminUsers() {
// // // //   return simulate(() => ok([...db.ADMIN_USERS]));
// // // // }

// // // // export async function inviteAdminUser(input: { name: string; email: string; roleId: string }) {
// // // //   return simulate(() => {
// // // //     const email = input.email.trim().toLowerCase();
// // // //     if (!input.name.trim() || !email) throw new ApiRequestError("Name and email are required.", "INVALID_ADMIN_USER");
// // // //     if (db.ADMIN_USERS.some((u) => u.email.toLowerCase() === email)) {
// // // //       throw new ApiRequestError("An admin with this email already exists.", "DUPLICATE_ADMIN_USER");
// // // //     }
// // // //     const user: AdminUser = { id: `au_${Date.now()}`, name: input.name, email, roleId: input.roleId, status: "active", createdAt: new Date().toISOString() };
// // // //     db.ADMIN_USERS.push(user);
// // // //     return ok(user, "Invite sent");
// // // //   });
// // // // }

// // // // export async function toggleAdminUserStatus(id: string) {
// // // //   return simulate(() => {
// // // //     const user = db.ADMIN_USERS.find((u) => u.id === id);
// // // //     if (!user) throw new ApiRequestError("Admin user not found.", "ADMIN_USER_NOT_FOUND");
// // // //     user.status = user.status === "active" ? "suspended" : "active";
// // // //     return ok(user, user.status === "suspended" ? "Admin suspended" : "Admin reactivated");
// // // //   });
// // // // }

// // // // export async function listAuditLog() {
// // // //   return simulate(() => ok([...db.AUDIT_LOG].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))));
// // // // }

// // // // export type { Product, Category, InventoryRow, Supplier, Purchase, Order, Return, Refund, Customer, Coupon, Banner, HomepageSection, Payment, AuditLogEntry, Role, AdminUser };


// // // // Real backend client for /api/v1/admin (+ /api/v1/auth for login/refresh),
// // // // matching PART 5 — API CONTRACT. Every function keeps the exact name and
// // // // signature the pages already call — only the implementation changed from
// // // // the in-memory mock to real HTTP calls, so no page/component needed edits.
// // // //
// // // // Assumptions made where the contract doc doesn't pin an exact shape are
// // // // called out inline with "ASSUMPTION:" — see also README → "Backend contract
// // // // assumptions" for the full list to confirm with whoever owns the backend.
// // // // Real backend client for /api/v1/admin (+ /api/v1/auth for login/refresh),
// // // // matching PART 5 — API CONTRACT. Every function keeps the exact name and
// // // // signature the pages already call — only the implementation changed from
// // // // the in-memory mock to real HTTP calls, so no page/component needed edits.
// // // //
// // // // Assumptions made where the contract doc doesn't pin an exact shape are
// // // // called out inline with "ASSUMPTION:" — see also README → "Backend contract
// // // // assumptions" for the full list to confirm with whoever owns the backend.

// // // import { ApiRequestError, authHttp, http, setAccessToken } from "./http";
// // // import { canTransition, ORDER_TRANSITIONS, REFUND_TRANSITIONS, RETURN_TRANSITIONS } from "./state-machines";
// // // import {
// // //   AdminUser, Banner, Category, Coupon, Customer, HomepageSection, InventoryRow,
// // //   InventoryTransaction, Order, OrderStatus, Payment, Product, Purchase, Refund,
// // //   RefundStatus, Return, ReturnStatus, Role, Supplier, Permission,
// // // } from "./types";

// // // export { ApiRequestError };

// // // // ---------------------------------------------------------------------------
// // // // Auth
// // // // ---------------------------------------------------------------------------

// // // export interface Session {
// // //   token: string;
// // //   user: AdminUser;
// // //   role: Role;
// // // }

// // // // ASSUMPTION: POST /admin/auth/login (NOT /auth/login — that's the customer OTP
// // // // flow) returns { accessToken, admin, role }. The refresh token itself is
// // // // expected to arrive as an httpOnly cookie (per the architecture doc), so it's
// // // // never read here — only accessToken is kept, in memory.
// // // interface LoginResponseData {
// // //   accessToken: string;
// // //   admin: AdminUser;
// // //   role: Role;
// // // }

// // // export async function login(email: string, password: string): Promise<{ data: Session }> {
// // //   const res = await authHttp.post<LoginResponseData>("/login", { email, password });
// // //   setAccessToken(res.data.accessToken);
// // //   return { data: { token: res.data.accessToken, user: res.data.admin, role: res.data.role } };
// // // }

// // // // ASSUMPTION: POST /admin/auth/refresh reads the httpOnly refresh cookie and returns a
// // // // fresh { accessToken, admin, role } — used both for silent session bootstrap on
// // // // page load and as the retry-after-401 handler wired into lib/http.ts.
// // // interface RefreshResponseData {
// // //   accessToken: string;
// // //   admin: AdminUser;
// // //   role: Role;
// // // }

// // // export async function refreshSession(): Promise<Session | null> {
// // //   try {
// // //     const res = await authHttp.post<RefreshResponseData>("/refresh");
// // //     setAccessToken(res.data.accessToken);
// // //     return { token: res.data.accessToken, user: res.data.admin, role: res.data.role };
// // //   } catch {
// // //     setAccessToken(null);
// // //     return null;
// // //   }
// // // }

// // // export async function logout(): Promise<void> {
// // //   try {
// // //     await authHttp.post("/logout");
// // //   } finally {
// // //     setAccessToken(null);
// // //   }
// // // }

// // // // ---------------------------------------------------------------------------
// // // // Dashboard
// // // // ---------------------------------------------------------------------------

// // // export async function getDashboard() {
// // //   return http.get<{
// // //     stats: { revenue30d: number; orders30d: number; customers: number; openOrders: number; lowStock: number; pendingReturns: number };
// // //     trend: { label: string; revenue: number; orders: number }[];
// // //     recentOrders: Order[];
// // //     lowStockRows: InventoryRow[];
// // //   }>("/dashboard");
// // // }

// // // // ---------------------------------------------------------------------------
// // // // Products & categories
// // // // ---------------------------------------------------------------------------

// // // export async function listProducts(params: { page?: number; limit?: number; q?: string; status?: string; categoryId?: string } = {}) {
// // //   return http.get<Product[]>("/products", params);
// // // }

// // // export async function getProduct(id: string) {
// // //   return http.get<Product>(`/products/${id}`);
// // // }

// // // export async function createProduct(input: {
// // //   name: string; sku: string; categoryId: string; basePrice: number; mrp: number; status: Product["status"];
// // // }) {
// // //   return http.post<Product>("/products", input);
// // // }

// // // export async function updateProduct(id: string, patch: Partial<Pick<Product, "name" | "categoryId" | "basePrice" | "mrp" | "status">>) {
// // //   return http.patch<Product>(`/products/${id}`, patch);
// // // }

// // // export async function updateProductStatus(id: string, status: Product["status"]) {
// // //   return http.patch<Product>(`/products/${id}`, { status });
// // // }

// // // // ASSUMPTION: no dedicated toggle endpoint for isFeatured — read current value,
// // // // flip it, PATCH. Swap for POST /products/:id/toggle-featured if the backend adds one.
// // // export async function toggleFeatured(id: string) {
// // //   const current = await getProduct(id);
// // //   return http.patch<Product>(`/products/${id}`, { isFeatured: !current.data.isFeatured });
// // // }

// // // export async function deleteProduct(id: string) {
// // //   return http.delete<{ id: string }>(`/products/${id}`);
// // // }

// // // export async function listCategories() {
// // //   return http.get<Category[]>("/categories");
// // // }

// // // export async function createCategory(input: { name: string; parentId?: string | null }) {
// // //   return http.post<Category>("/categories", input);
// // // }

// // // export async function updateCategory(id: string, patch: Partial<Pick<Category, "name" | "isActive" | "parentId">>) {
// // //   return http.patch<Category>(`/categories/${id}`, patch);
// // // }

// // // export async function deleteCategory(id: string) {
// // //   return http.delete<{ id: string }>(`/categories/${id}`);
// // // }

// // // // ---------------------------------------------------------------------------
// // // // Inventory
// // // // ---------------------------------------------------------------------------

// // // export async function listInventory(params: { page?: number; limit?: number; lowStockOnly?: boolean } = {}) {
// // //   return http.get<InventoryRow[]>("/inventory", params);
// // // }

// // // export async function listInventoryTransactions(sku?: string) {
// // //   return http.get<InventoryTransaction[]>("/inventory/adjustments", { sku });
// // // }

// // // export async function adjustInventory(sku: string, delta: number, reason: string) {
// // //   return http.post<InventoryRow>("/inventory/adjustments", { sku, delta, reason });
// // // }

// // // // ---------------------------------------------------------------------------
// // // // Suppliers & purchases
// // // // ---------------------------------------------------------------------------

// // // export async function listSuppliers() {
// // //   return http.get<Supplier[]>("/suppliers");
// // // }

// // // export async function createSupplier(input: { name: string; contact: string; address: string }) {
// // //   return http.post<Supplier>("/suppliers", input);
// // // }

// // // export async function listPurchases() {
// // //   return http.get<Purchase[]>("/purchases");
// // // }

// // // export async function createPurchase(input: { supplierId: string; items: { sku: string; orderedQty: number; cost: number }[] }) {
// // //   return http.post<Purchase>("/purchases", input);
// // // }

// // // // ASSUMPTION: POST /purchases/:id/receive marks the PO received and bumps inventory
// // // // server-side. If the backend instead expects PATCH { status: "Received" }, change here only.
// // // export async function receivePurchase(id: string) {
// // //   return http.post<Purchase>(`/purchases/${id}/receive`);
// // // }

// // // // ---------------------------------------------------------------------------
// // // // Orders, payments & sales
// // // // ---------------------------------------------------------------------------

// // // export async function listOrders(params: { page?: number; limit?: number; status?: OrderStatus; q?: string } = {}) {
// // //   return http.get<Order[]>("/orders", params);
// // // }

// // // export async function getOrder(id: string) {
// // //   return http.get<Order>(`/orders/${id}`);
// // // }

// // // // The state machine still runs client-side first so illegal buttons are disabled
// // // // before a round-trip — the backend is the source of truth and re-validates too.
// // // export async function transitionOrder(id: string, to: OrderStatus) {
// // //   const current = await getOrder(id);
// // //   if (!canTransition(ORDER_TRANSITIONS, current.data.status, to)) {
// // //     throw new ApiRequestError(`Cannot move an order from ${current.data.status} to ${to}.`, "ILLEGAL_TRANSITION");
// // //   }
// // //   return http.patch<Order>(`/orders/${id}`, { status: to });
// // // }

// // // export async function listPayments(params: { q?: string; status?: string } = {}) {
// // //   return http.get<Payment[]>("/payments", params);
// // // }

// // // export async function getSalesReport() {
// // //   return http.get<{
// // //     trend: { label: string; revenue: number; orders: number }[];
// // //     byCategory: { category: string; revenue: number }[];
// // //     topProducts: { name: string; sku: string; unitsSold: number; revenue: number }[];
// // //     totalRevenue: number;
// // //     avgOrderValue: number;
// // //     orderCount: number;
// // //   }>("/sales");
// // // }

// // // // ---------------------------------------------------------------------------
// // // // Returns & refunds
// // // // ---------------------------------------------------------------------------

// // // export async function listReturns() {
// // //   return http.get<Return[]>("/returns");
// // // }

// // // export async function transitionReturn(id: string, to: ReturnStatus) {
// // //   const current = await http.get<Return>(`/returns/${id}`);
// // //   if (!canTransition(RETURN_TRANSITIONS, current.data.status, to)) {
// // //     throw new ApiRequestError(`Cannot move a return from ${current.data.status} to ${to}.`, "ILLEGAL_TRANSITION");
// // //   }
// // //   return http.patch<Return>(`/returns/${id}`, { status: to });
// // // }

// // // export async function listRefunds() {
// // //   return http.get<Refund[]>("/refunds");
// // // }

// // // export async function transitionRefund(id: string, to: RefundStatus) {
// // //   const current = await http.get<Refund>(`/refunds/${id}`);
// // //   if (!canTransition(REFUND_TRANSITIONS, current.data.status, to)) {
// // //     throw new ApiRequestError(`Cannot move a refund from ${current.data.status} to ${to}.`, "ILLEGAL_TRANSITION");
// // //   }
// // //   return http.patch<Refund>(`/refunds/${id}`, { status: to });
// // // }

// // // // ---------------------------------------------------------------------------
// // // // Customers & coupons
// // // // ---------------------------------------------------------------------------

// // // export async function listCustomers(params: { page?: number; limit?: number; q?: string } = {}) {
// // //   return http.get<Customer[]>("/customers", params);
// // // }

// // // // ASSUMPTION: GET /customers/:id returns { customer, orders } (order history embedded).
// // // export async function getCustomer(id: string) {
// // //   return http.get<{ customer: Customer; orders: Order[] }>(`/customers/${id}`);
// // // }

// // // export async function listCoupons() {
// // //   return http.get<Coupon[]>("/coupons");
// // // }

// // // export async function createCoupon(input: { code: string; type: Coupon["type"]; value: number; minCartValue: number; expiry: string; usageLimit: number }) {
// // //   return http.post<Coupon>("/coupons", input);
// // // }

// // // export async function updateCoupon(id: string, patch: Partial<Pick<Coupon, "value" | "minCartValue" | "expiry" | "usageLimit">>) {
// // //   return http.patch<Coupon>(`/coupons/${id}`, patch);
// // // }

// // // export async function deleteCoupon(id: string) {
// // //   return http.delete<{ id: string }>(`/coupons/${id}`);
// // // }

// // // // ASSUMPTION: no dedicated toggle endpoint — read then flip isActive via PATCH.
// // // export async function toggleCoupon(id: string) {
// // //   const current = await http.get<Coupon>(`/coupons/${id}`);
// // //   return http.patch<Coupon>(`/coupons/${id}`, { isActive: !current.data.isActive });
// // // }

// // // // ---------------------------------------------------------------------------
// // // // Content
// // // // ---------------------------------------------------------------------------

// // // export async function listBanners() {
// // //   return http.get<Banner[]>("/content/banners");
// // // }

// // // export async function createBanner(input: { title: string; ctaText: string; ctaUrl: string }) {
// // //   return http.post<Banner>("/content/banners", input);
// // // }

// // // export async function toggleBanner(id: string) {
// // //   const current = await http.get<Banner>(`/content/banners/${id}`);
// // //   return http.patch<Banner>(`/content/banners/${id}`, { isActive: !current.data.isActive });
// // // }

// // // export async function listHomepageSections() {
// // //   return http.get<HomepageSection[]>("/content/homepage");
// // // }

// // // export async function toggleHomepageSection(id: string) {
// // //   const current = await http.get<HomepageSection>(`/content/homepage/${id}`);
// // //   return http.patch<HomepageSection>(`/content/homepage/${id}`, { isActive: !current.data.isActive });
// // // }

// // // // ---------------------------------------------------------------------------
// // // // RBAC & audit
// // // // ---------------------------------------------------------------------------

// // // export async function listRoles() {
// // //   return http.get<Role[]>("/roles");
// // // }

// // // export async function createRole(input: { name: string; description: string; permissions: Permission[] }) {
// // //   return http.post<Role>("/roles", input);
// // // }

// // // export async function updateRolePermissions(id: string, permissions: Permission[]) {
// // //   return http.patch<Role>(`/roles/${id}`, { permissions });
// // // }

// // // export async function listAdminUsers() {
// // //   return http.get<AdminUser[]>("/users");
// // // }

// // // export async function inviteAdminUser(input: { name: string; email: string; roleId: string }) {
// // //   return http.post<AdminUser>("/users", input);
// // // }

// // // // ASSUMPTION: no dedicated toggle endpoint — read then flip status via PATCH.
// // // export async function toggleAdminUserStatus(id: string) {
// // //   const current = await http.get<AdminUser>(`/users/${id}`);
// // //   const status = current.data.status === "active" ? "suspended" : "active";
// // //   return http.patch<AdminUser>(`/users/${id}`, { status });
// // // }

// // // // ASSUMPTION: GET /admin/audit-log — not spelled out in the contract table but
// // // // implied by Epic 5's "Audit log viewer" requirement.
// // // export async function listAuditLog() {
// // //   return http.get<{ id: string; actor: string; action: string; entity: string; entityId: string; createdAt: string }[]>("/audit-log");
// // // }

// // // // ---------------------------------------------------------------------------
// // // // Static reference data (no backend round-trip needed)
// // // // ---------------------------------------------------------------------------

// // // const ALL_PERMISSIONS: Permission[] = [
// // //   "dashboard.view",
// // //   "products.view", "products.write", "categories.view", "categories.write",
// // //   "inventory.view", "inventory.write", "purchases.view", "purchases.write",
// // //   "orders.view", "orders.write", "sales.view", "payments.view",
// // //   "returns.view", "returns.write", "refunds.view", "refunds.write",
// // //   "customers.view", "coupons.view", "coupons.write", "content.view", "content.write",
// // //   "admin_users.view", "admin_users.write", "roles.view", "roles.write", "audit.view",
// // // ];

// // // export function allPermissions() {
// // //   return ALL_PERMISSIONS;
// // // }

// // // export type { Product, Category, InventoryRow, Supplier, Purchase, Order, Return, Refund, Customer, Coupon, Banner, HomepageSection, Payment, Role, AdminUser };

// // // Real backend client for /api/v1/admin (+ its nested /admin/auth for
// // // login/logout), matching PART 5 — API CONTRACT. Every function keeps the
// // // exact name and signature the pages already call — only the implementation
// // // changed from the in-memory mock to real HTTP calls, so no page/component
// // // needed edits.
// // //
// // // Assumptions made where the contract doc doesn't pin an exact shape are
// // // called out inline with "ASSUMPTION:" — see also README → "Backend contract
// // // assumptions" for the full list to confirm with whoever owns the backend.

// // import { ApiRequestError, authHttp, http, setAccessToken } from "./http";
// // import { canTransition, ORDER_TRANSITIONS, REFUND_TRANSITIONS, RETURN_TRANSITIONS } from "./state-machines";
// // import {
// //   AdminUser, Banner, Category, Coupon, Customer, HomepageSection, InventoryRow,
// //   InventoryTransaction, Order, OrderStatus, Payment, Product, Purchase, Refund,
// //   RefundStatus, Return, ReturnStatus, Role, Supplier, Permission,
// // } from "./types";

// // export { ApiRequestError };

// // // ---------------------------------------------------------------------------
// // // Auth
// // // ---------------------------------------------------------------------------

// // export interface Session {
// //   token: string;
// //   user: AdminUser;
// //   role: Role;
// // }

// // // ASSUMPTION: POST /admin/auth/login (NOT /auth/login — that's the customer OTP
// // // flow) returns { accessToken, admin, role }. Per the architecture doc, admin
// // // auth is documented only as "password + optional 2FA later" — no refresh
// // // token is called out the way it is for the customer flow — so there is no
// // // POST /admin/auth/refresh. The access token is persisted client-side (see
// // // lib/http.ts) and used until it expires or the backend returns a 401, at
// // // which point the session is cleared and the person logs in again.
// // interface LoginResponseData {
// //   accessToken: string;
// //   admin: AdminUser;
// //   role: Role;
// // }

// // export async function login(email: string, password: string): Promise<{ data: Session }> {
// //   const res = await authHttp.post<LoginResponseData>("/login", { email, password });
// //   setAccessToken(res.data.accessToken);
// //   return { data: { token: res.data.accessToken, user: res.data.admin, role: res.data.role } };
// // }

// // // ASSUMPTION: POST /admin/auth/logout exists for the backend to record/audit the
// // // event; since the JWT itself isn't revocable without a session store, this is
// // // best-effort — the client clears its token regardless of whether the call succeeds.
// // export async function logout(): Promise<void> {
// //   try {
// //     await authHttp.post("/logout");
// //   } finally {
// //     setAccessToken(null);
// //   }
// // }

// // // ---------------------------------------------------------------------------
// // // Dashboard
// // // ---------------------------------------------------------------------------

// // export async function getDashboard() {
// //   return http.get<{
// //     stats: { revenue30d: number; orders30d: number; customers: number; openOrders: number; lowStock: number; pendingReturns: number };
// //     trend: { label: string; revenue: number; orders: number }[];
// //     recentOrders: Order[];
// //     lowStockRows: InventoryRow[];
// //   }>("/dashboard");
// // }

// // // ---------------------------------------------------------------------------
// // // Products & categories
// // // ---------------------------------------------------------------------------

// // export async function listProducts(params: { page?: number; limit?: number; q?: string; status?: string; categoryId?: string } = {}) {
// //   return http.get<Product[]>("/products", params);
// // }

// // export async function getProduct(id: string) {
// //   return http.get<Product>(`/products/${id}`);
// // }

// // export async function createProduct(input: {
// //   name: string; sku: string; categoryId: string; basePrice: number; mrp: number; status: Product["status"];
// // }) {
// //   return http.post<Product>("/products", input);
// // }

// // export async function updateProduct(id: string, patch: Partial<Pick<Product, "name" | "categoryId" | "basePrice" | "mrp" | "status">>) {
// //   return http.patch<Product>(`/products/${id}`, patch);
// // }

// // export async function updateProductStatus(id: string, status: Product["status"]) {
// //   return http.patch<Product>(`/products/${id}`, { status });
// // }

// // // ASSUMPTION: no dedicated toggle endpoint for isFeatured — read current value,
// // // flip it, PATCH. Swap for POST /products/:id/toggle-featured if the backend adds one.
// // export async function toggleFeatured(id: string) {
// //   const current = await getProduct(id);
// //   return http.patch<Product>(`/products/${id}`, { isFeatured: !current.data.isFeatured });
// // }

// // export async function deleteProduct(id: string) {
// //   return http.delete<{ id: string }>(`/products/${id}`);
// // }

// // export async function listCategories() {
// //   return http.get<Category[]>("/categories");
// // }

// // export async function createCategory(input: { name: string; parentId?: string | null }) {
// //   return http.post<Category>("/categories", input);
// // }

// // export async function updateCategory(id: string, patch: Partial<Pick<Category, "name" | "isActive" | "parentId">>) {
// //   return http.patch<Category>(`/categories/${id}`, patch);
// // }

// // export async function deleteCategory(id: string) {
// //   return http.delete<{ id: string }>(`/categories/${id}`);
// // }

// // // ---------------------------------------------------------------------------
// // // Inventory
// // // ---------------------------------------------------------------------------

// // export async function listInventory(params: { page?: number; limit?: number; lowStockOnly?: boolean } = {}) {
// //   return http.get<InventoryRow[]>("/inventory", params);
// // }

// // export async function listInventoryTransactions(sku?: string) {
// //   return http.get<InventoryTransaction[]>("/inventory/adjustments", { sku });
// // }

// // export async function adjustInventory(sku: string, delta: number, reason: string) {
// //   return http.post<InventoryRow>("/inventory/adjustments", { sku, delta, reason });
// // }

// // // ---------------------------------------------------------------------------
// // // Suppliers & purchases
// // // ---------------------------------------------------------------------------

// // export async function listSuppliers() {
// //   return http.get<Supplier[]>("/suppliers");
// // }

// // export async function createSupplier(input: { name: string; contact: string; address: string }) {
// //   return http.post<Supplier>("/suppliers", input);
// // }

// // export async function listPurchases() {
// //   return http.get<Purchase[]>("/purchases");
// // }

// // export async function createPurchase(input: { supplierId: string; items: { sku: string; orderedQty: number; cost: number }[] }) {
// //   return http.post<Purchase>("/purchases", input);
// // }

// // // ASSUMPTION: POST /purchases/:id/receive marks the PO received and bumps inventory
// // // server-side. If the backend instead expects PATCH { status: "Received" }, change here only.
// // export async function receivePurchase(id: string) {
// //   return http.post<Purchase>(`/purchases/${id}/receive`);
// // }

// // // ---------------------------------------------------------------------------
// // // Orders, payments & sales
// // // ---------------------------------------------------------------------------

// // export async function listOrders(params: { page?: number; limit?: number; status?: OrderStatus; q?: string } = {}) {
// //   return http.get<Order[]>("/orders", params);
// // }

// // export async function getOrder(id: string) {
// //   return http.get<Order>(`/orders/${id}`);
// // }

// // // The state machine still runs client-side first so illegal buttons are disabled
// // // before a round-trip — the backend is the source of truth and re-validates too.
// // export async function transitionOrder(id: string, to: OrderStatus) {
// //   const current = await getOrder(id);
// //   if (!canTransition(ORDER_TRANSITIONS, current.data.status, to)) {
// //     throw new ApiRequestError(`Cannot move an order from ${current.data.status} to ${to}.`, "ILLEGAL_TRANSITION");
// //   }
// //   return http.patch<Order>(`/orders/${id}`, { status: to });
// // }

// // export async function listPayments(params: { q?: string; status?: string } = {}) {
// //   return http.get<Payment[]>("/payments", params);
// // }

// // export async function getSalesReport() {
// //   return http.get<{
// //     trend: { label: string; revenue: number; orders: number }[];
// //     byCategory: { category: string; revenue: number }[];
// //     topProducts: { name: string; sku: string; unitsSold: number; revenue: number }[];
// //     totalRevenue: number;
// //     avgOrderValue: number;
// //     orderCount: number;
// //   }>("/sales");
// // }

// // // ---------------------------------------------------------------------------
// // // Returns & refunds
// // // ---------------------------------------------------------------------------

// // export async function listReturns() {
// //   return http.get<Return[]>("/returns");
// // }

// // export async function transitionReturn(id: string, to: ReturnStatus) {
// //   const current = await http.get<Return>(`/returns/${id}`);
// //   if (!canTransition(RETURN_TRANSITIONS, current.data.status, to)) {
// //     throw new ApiRequestError(`Cannot move a return from ${current.data.status} to ${to}.`, "ILLEGAL_TRANSITION");
// //   }
// //   return http.patch<Return>(`/returns/${id}`, { status: to });
// // }

// // export async function listRefunds() {
// //   return http.get<Refund[]>("/refunds");
// // }

// // export async function transitionRefund(id: string, to: RefundStatus) {
// //   const current = await http.get<Refund>(`/refunds/${id}`);
// //   if (!canTransition(REFUND_TRANSITIONS, current.data.status, to)) {
// //     throw new ApiRequestError(`Cannot move a refund from ${current.data.status} to ${to}.`, "ILLEGAL_TRANSITION");
// //   }
// //   return http.patch<Refund>(`/refunds/${id}`, { status: to });
// // }

// // // ---------------------------------------------------------------------------
// // // Customers & coupons
// // // ---------------------------------------------------------------------------

// // export async function listCustomers(params: { page?: number; limit?: number; q?: string } = {}) {
// //   return http.get<Customer[]>("/customers", params);
// // }

// // // ASSUMPTION: GET /customers/:id returns { customer, orders } (order history embedded).
// // export async function getCustomer(id: string) {
// //   return http.get<{ customer: Customer; orders: Order[] }>(`/customers/${id}`);
// // }

// // export async function listCoupons() {
// //   return http.get<Coupon[]>("/coupons");
// // }

// // export async function createCoupon(input: { code: string; type: Coupon["type"]; value: number; minCartValue: number; expiry: string; usageLimit: number }) {
// //   return http.post<Coupon>("/coupons", input);
// // }

// // export async function updateCoupon(id: string, patch: Partial<Pick<Coupon, "value" | "minCartValue" | "expiry" | "usageLimit">>) {
// //   return http.patch<Coupon>(`/coupons/${id}`, patch);
// // }

// // export async function deleteCoupon(id: string) {
// //   return http.delete<{ id: string }>(`/coupons/${id}`);
// // }

// // // ASSUMPTION: no dedicated toggle endpoint — read then flip isActive via PATCH.
// // export async function toggleCoupon(id: string) {
// //   const current = await http.get<Coupon>(`/coupons/${id}`);
// //   return http.patch<Coupon>(`/coupons/${id}`, { isActive: !current.data.isActive });
// // }

// // // ---------------------------------------------------------------------------
// // // Content
// // // ---------------------------------------------------------------------------

// // export async function listBanners() {
// //   return http.get<Banner[]>("/content/banners");
// // }

// // export async function createBanner(input: { title: string; ctaText: string; ctaUrl: string }) {
// //   return http.post<Banner>("/content/banners", input);
// // }

// // export async function toggleBanner(id: string) {
// //   const current = await http.get<Banner>(`/content/banners/${id}`);
// //   return http.patch<Banner>(`/content/banners/${id}`, { isActive: !current.data.isActive });
// // }

// // export async function listHomepageSections() {
// //   return http.get<HomepageSection[]>("/content/homepage");
// // }

// // export async function toggleHomepageSection(id: string) {
// //   const current = await http.get<HomepageSection>(`/content/homepage/${id}`);
// //   return http.patch<HomepageSection>(`/content/homepage/${id}`, { isActive: !current.data.isActive });
// // }

// // // ---------------------------------------------------------------------------
// // // RBAC & audit
// // // ---------------------------------------------------------------------------

// // export async function listRoles() {
// //   return http.get<Role[]>("/roles");
// // }

// // export async function createRole(input: { name: string; description: string; permissions: Permission[] }) {
// //   return http.post<Role>("/roles", input);
// // }

// // export async function updateRolePermissions(id: string, permissions: Permission[]) {
// //   return http.patch<Role>(`/roles/${id}`, { permissions });
// // }

// // export async function listAdminUsers() {
// //   return http.get<AdminUser[]>("/users");
// // }

// // export async function inviteAdminUser(input: { name: string; email: string; roleId: string }) {
// //   return http.post<AdminUser>("/users", input);
// // }

// // // ASSUMPTION: no dedicated toggle endpoint — read then flip status via PATCH.
// // export async function toggleAdminUserStatus(id: string) {
// //   const current = await http.get<AdminUser>(`/users/${id}`);
// //   const status = current.data.status === "active" ? "suspended" : "active";
// //   return http.patch<AdminUser>(`/users/${id}`, { status });
// // }

// // // ASSUMPTION: GET /admin/audit-log — not spelled out in the contract table but
// // // implied by Epic 5's "Audit log viewer" requirement.
// // export async function listAuditLog() {
// //   return http.get<{ id: string; actor: string; action: string; entity: string; entityId: string; createdAt: string }[]>("/audit-log");
// // }

// // // ---------------------------------------------------------------------------
// // // Static reference data (no backend round-trip needed)
// // // ---------------------------------------------------------------------------

// // const ALL_PERMISSIONS: Permission[] = [
// //   "dashboard.view",
// //   "products.view", "products.write", "categories.view", "categories.write",
// //   "inventory.view", "inventory.write", "purchases.view", "purchases.write",
// //   "orders.view", "orders.write", "sales.view", "payments.view",
// //   "returns.view", "returns.write", "refunds.view", "refunds.write",
// //   "customers.view", "coupons.view", "coupons.write", "content.view", "content.write",
// //   "admin_users.view", "admin_users.write", "roles.view", "roles.write", "audit.view",
// // ];

// // export function allPermissions() {
// //   return ALL_PERMISSIONS;
// // }

// // export type { Product, Category, InventoryRow, Supplier, Purchase, Order, Return, Refund, Customer, Coupon, Banner, HomepageSection, Payment, Role, AdminUser };

// // Real backend client for /api/v1/admin (+ its nested /admin/auth for
// // login/logout), matching PART 5 — API CONTRACT. Every function keeps the
// // exact name and signature the pages already call — only the implementation
// // changed from the in-memory mock to real HTTP calls, so no page/component
// // needed edits.
// //
// // Assumptions made where the contract doc doesn't pin an exact shape are
// // called out inline with "ASSUMPTION:" — see also README → "Backend contract
// // assumptions" for the full list to confirm with whoever owns the backend.

// import { ApiRequestError, authHttp, http, setAccessToken } from "./http";
// import { canTransition, ORDER_TRANSITIONS, REFUND_TRANSITIONS, RETURN_TRANSITIONS } from "./state-machines";
// import {
//   AdminUser, Banner, Category, Coupon, Customer, HomepageSection, InventoryRow,
//   InventoryTransaction, Order, OrderStatus, Payment, Product, Purchase, Refund,
//   RefundStatus, Return, ReturnStatus, Role, Supplier, Permission,
// } from "./types";

// export { ApiRequestError };

// // ---------------------------------------------------------------------------
// // Auth
// // ---------------------------------------------------------------------------

// export interface Session {
//   token: string;
//   user: AdminUser;
//   role: Role;
// }

// // ASSUMPTION: POST /admin/auth/login (NOT /auth/login — that's the customer OTP
// // flow) returns { accessToken, admin, role }. Per the architecture doc, admin
// // auth is documented only as "password + optional 2FA later" — no refresh
// // token is called out the way it is for the customer flow — so there is no
// // POST /admin/auth/refresh. The access token is persisted client-side (see
// // lib/http.ts) and used until it expires or the backend returns a 401, at
// // which point the session is cleared and the person logs in again.
// //
// // Backends commonly use a different key for the token (token, access_token,
// // jwt, accessToken, or nested under tokens.access) — rather than silently
// // sending no Authorization header on every request afterwards (which shows up
// // downstream as a confusing "Missing access token" error from the backend),
// // this checks the common variants and fails loudly at login time if none match.
// type LoginResponseData = Record<string, unknown>;

// function pick<T = unknown>(obj: Record<string, unknown> | undefined, keys: string[]): T | undefined {
//   if (!obj) return undefined;
//   for (const key of keys) {
//     if (obj[key] !== undefined && obj[key] !== null) return obj[key] as T;
//   }
//   return undefined;
// }

// export async function login(email: string, password: string): Promise<{ data: Session }> {
//   const res = await authHttp.post<LoginResponseData>("/login", { email, password });
//   const data = res.data;

//   console.log("[login] Response data:", data);

//   const token = pick<string>(data, ["accessToken", "access_token", "token", "jwt", "authToken"])
//     ?? pick<string>(pick(data, ["tokens", "token"]) as Record<string, unknown> | undefined, ["accessToken", "access_token", "access"]);
  
//   console.log("[login] Picked token:", token);

//   if (!token) {
//     console.log("[login] Token not found. Data keys:", Object.keys(data));
//     throw new ApiRequestError(
//       `Login succeeded but no access token was found in the response (keys received: ${Object.keys(data).join(", ") || "none"}). ` +
//         `Check /admin/auth/login's response shape against src/lib/api.ts's login().`,
//       "MISSING_ACCESS_TOKEN"
//     );
//   }

//   const admin = pick<AdminUser>(data, ["admin", "user"]);
//   console.log("[login] Picked admin:", admin);

//   if (!admin) {
//     console.log("[login] Admin user not found. Data keys:", Object.keys(data));
//     throw new ApiRequestError(
//       `Login succeeded but no admin user object was found in the response (keys received: ${Object.keys(data).join(", ") || "none"}).`,
//       "MISSING_ADMIN_USER"
//     );
//   }

//   // Role may come back as its own top-level field, or embedded on the admin object.
//   const role = pick<Role>(data, ["role"]) ?? pick<Role>(admin as unknown as Record<string, unknown>, ["role"]);
//   console.log("[login] Picked role:", role);

//   // if (!role) {
//   //   console.log("[login] Role not found. Admin:", admin, "Data keys:", Object.keys(data));
//   //   throw new ApiRequestError(
//   //     `Login succeeded but no role/permissions object was found in the response for ${admin.email ?? "this admin"}.`,
//   //     "MISSING_ROLE"
//   //   );
//   // }

//   setAccessToken(token);
//   if (!role) {
//     console.log("[login] Role not found. Admin:", admin, "Data keys:", Object.keys(data));
//     throw new ApiRequestError(
//       `Login succeeded but no role/permissions object was found in the response for ${admin.email ?? "this admin"}.`,
//       "MISSING_ROLE"
//     );
//   }
//   return { data: { token, user: admin, role } };
// }

// // ASSUMPTION: POST /admin/auth/logout exists for the backend to record/audit the
// // event; since the JWT itself isn't revocable without a session store, this is
// // best-effort — the client clears its token regardless of whether the call succeeds.
// export async function logout(): Promise<void> {
//   try {
//     await authHttp.post("/logout");
//   } finally {
//     setAccessToken(null);
//   }
// }

// // ---------------------------------------------------------------------------
// // Dashboard
// // ---------------------------------------------------------------------------

// export async function getDashboard() {
//   return http.get<{
//     stats: { revenue30d: number; orders30d: number; customers: number; openOrders: number; lowStock: number; pendingReturns: number };
//     trend: { label: string; revenue: number; orders: number }[];
//     recentOrders: Order[];
//     lowStockRows: InventoryRow[];
//   }>("/dashboard");
// }

// // ---------------------------------------------------------------------------
// // Products & categories
// // ---------------------------------------------------------------------------

// export async function listProducts(params: { page?: number; limit?: number; q?: string; status?: string; categoryId?: string } = {}) {
//   return http.get<Product[]>("/products", params);
// }

// export async function getProduct(id: string) {
//   return http.get<Product>(`/products/${id}`);
// }

// export async function createProduct(input: {
//   name: string; sku: string; categoryId: string; basePrice: number; mrp: number; status: Product["status"];
// }) {
//   return http.post<Product>("/products", input);
// }

// export async function updateProduct(id: string, patch: Partial<Pick<Product, "name" | "categoryId" | "basePrice" | "mrp" | "status">>) {
//   return http.patch<Product>(`/products/${id}`, patch);
// }

// export async function updateProductStatus(id: string, status: Product["status"]) {
//   return http.patch<Product>(`/products/${id}`, { status });
// }

// // ASSUMPTION: no dedicated toggle endpoint for isFeatured — read current value,
// // flip it, PATCH. Swap for POST /products/:id/toggle-featured if the backend adds one.
// export async function toggleFeatured(id: string) {
//   const current = await getProduct(id);
//   return http.patch<Product>(`/products/${id}`, { isFeatured: !current.data.isFeatured });
// }

// export async function deleteProduct(id: string) {
//   return http.delete<{ id: string }>(`/products/${id}`);
// }

// export async function listCategories() {
//   return http.get<Category[]>("/categories");
// }

// export async function createCategory(input: { name: string; parentId?: string | null }) {
//   return http.post<Category>("/categories", input);
// }

// export async function updateCategory(id: string, patch: Partial<Pick<Category, "name" | "isActive" | "parentId">>) {
//   return http.patch<Category>(`/categories/${id}`, patch);
// }

// export async function deleteCategory(id: string) {
//   return http.delete<{ id: string }>(`/categories/${id}`);
// }

// // ---------------------------------------------------------------------------
// // Inventory
// // ---------------------------------------------------------------------------

// export async function listInventory(params: { page?: number; limit?: number; lowStockOnly?: boolean } = {}) {
//   return http.get<InventoryRow[]>("/inventory", params);
// }

// export async function listInventoryTransactions(sku?: string) {
//   return http.get<InventoryTransaction[]>("/inventory/adjustments", { sku });
// }

// export async function adjustInventory(sku: string, delta: number, reason: string) {
//   return http.post<InventoryRow>("/inventory/adjustments", { sku, delta, reason });
// }

// // ---------------------------------------------------------------------------
// // Suppliers & purchases
// // ---------------------------------------------------------------------------

// export async function listSuppliers() {
//   return http.get<Supplier[]>("/suppliers");
// }

// export async function createSupplier(input: { name: string; contact: string; address: string }) {
//   return http.post<Supplier>("/suppliers", input);
// }

// export async function listPurchases() {
//   return http.get<Purchase[]>("/purchases");
// }

// export async function createPurchase(input: { supplierId: string; items: { sku: string; orderedQty: number; cost: number }[] }) {
//   return http.post<Purchase>("/purchases", input);
// }

// // ASSUMPTION: POST /purchases/:id/receive marks the PO received and bumps inventory
// // server-side. If the backend instead expects PATCH { status: "Received" }, change here only.
// export async function receivePurchase(id: string) {
//   return http.post<Purchase>(`/purchases/${id}/receive`);
// }

// // ---------------------------------------------------------------------------
// // Orders, payments & sales
// // ---------------------------------------------------------------------------

// export async function listOrders(params: { page?: number; limit?: number; status?: OrderStatus; q?: string } = {}) {
//   return http.get<Order[]>("/orders", params);
// }

// export async function getOrder(id: string) {
//   return http.get<Order>(`/orders/${id}`);
// }

// // The state machine still runs client-side first so illegal buttons are disabled
// // before a round-trip — the backend is the source of truth and re-validates too.
// export async function transitionOrder(id: string, to: OrderStatus) {
//   const current = await getOrder(id);
//   if (!canTransition(ORDER_TRANSITIONS, current.data.status, to)) {
//     throw new ApiRequestError(`Cannot move an order from ${current.data.status} to ${to}.`, "ILLEGAL_TRANSITION");
//   }
//   return http.patch<Order>(`/orders/${id}`, { status: to });
// }

// export async function listPayments(params: { q?: string; status?: string } = {}) {
//   return http.get<Payment[]>("/payments", params);
// }

// export async function getSalesReport() {
//   return http.get<{
//     trend: { label: string; revenue: number; orders: number }[];
//     byCategory: { category: string; revenue: number }[];
//     topProducts: { name: string; sku: string; unitsSold: number; revenue: number }[];
//     totalRevenue: number;
//     avgOrderValue: number;
//     orderCount: number;
//   }>("/sales");
// }

// // ---------------------------------------------------------------------------
// // Returns & refunds
// // ---------------------------------------------------------------------------

// export async function listReturns() {
//   return http.get<Return[]>("/returns");
// }

// export async function transitionReturn(id: string, to: ReturnStatus) {
//   const current = await http.get<Return>(`/returns/${id}`);
//   if (!canTransition(RETURN_TRANSITIONS, current.data.status, to)) {
//     throw new ApiRequestError(`Cannot move a return from ${current.data.status} to ${to}.`, "ILLEGAL_TRANSITION");
//   }
//   return http.patch<Return>(`/returns/${id}`, { status: to });
// }

// export async function listRefunds() {
//   return http.get<Refund[]>("/refunds");
// }

// export async function transitionRefund(id: string, to: RefundStatus) {
//   const current = await http.get<Refund>(`/refunds/${id}`);
//   if (!canTransition(REFUND_TRANSITIONS, current.data.status, to)) {
//     throw new ApiRequestError(`Cannot move a refund from ${current.data.status} to ${to}.`, "ILLEGAL_TRANSITION");
//   }
//   return http.patch<Refund>(`/refunds/${id}`, { status: to });
// }

// // ---------------------------------------------------------------------------
// // Customers & coupons
// // ---------------------------------------------------------------------------

// export async function listCustomers(params: { page?: number; limit?: number; q?: string } = {}) {
//   return http.get<Customer[]>("/customers", params);
// }

// // ASSUMPTION: GET /customers/:id returns { customer, orders } (order history embedded).
// export async function getCustomer(id: string) {
//   return http.get<{ customer: Customer; orders: Order[] }>(`/customers/${id}`);
// }

// export async function listCoupons() {
//   return http.get<Coupon[]>("/coupons");
// }

// export async function createCoupon(input: { code: string; type: Coupon["type"]; value: number; minCartValue: number; expiry: string; usageLimit: number }) {
//   return http.post<Coupon>("/coupons", input);
// }

// export async function updateCoupon(id: string, patch: Partial<Pick<Coupon, "value" | "minCartValue" | "expiry" | "usageLimit">>) {
//   return http.patch<Coupon>(`/coupons/${id}`, patch);
// }

// export async function deleteCoupon(id: string) {
//   return http.delete<{ id: string }>(`/coupons/${id}`);
// }

// // ASSUMPTION: no dedicated toggle endpoint — read then flip isActive via PATCH.
// export async function toggleCoupon(id: string) {
//   const current = await http.get<Coupon>(`/coupons/${id}`);
//   return http.patch<Coupon>(`/coupons/${id}`, { isActive: !current.data.isActive });
// }

// // ---------------------------------------------------------------------------
// // Content
// // ---------------------------------------------------------------------------

// export async function listBanners() {
//   return http.get<Banner[]>("/content/banners");
// }

// export async function createBanner(input: { title: string; ctaText: string; ctaUrl: string }) {
//   return http.post<Banner>("/content/banners", input);
// }

// export async function toggleBanner(id: string) {
//   const current = await http.get<Banner>(`/content/banners/${id}`);
//   return http.patch<Banner>(`/content/banners/${id}`, { isActive: !current.data.isActive });
// }

// export async function listHomepageSections() {
//   return http.get<HomepageSection[]>("/content/homepage");
// }

// export async function toggleHomepageSection(id: string) {
//   const current = await http.get<HomepageSection>(`/content/homepage/${id}`);
//   return http.patch<HomepageSection>(`/content/homepage/${id}`, { isActive: !current.data.isActive });
// }

// // ---------------------------------------------------------------------------
// // RBAC & audit
// // ---------------------------------------------------------------------------

// export async function listRoles() {
//   return http.get<Role[]>("/roles");
// }

// export async function createRole(input: { name: string; description: string; permissions: Permission[] }) {
//   return http.post<Role>("/roles", input);
// }

// export async function updateRolePermissions(id: string, permissions: Permission[]) {
//   return http.patch<Role>(`/roles/${id}`, { permissions });
// }

// export async function listAdminUsers() {
//   return http.get<AdminUser[]>("/users");
// }

// export async function inviteAdminUser(input: { name: string; email: string; roleId: string }) {
//   return http.post<AdminUser>("/users", input);
// }

// // ASSUMPTION: no dedicated toggle endpoint — read then flip status via PATCH.
// export async function toggleAdminUserStatus(id: string) {
//   const current = await http.get<AdminUser>(`/users/${id}`);
//   const status = current.data.status === "active" ? "suspended" : "active";
//   return http.patch<AdminUser>(`/users/${id}`, { status });
// }

// // ASSUMPTION: GET /admin/audit-log — not spelled out in the contract table but
// // implied by Epic 5's "Audit log viewer" requirement.
// export async function listAuditLog() {
//   return http.get<{ id: string; actor: string; action: string; entity: string; entityId: string; createdAt: string }[]>("/audit-log");
// }

// // ---------------------------------------------------------------------------
// // Static reference data (no backend round-trip needed)
// // ---------------------------------------------------------------------------

// const ALL_PERMISSIONS: Permission[] = [
//   "dashboard.view",
//   "products.view", "products.write", "categories.view", "categories.write",
//   "inventory.view", "inventory.write", "purchases.view", "purchases.write",
//   "orders.view", "orders.write", "sales.view", "payments.view",
//   "returns.view", "returns.write", "refunds.view", "refunds.write",
//   "customers.view", "coupons.view", "coupons.write", "content.view", "content.write",
//   "admin_users.view", "admin_users.write", "roles.view", "roles.write", "audit.view",
// ];

// export function allPermissions() {
//   return ALL_PERMISSIONS;
// }

// export type { Product, Category, InventoryRow, Supplier, Purchase, Order, Return, Refund, Customer, Coupon, Banner, HomepageSection, Payment, Role, AdminUser };

// Real backend client for /api/v1/admin (+ its nested /admin/auth for
// login/logout), matching PART 5 — API CONTRACT. Every function keeps the
// exact name and signature the pages already call — only the implementation
// changed from the in-memory mock to real HTTP calls, so no page/component
// needed edits.
//
// Assumptions made where the contract doc doesn't pin an exact shape are
// called out inline with "ASSUMPTION:" — see also README → "Backend contract
// assumptions" for the full list to confirm with whoever owns the backend.

import { ApiRequestError, authHttp, http, setAccessToken } from "./http";
import { canTransition, ORDER_TRANSITIONS, REFUND_TRANSITIONS, RETURN_TRANSITIONS } from "./state-machines";
import {
  AdminUser, Banner, Category, Coupon, Customer, HomepageSection, InventoryRow,
  InventoryTransaction, Order, OrderStatus, Payment, Product, Purchase, Refund,
  RefundStatus, Return, ReturnStatus, Role, Supplier, Permission,
} from "./types";

export { ApiRequestError };

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface Session {
  token: string;
  user: AdminUser;
  role: Role;
}

// ASSUMPTION: POST /admin/auth/login (NOT /auth/login — that's the customer OTP
// flow) returns { accessToken, admin, role }. Per the architecture doc, admin
// auth is documented only as "password + optional 2FA later" — no refresh
// token is called out the way it is for the customer flow — so there is no
// POST /admin/auth/refresh. The access token is persisted client-side (see
// lib/http.ts) and used until it expires or the backend returns a 401, at
// which point the session is cleared and the person logs in again.
//
// CONFIRMED from the real adminLogin controller: the response only contains
// `{ admin: { id, name, email, roleId }, accessToken }` — no embedded role or
// permissions. So after login, the role is resolved separately by roleId
// against GET /admin/roles/:id (falling back to GET /admin/roles + find if
// there's no single-role route), using the token we just received.
type LoginResponseData = Record<string, unknown>;

function pick<T = unknown>(obj: Record<string, unknown> | undefined, keys: string[]): T | undefined {
  if (!obj) return undefined;
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key] as T;
  }
  return undefined;
}

function normalizeAdmin(raw: Record<string, unknown>, fallbackEmail: string): AdminUser {
  return {
    id: String(pick(raw, ["id", "_id"]) ?? ""),
    name: String(pick(raw, ["name"]) ?? ""),
    email: String(pick(raw, ["email"]) ?? fallbackEmail),
    roleId: String(pick(raw, ["roleId", "role_id", "role"]) ?? ""),
    status: (pick(raw, ["status"]) as AdminUser["status"]) ?? "active",
    createdAt: String(pick(raw, ["createdAt", "created_at"]) ?? new Date().toISOString()),
    lastLoginAt: pick<string>(raw, ["lastLoginAt", "last_login_at"]),
  };
}

function normalizeRole(raw: Record<string, unknown>): Role {
  return {
    id: String(pick(raw, ["id", "_id"]) ?? ""),
    name: String(pick(raw, ["name"]) ?? ""),
    description: String(pick(raw, ["description"]) ?? ""),
    permissions: (pick<Permission[]>(raw, ["permissions"]) ?? []),
    isSystem: pick<boolean>(raw, ["isSystem", "is_system"]),
  };
}

async function resolveRole(roleId: string): Promise<Role> {
  // Try a single-resource lookup first; not every backend implements one.
  try {
    const res = await http.get<Record<string, unknown>>(`/roles/${roleId}`);
    return normalizeRole(res.data);
  } catch {
    const res = await http.get<Record<string, unknown>[]>("/roles");
    const found = res.data.find((r) => String(pick(r, ["id", "_id"])) === roleId);
    if (!found) {
      throw new ApiRequestError(
        `No role found for roleId "${roleId}" (checked GET /admin/roles/:id and GET /admin/roles).`,
        "ROLE_NOT_FOUND"
      );
    }
    return normalizeRole(found);
  }
}

export async function login(email: string, password: string): Promise<{ data: Session }> {
  const res = await authHttp.post<LoginResponseData>("/login", { email, password });
  const data = res.data;

  const token = pick<string>(data, ["accessToken", "access_token", "token", "jwt", "authToken"])
    ?? pick<string>(pick(data, ["tokens"]) as Record<string, unknown> | undefined, ["accessToken", "access_token", "access"]);

  if (!token) {
    throw new ApiRequestError(
      `Login succeeded but no access token was found in the response (keys received: ${Object.keys(data).join(", ") || "none"}). ` +
        `Check /admin/auth/login's response shape against src/lib/api.ts's login().`,
      "MISSING_ACCESS_TOKEN"
    );
  }

  const adminRaw = pick<Record<string, unknown>>(data, ["admin", "user"]);
  if (!adminRaw) {
    throw new ApiRequestError(
      `Login succeeded but no admin user object was found in the response (keys received: ${Object.keys(data).join(", ") || "none"}).`,
      "MISSING_ADMIN_USER"
    );
  }

  const admin = normalizeAdmin(adminRaw, email);
  if (!admin.roleId) {
    throw new ApiRequestError(
      `Login succeeded but the admin object has no roleId to resolve permissions from.`,
      "MISSING_ROLE_ID"
    );
  }

  // Set the token now — resolving the role below hits an authenticated admin route.
  setAccessToken(token);
  let role: Role;
  try {
    role = await resolveRole(admin.roleId);
  } catch (e) {
    setAccessToken(null);
    throw e;
  }

  return { data: { token, user: admin, role } };
}

// ASSUMPTION: POST /admin/auth/logout exists for the backend to record/audit the
// event; since the JWT itself isn't revocable without a session store, this is
// best-effort — the client clears its token regardless of whether the call succeeds.
export async function logout(): Promise<void> {
  try {
    await authHttp.post("/logout");
  } finally {
    setAccessToken(null);
  }
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

// export async function getDashboard() {
//   return http.get<{
//     stats: { revenue30d: number; orders30d: number; customers: number; openOrders: number; lowStock: number; pendingReturns: number };
//     trend: { label: string; revenue: number; orders: number }[];
//     recentOrders: Order[];
//     lowStockRows: InventoryRow[];
//   }>("/dashboard");
// }
export async function getDashboard() {
  const [summaryRes, trendRes, lowStockRes] = await Promise.all([
    http.get<{
      range: { from: string; to: string };
      revenue: number;
      orderCount: number;
      averageOrderValue: number;
      newCustomers: number;
      lowStockCount: number;
      pendingReturns: number;
    }>("/dashboard/summary"),
    http.get<{ trend: { date: string; revenue: number; orders: number }[] }>("/dashboard/revenue-trend"),
    http.get<{ items: InventoryRow[] }>("/dashboard/low-stock", { limit: 5 }),
  ]);

  const summary = summaryRes.data;
  const trend = trendRes.data.trend;
  const lowStockRows = lowStockRes.data.items;

  return {
    ...summaryRes,
    data: {
      stats: {
        revenue30d: summary.revenue,
        orders30d: summary.orderCount,
        customers: summary.newCustomers,
        openOrders: 0, // no matching backend field — see note below
        lowStock: summary.lowStockCount,
        pendingReturns: summary.pendingReturns,
      },
      trend: trend.map((t) => ({ label: t.date, revenue: t.revenue, orders: t.orders })),
      recentOrders: [], // no matching backend field — see note below
      lowStockRows,
    },
  };
}

// ---------------------------------------------------------------------------
// Products & categories
// ---------------------------------------------------------------------------

export async function listProducts(params: { page?: number; limit?: number; q?: string; status?: string; categoryId?: string } = {}) {
  return http.get<Product[]>("/products", params);
}

export async function getProduct(id: string) {
  return http.get<Product>(`/products/${id}`);
}

export async function createProduct(input: {
  name: string; sku: string; categoryId: string; basePrice: number; mrp: number; status: Product["status"];
}) {
  return http.post<Product>("/products", input);
}

export async function updateProduct(id: string, patch: Partial<Pick<Product, "name" | "categoryId" | "basePrice" | "mrp" | "status">>) {
  return http.patch<Product>(`/products/${id}`, patch);
}

export async function updateProductStatus(id: string, status: Product["status"]) {
  return http.patch<Product>(`/products/${id}`, { status });
}

// ASSUMPTION: no dedicated toggle endpoint for isFeatured — read current value,
// flip it, PATCH. Swap for POST /products/:id/toggle-featured if the backend adds one.
export async function toggleFeatured(id: string) {
  const current = await getProduct(id);
  return http.patch<Product>(`/products/${id}`, { isFeatured: !current.data.isFeatured });
}

export async function deleteProduct(id: string) {
  return http.delete<{ id: string }>(`/products/${id}`);
}

export async function listCategories() {
  return http.get<Category[]>("/categories");
}

export async function createCategory(input: { name: string; parentId?: string | null }) {
  return http.post<Category>("/categories", input);
}

export async function updateCategory(id: string, patch: Partial<Pick<Category, "name" | "isActive" | "parentId">>) {
  return http.patch<Category>(`/categories/${id}`, patch);
}

export async function deleteCategory(id: string) {
  return http.delete<{ id: string }>(`/categories/${id}`);
}

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

export async function listInventory(params: { page?: number; limit?: number; lowStockOnly?: boolean } = {}) {
  return http.get<InventoryRow[]>("/inventory", params);
}

export async function listInventoryTransactions(sku?: string) {
  return http.get<InventoryTransaction[]>("/inventory/adjustments", { sku });
}

export async function adjustInventory(sku: string, delta: number, reason: string) {
  return http.post<InventoryRow>("/inventory/adjustments", { sku, delta, reason });
}

// ---------------------------------------------------------------------------
// Suppliers & purchases
// ---------------------------------------------------------------------------

export async function listSuppliers() {
  return http.get<Supplier[]>("/suppliers");
}

export async function createSupplier(input: { name: string; contact: string; address: string }) {
  return http.post<Supplier>("/suppliers", input);
}

export async function listPurchases() {
  return http.get<Purchase[]>("/purchases");
}

export async function createPurchase(input: { supplierId: string; items: { sku: string; orderedQty: number; cost: number }[] }) {
  return http.post<Purchase>("/purchases", input);
}

// ASSUMPTION: POST /purchases/:id/receive marks the PO received and bumps inventory
// server-side. If the backend instead expects PATCH { status: "Received" }, change here only.
export async function receivePurchase(id: string) {
  return http.post<Purchase>(`/purchases/${id}/receive`);
}

// ---------------------------------------------------------------------------
// Orders, payments & sales
// ---------------------------------------------------------------------------

export async function listOrders(params: { page?: number; limit?: number; status?: OrderStatus; q?: string } = {}) {
  return http.get<Order[]>("/orders", params);
}

export async function getOrder(id: string) {
  return http.get<Order>(`/orders/${id}`);
}

// The state machine still runs client-side first so illegal buttons are disabled
// before a round-trip — the backend is the source of truth and re-validates too.
export async function transitionOrder(id: string, to: OrderStatus) {
  const current = await getOrder(id);
  if (!canTransition(ORDER_TRANSITIONS, current.data.status, to)) {
    throw new ApiRequestError(`Cannot move an order from ${current.data.status} to ${to}.`, "ILLEGAL_TRANSITION");
  }
  return http.patch<Order>(`/orders/${id}`, { status: to });
}

export async function listPayments(params: { q?: string; status?: string } = {}) {
  return http.get<Payment[]>("/payments", params);
}

export async function getSalesReport() {
  return http.get<{
    trend: { label: string; revenue: number; orders: number }[];
    byCategory: { category: string; revenue: number }[];
    topProducts: { name: string; sku: string; unitsSold: number; revenue: number }[];
    totalRevenue: number;
    avgOrderValue: number;
    orderCount: number;
  }>("/sales");
}

// ---------------------------------------------------------------------------
// Returns & refunds
// ---------------------------------------------------------------------------

export async function listReturns() {
  return http.get<Return[]>("/returns");
}

export async function transitionReturn(id: string, to: ReturnStatus) {
  const current = await http.get<Return>(`/returns/${id}`);
  if (!canTransition(RETURN_TRANSITIONS, current.data.status, to)) {
    throw new ApiRequestError(`Cannot move a return from ${current.data.status} to ${to}.`, "ILLEGAL_TRANSITION");
  }
  return http.patch<Return>(`/returns/${id}`, { status: to });
}

export async function listRefunds() {
  return http.get<Refund[]>("/refunds");
}

export async function transitionRefund(id: string, to: RefundStatus) {
  const current = await http.get<Refund>(`/refunds/${id}`);
  if (!canTransition(REFUND_TRANSITIONS, current.data.status, to)) {
    throw new ApiRequestError(`Cannot move a refund from ${current.data.status} to ${to}.`, "ILLEGAL_TRANSITION");
  }
  return http.patch<Refund>(`/refunds/${id}`, { status: to });
}

// ---------------------------------------------------------------------------
// Customers & coupons
// ---------------------------------------------------------------------------

export async function listCustomers(params: { page?: number; limit?: number; q?: string } = {}) {
  return http.get<Customer[]>("/customers", params);
}

// ASSUMPTION: GET /customers/:id returns { customer, orders } (order history embedded).
export async function getCustomer(id: string) {
  return http.get<{ customer: Customer; orders: Order[] }>(`/customers/${id}`);
}

export async function listCoupons() {
  return http.get<Coupon[]>("/coupons");
}

export async function createCoupon(input: { code: string; type: Coupon["type"]; value: number; minCartValue: number; expiry: string; usageLimit: number }) {
  return http.post<Coupon>("/coupons", input);
}

export async function updateCoupon(id: string, patch: Partial<Pick<Coupon, "value" | "minCartValue" | "expiry" | "usageLimit">>) {
  return http.patch<Coupon>(`/coupons/${id}`, patch);
}

export async function deleteCoupon(id: string) {
  return http.delete<{ id: string }>(`/coupons/${id}`);
}

// ASSUMPTION: no dedicated toggle endpoint — read then flip isActive via PATCH.
export async function toggleCoupon(id: string) {
  const current = await http.get<Coupon>(`/coupons/${id}`);
  return http.patch<Coupon>(`/coupons/${id}`, { isActive: !current.data.isActive });
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export async function listBanners() {
  return http.get<Banner[]>("/content/banners");
}

export async function createBanner(input: { title: string; ctaText: string; ctaUrl: string }) {
  return http.post<Banner>("/content/banners", input);
}

export async function toggleBanner(id: string) {
  const current = await http.get<Banner>(`/content/banners/${id}`);
  return http.patch<Banner>(`/content/banners/${id}`, { isActive: !current.data.isActive });
}

export async function listHomepageSections() {
  return http.get<HomepageSection[]>("/content/homepage");
}

export async function toggleHomepageSection(id: string) {
  const current = await http.get<HomepageSection>(`/content/homepage/${id}`);
  return http.patch<HomepageSection>(`/content/homepage/${id}`, { isActive: !current.data.isActive });
}

// ---------------------------------------------------------------------------
// RBAC & audit
// ---------------------------------------------------------------------------

export async function listRoles() {
  return http.get<Role[]>("/roles");
}

export async function createRole(input: { name: string; description: string; permissions: Permission[] }) {
  return http.post<Role>("/roles", input);
}

export async function updateRolePermissions(id: string, permissions: Permission[]) {
  return http.patch<Role>(`/roles/${id}`, { permissions });
}

export async function listAdminUsers() {
  return http.get<AdminUser[]>("/users");
}

export async function inviteAdminUser(input: { name: string; email: string; roleId: string }) {
  return http.post<AdminUser>("/users", input);
}

// ASSUMPTION: no dedicated toggle endpoint — read then flip status via PATCH.
export async function toggleAdminUserStatus(id: string) {
  const current = await http.get<AdminUser>(`/users/${id}`);
  const status = current.data.status === "active" ? "suspended" : "active";
  return http.patch<AdminUser>(`/users/${id}`, { status });
}

// ASSUMPTION: GET /admin/audit-log — not spelled out in the contract table but
// implied by Epic 5's "Audit log viewer" requirement.
export async function listAuditLog() {
  return http.get<{ id: string; actor: string; action: string; entity: string; entityId: string; createdAt: string }[]>("/audit-log");
}

export async function me(): Promise<{ user: AdminUser; role: Role }> {
  const res = await http.get<{ user: AdminUser; role: Role }>("/auth/me");
  return res.data;
}

// ---------------------------------------------------------------------------
// Static reference data (no backend round-trip needed)
// ---------------------------------------------------------------------------

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

export type { Product, Category, InventoryRow, Supplier, Purchase, Order, Return, Refund, Customer, Coupon, Banner, HomepageSection, Payment, Role, AdminUser };