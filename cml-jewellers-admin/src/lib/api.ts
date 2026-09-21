import { ApiRequestError, authHttp, http, setAccessToken } from "./http";
import { canTransition, ORDER_TRANSITIONS, REFUND_TRANSITIONS, RETURN_TRANSITIONS } from "./state-machines";
import {
  AdminUser, Banner, BannerType, Category, Collection, Coupon, Customer, HomepageSection, InventoryRow,
  InventoryTransaction, Order, OrderStatus, Payment, Product, ProductAttributes, Purchase, Refund,
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
    isActive: (pick<boolean>(raw, ["isActive"]) ?? true),
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

 // Set the token now — whoami resolves the logged-in user's own role +
// permissions without needing role:manage (unlike GET /roles/:id, which
// only Super Admin/Admin can call).
setAccessToken(token);
let role: Role;
try {
  const whoamiRes = await http.get<{
    admin: Record<string, unknown>;
    role: Record<string, unknown>;
    permissions: string[];
  }>("/auth/whoami");
  const roleRaw = whoamiRes.data.role;
  role = {
    id: String(pick(roleRaw, ["id", "_id"]) ?? admin.roleId),
    name: String(pick(roleRaw, ["name"]) ?? ""),
    description: "",
    permissions: whoamiRes.data.permissions as Permission[],
    isSystem: undefined,
  };
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
// Media (Cloudinary, via backend's /admin/media routes)
// ---------------------------------------------------------------------------

export interface UploadedImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

// POST /admin/media/upload?folder=products|categories|banners — multipart
// field name must be "image" (see backend upload.middleware.ts /
// media.routes.ts). folder is nested under the fixed "cml-jewellers" root on
// the backend, so pass just "products" / "categories" / "banners" here.
export async function uploadImage(file: File, folder?: "products" | "categories" | "banners") {
  const formData = new FormData();
  formData.append("image", file);
  return http.upload<{ image: UploadedImage }>("/media/upload", formData, { folder });
}

export async function deleteImage(publicId: string) {
  // publicId contains slashes (e.g. "cml-jewellers/products/abc123") so it
  // must be encoded before being placed in the URL path.
  return http.delete<{ id: string }>(`/media/${encodeURIComponent(publicId)}`);
}

// ---------------------------------------------------------------------------
// Products & categories
// ---------------------------------------------------------------------------

// `category` / `subcategory` take a category id (the backend also accepts a slug). Note the
// backend has no `categoryId` query param — it is silently ignored, so filter with these.
export async function listProducts(
  params: { page?: number; limit?: number; q?: string; status?: string; category?: string; subcategory?: string } = {}
) {
  return http.get<Product[]>("/products", params);
}

export async function getProduct(id: string) {
  return http.get<Product>(`/products/${id}`);
}

// Optional starter variant + initial stock, created alongside the product —
// otherwise a new product has no variant/inventory at all and shows as
// permanently out of stock with no add-to-cart (BUG-01).
export interface NewProductVariantInput {
  sku: string;
  attributes?: Record<string, string>;
  price: number;
  mrp: number;
  isActive?: boolean;
  initialStock?: number;
}

// Attribute values as sent to the backend. On update, "" clears an attribute
// (including gender); an attribute that is left out is not touched.
export type ProductAttributesInput = { [K in keyof ProductAttributes]?: ProductAttributes[K] | "" };

// Fields the backend's createProductSchema accepts (see catalog.validators.ts).
export interface NewProductInput {
  name: string;
  sku: string;
  slug?: string; // generated from the name when omitted
  categoryId: string;
  subcategoryId?: string;
  collectionId?: string;
  description?: string;
  basePrice: number;
  mrp: number;
  status: Product["status"];
  attributes?: ProductAttributesInput;
  images?: string[];
  isFeatured?: boolean;
  isNewArrival?: boolean;
  variant?: NewProductVariantInput;
}

// PATCH body: send only what changed. "" clears description / subcategoryId /
// collectionId. `images`, when sent, replaces the whole array.
export type ProductPatch = Partial<Omit<NewProductInput, "variant">>;

export async function createProduct(input: NewProductInput) {
  return http.post<Product>("/products", input);
}

// `variantPriceSynced` is true when the product's only variant was moved to the new
// price/MRP as well (the backend does this so the price customers pay follows the edit).
export async function updateProduct(id: string, patch: ProductPatch) {
  return http.patch<{ product: Product; variantPriceSynced: boolean }>(`/products/${id}`, patch);
}

export async function updateProductStatus(id: string, status: Product["status"]) {
  return http.patch<Product>(`/products/${id}`, { status });
}

// There is no dedicated toggle endpoint for isFeatured, so flip it via PATCH.
// Pass `current` (the row's present value) to skip the extra round-trip; when it
// is omitted the current value is read from the server. The backend wraps the
// product as `{ product, variants }`, so the flag lives at data.product.isFeatured
// — reading it from data.isFeatured (the old code) was always undefined, which is
// why this could only ever switch the flag ON (BUG-03).
export async function toggleFeatured(id: string, current?: boolean) {
  let isFeatured = current;
  if (isFeatured === undefined) {
    const res = await http.get<{ product: Product }>(`/products/${id}`);
    isFeatured = Boolean(res.data.product?.isFeatured);
  }
  return http.patch<{ product: Product }>(`/products/${id}`, { isFeatured: !isFeatured });
}

export async function deleteProduct(id: string) {
  return http.delete<{ id: string }>(`/products/${id}`);
}

export async function listCategories() {
  return http.get<Category[]>("/categories");
}

// GET /admin/collections returns `{ collections }` (needs product:read).
export async function listCollections() {
  return http.get<{ collections: Collection[] }>("/collections");
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

export async function listInventory(params: { page?: number; limit?: number; lowStock?: boolean } = {}) {
  return http.get<InventoryRow[]>("/inventory", params);
}

// export async function listInventoryTransactions(sku?: string) {
//   return http.get<InventoryTransaction[]>("/inventory/adjustments", { sku });
// }

export async function listInventoryTransactions(variantId: string) {
  return http.get<InventoryTransaction[]>(`/inventory/${variantId}/transactions`);
}


export async function adjustInventory(variantId: string, delta: number, note: string) {
  return http.post<InventoryRow>("/inventory/adjustments", { variantId, delta, note });
}

export interface VariantShippingInfo {
  weightKg?: number;
  lengthCm?: number;
  breadthCm?: number;
  heightCm?: number;
}

// Full variant edit patch — sku/attributes/price/mrp/isActive, plus the
// shipping fields above (BUG-01: there was previously no way to edit any of
// this, or add/remove a variant, from the admin UI at all).
export interface VariantPatch extends VariantShippingInfo {
  sku?: string;
  // attributes and images REPLACE the stored value: always send the full object / array.
  attributes?: Record<string, string>;
  price?: number;
  mrp?: number;
  images?: string[];
  isActive?: boolean;
}

export async function updateVariant(variantId: string, patch: VariantPatch) {
  return http.patch<Record<string, unknown>>(`/products/variants/${variantId}`, patch);
}

export interface NewVariantInput {
  sku: string;
  attributes?: Record<string, string>;
  price: number;
  mrp: number;
  images?: string[];
  isActive?: boolean;
  initialStock?: number;
}

export async function createVariant(productId: string, input: NewVariantInput) {
  return http.post<Record<string, unknown>>(`/products/${productId}/variants`, input);
}

export async function deleteVariant(variantId: string) {
  return http.delete<{ id: string }>(`/products/variants/${variantId}`);
}
// ---------------------------------------------------------------------------
// Suppliers & purchases
// ---------------------------------------------------------------------------

export async function listSuppliers() {
  return http.get<Supplier[]>("/suppliers");
}

// Backend createSupplierSchema expects contact/address as nested objects, not
// joined strings (BUG-04) — send exactly what the person typed into the
// separate fields, omitting anything left blank.
export async function createSupplier(input: {
  name: string;
  contact?: { contactPerson?: string; email?: string; phone?: string };
  address?: { line1?: string; city?: string; state?: string; pincode?: string; country?: string };
}) {
  return http.post<Supplier>("/suppliers", input);
}

export async function listPurchases() {
  return http.get<Purchase[]>("/purchases");
}

// Backend createPurchaseSchema needs items[].variantId, not a SKU string
// (BUG-04) — the Purchases page resolves a typed SKU to a variantId via
// searchVariants() below before calling this.
export async function createPurchase(input: {
  supplierId: string;
  items: { variantId: string; orderedQty: number; cost: number }[];
  notes?: string;
}) {
  return http.post<Purchase>("/purchases", input);
}

// Looks up variants by SKU (partial match) so a purchase-order line can be
// resolved to the variantId the backend actually needs (BUG-04).
export async function searchVariants(q: string) {
  return http.get<{
    variants: { _id: string; sku: string; price: number; mrp: number; isActive: boolean; productName?: string }[];
  }>("/products/variants/search", { q });
}

// Backend receivePurchaseSchema requires items:[{variantId, receivedQty}] —
// posting no body (as this used to) always fails validation (BUG-04).
export async function receivePurchase(id: string, input: { items: { variantId: string; receivedQty: number }[] }) {
  return http.post<Purchase>(`/purchases/${id}/receive`, input);
}

export async function cancelPurchase(id: string) {
  return http.post<Purchase>(`/purchases/${id}/cancel`);
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
  const current = await http.get<{ order: Order }>(`/orders/${id}`);
  const currentStatus = current.data.order.status;
  if (!canTransition(ORDER_TRANSITIONS, currentStatus, to)) {
    throw new ApiRequestError(`Cannot move an order from ${currentStatus} to ${to}.`, "ILLEGAL_TRANSITION");
  }
  return http.patch<Order>(`/orders/${id}/status`, { status: to });
}

export async function listPayments(params: { q?: string; status?: string } = {}) {
  return http.get<Payment[]>("/payments", params);
}

export async function getSalesReport(params: { from?: string; to?: string } = {}) {
  return http.get<{
    range: { from: string; to: string };
    trend: { label: string; revenue: number; orders: number }[];
    byCategory: { category: string; revenue: number }[];
    topProducts: { name: string; sku: string; unitsSold: number; revenue: number }[];
    totalRevenue: number;
    avgOrderValue: number;
    orderCount: number;
  }>("/sales", params);
}

// ---------------------------------------------------------------------------
// Returns & refunds
// ---------------------------------------------------------------------------

export async function listReturns() {
  return http.get<Return[]>("/returns");
}

// Returns are NOT a generic status-field PATCH on the backend — each step is
// its own action endpoint (see routes/admin/return.routes.ts). The client-side
// state machine (RETURN_TRANSITIONS) still gates which buttons are enabled,
// but the actual call must hit the matching action route.
export async function transitionReturn(
  id: string,
  to: ReturnStatus,
  extra?: { reason?: string; passed?: boolean; notes?: string }
) {
  const current = await http.get<{ return: Return }>(`/returns/${id}`);
  const currentStatus = current.data.return.status;
  if (!canTransition(RETURN_TRANSITIONS, currentStatus, to)) {
    throw new ApiRequestError(`Cannot move a return from ${currentStatus} to ${to}.`, "ILLEGAL_TRANSITION");
  }

  switch (to) {
    case "Approved":
      return http.post<Return>(`/returns/${id}/approve`);
    case "Rejected":
      return http.post<Return>(`/returns/${id}/reject`, { reason: extra?.reason });
    case "PickedUp":
      return http.post<Return>(`/returns/${id}/pickup`);
    case "Received":
      return http.post<Return>(`/returns/${id}/received`);
    case "Inspected":
      return http.post<Return>(`/returns/${id}/inspect`, { passed: extra?.passed, notes: extra?.notes });
    case "Refunded":
      return http.post<Return>(`/returns/${id}/refund`);
    default:
      throw new ApiRequestError(`Unsupported return transition to ${to}.`, "ILLEGAL_TRANSITION");
  }
}

export async function listRefunds() {
  return http.get<Refund[]>("/refunds");
}

export async function transitionRefund(id: string, to: RefundStatus) {
  const current = await http.get<{ refund: Refund }>(`/refunds/${id}`);
  const currentStatus = current.data.refund.status;
  if (!canTransition(REFUND_TRANSITIONS, currentStatus, to)) {
    throw new ApiRequestError(`Cannot move a refund from ${currentStatus} to ${to}.`, "ILLEGAL_TRANSITION");
  }
  return http.patch<Refund>(`/refunds/${id}/status`, { status: to });
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

// No dedicated toggle endpoint — flip isActive via PATCH. Pass `current` (the
// row's present value) to skip the extra GET; otherwise it is read from the
// server, unwrapping the `{ coupon }` envelope the backend uses (BUG-03).
export async function toggleCoupon(id: string, current?: boolean) {
  let isActive = current;
  if (isActive === undefined) {
    const res = await http.get<{ coupon: Coupon }>(`/coupons/${id}`);
    isActive = Boolean(res.data.coupon?.isActive);
  }
  return http.patch<{ coupon: Coupon }>(`/coupons/${id}`, { isActive: !isActive });
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export async function listBanners() {
  return http.get<Banner[]>("/content/banners");
}

// The backend (createBannerSchema) requires `type` and `imageUrl`; everything
// else is optional (BUG-06).
export interface NewBannerInput {
  type: BannerType;
  imageUrl: string;
  title?: string;
  ctaText?: string;
  ctaUrl?: string;
  order?: number;
  isActive?: boolean;
}

export async function createBanner(input: NewBannerInput) {
  return http.post<{ banner: Banner }>("/content/banners", input);
}

// There is no GET /content/banners/:id, so the caller passes the row's current
// isActive value and this flips it via PATCH (BUG-03).
export async function toggleBanner(id: string, current: boolean) {
  return http.patch<{ banner: Banner }>(`/content/banners/${id}`, { isActive: !current });
}

export async function listHomepageSections() {
  return http.get<HomepageSection[]>("/content/homepage");
}

// Homepage sections are keyed by their `section` string (not a Mongo id) and
// there is no GET-by-key route, so the caller passes the section key and the
// row's current isActive value; this flips it via PATCH /content/homepage/:section
// (BUG-03).
export async function toggleHomepageSection(section: string, current: boolean) {
  return http.patch<{ section: HomepageSection }>(
    `/content/homepage/${encodeURIComponent(section)}`,
    { isActive: !current }
  );
}

// ---------------------------------------------------------------------------
// RBAC & audit
// ---------------------------------------------------------------------------

export async function listRoles() {
  return http.get<Role[]>("/roles");
}

// The backend (createRoleSchema / updateRoleSchema) expects `permissionKeys`, not
// `permissions` — sending `permissions` was silently stripped, so roles were
// created with no permissions and edits were ignored (BUG-05). Callers keep
// passing `permissions`; it is mapped to `permissionKeys` here.
export async function createRole(input: { name: string; description?: string; permissions: Permission[] }) {
  const { permissions, ...rest } = input;
  return http.post<{ role: Role }>("/roles", { ...rest, permissionKeys: permissions });
}

export async function updateRolePermissions(id: string, permissions: Permission[]) {
  return http.patch<{ role: Role }>(`/roles/${id}`, { permissionKeys: permissions });
}

// Canonical permission list from the backend (GET /admin/roles/permissions),
// so the role editor can never drift out of sync with the server (BUG-05).
export async function listPermissions(): Promise<Permission[]> {
  const res = await http.get<{ permissions: Permission[] }>("/roles/permissions");
  return res.data.permissions;
}

export async function listAdminUsers() {
  return http.get<AdminUser[]>("/users");
}

// The backend (createAdminUserSchema) requires an initial `password` (min 8) —
// omitting it made every invite fail validation (BUG-05).
export async function inviteAdminUser(input: { name: string; email: string; password: string; roleId: string }) {
  return http.post<{ admin: AdminUser }>("/users", input);
}

// AdminUser uses `isActive: boolean`, not a "active"/"suspended" status field.
// There's also no dedicated "reactivate" endpoint — only POST /:id/deactivate
// exists; reactivating goes through the generic PATCH /:id with { isActive: true }.
export async function toggleAdminUserStatus(id: string) {
  const current = await http.get<{ admin: AdminUser }>(`/users/${id}`);
  const isActive = current.data.admin.isActive;
  if (isActive) {
    return http.post<AdminUser>(`/users/${id}/deactivate`);
  }
  return http.patch<AdminUser>(`/users/${id}`, { isActive: true });
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

export async function whoami(): Promise<{ user: AdminUser; role: Role }> {
  const res = await http.get<{
    admin: Record<string, unknown>;
    role: Record<string, unknown>;
    permissions: string[];
  }>("/auth/whoami");

  const admin = normalizeAdmin(res.data.admin, "");
  const role: Role = {
    id: String(pick(res.data.role, ["id", "_id"]) ?? admin.roleId),
    name: String(pick(res.data.role, ["name"]) ?? ""),
    description: "",
    permissions: res.data.permissions as Permission[],
    isSystem: undefined,
  };

  return { user: admin, role };
}

// ---------------------------------------------------------------------------
// Static reference data
// ---------------------------------------------------------------------------

// Offline fallback only — mirrors ALL_PERMISSIONS in the backend's
// constants/permissions.ts. The source of truth is listPermissions() above; this
// is used if that request fails. Each key appears exactly once (BUG-05).
const ALL_PERMISSIONS: Permission[] = [
  "dashboard:read",
  "product:read", "product:write", "category:write",
  "inventory:read", "inventory:write",
  "purchase:manage",
  "order:read", "order:write",
  "return:manage", "refund:manage",
  "payment:read", "sales:read", "audit:read",
  "customer:read", "coupon:manage",
  "content:manage",
  "admin_user:manage", "role:manage",
];

export function allPermissions() {
  return ALL_PERMISSIONS;
}

// ---------------------------------------------------------------------------
// Shipping (Shiprocket)
// ---------------------------------------------------------------------------

export interface ServiceableCourier {
  courierId: string;
  courierName: string;
  rate: number;
  estimatedDeliveryDays: string;
  codAvailable: boolean;
}

export async function getShippingCouriers(orderId: string) {
  return http.get<{ couriers: ServiceableCourier[] }>(`/orders/${orderId}/shipping/couriers`);
}

export async function assignShippingCourier(orderId: string, courierId: string) {
  return http.post<{ order: Order }>(`/orders/${orderId}/shipping/awb`, { courierId });
}

export async function scheduleShippingPickup(orderId: string) {
  return http.post<{ order: Order }>(`/orders/${orderId}/shipping/pickup`);
}

export async function syncShippingTracking(orderId: string) {
  return http.post<{ order: Order }>(`/orders/${orderId}/shipping/sync`);
}

// ---------------------------------------------------------------------------
// Site settings (COD toggle)
// ---------------------------------------------------------------------------

export interface SiteSettings {
  codEnabled: boolean;
}

export async function getSettings() {
  const res = await http.get<{ settings: SiteSettings }>("/settings");
  return res.data.settings;
}

export async function updateSettings(codEnabled: boolean) {
  const res = await http.patch<{ settings: SiteSettings }>("/settings", { codEnabled });
  return res.data.settings;
}

export type { Product, Category, Collection, InventoryRow, Supplier, Purchase, Order, Return, Refund, Customer, Coupon, Banner, HomepageSection, Payment, Role, AdminUser };