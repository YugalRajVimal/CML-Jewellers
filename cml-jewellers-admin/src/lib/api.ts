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
// // // // flow) returns { accessToken, admin, role }. Per the architecture doc, admin
// // // // auth is documented only as "password + optional 2FA later" — no refresh
// // // // token is called out the way it is for the customer flow — so there is no
// // // // POST /admin/auth/refresh. The access token is persisted client-side (see
// // // // lib/http.ts) and used until it expires or the backend returns a 401, at
// // // // which point the session is cleared and the person logs in again.
// // // //
// // // // CONFIRMED from the real adminLogin controller: the response only contains
// // // // `{ admin: { id, name, email, roleId }, accessToken }` — no embedded role or
// // // // permissions. So after login, the role is resolved separately by roleId
// // // // against GET /admin/roles/:id (falling back to GET /admin/roles + find if
// // // // there's no single-role route), using the token we just received.
// // // type LoginResponseData = Record<string, unknown>;

// // // function pick<T = unknown>(obj: Record<string, unknown> | undefined, keys: string[]): T | undefined {
// // //   if (!obj) return undefined;
// // //   for (const key of keys) {
// // //     if (obj[key] !== undefined && obj[key] !== null) return obj[key] as T;
// // //   }
// // //   return undefined;
// // // }

// // // function normalizeAdmin(raw: Record<string, unknown>, fallbackEmail: string): AdminUser {
// // //   return {
// // //     id: String(pick(raw, ["id", "_id"]) ?? ""),
// // //     name: String(pick(raw, ["name"]) ?? ""),
// // //     email: String(pick(raw, ["email"]) ?? fallbackEmail),
// // //     roleId: String(pick(raw, ["roleId", "role_id", "role"]) ?? ""),
// // //     status: (pick(raw, ["status"]) as AdminUser["status"]) ?? "active",
// // //     createdAt: String(pick(raw, ["createdAt", "created_at"]) ?? new Date().toISOString()),
// // //     lastLoginAt: pick<string>(raw, ["lastLoginAt", "last_login_at"]),
// // //   };
// // // }

// // // function normalizeRole(raw: Record<string, unknown>): Role {
// // //   return {
// // //     id: String(pick(raw, ["id", "_id"]) ?? ""),
// // //     name: String(pick(raw, ["name"]) ?? ""),
// // //     description: String(pick(raw, ["description"]) ?? ""),
// // //     permissions: (pick<Permission[]>(raw, ["permissions"]) ?? []),
// // //     isSystem: pick<boolean>(raw, ["isSystem", "is_system"]),
// // //   };
// // // }

// // // async function resolveRole(roleId: string): Promise<Role> {
// // //   // Try a single-resource lookup first; not every backend implements one.
// // //   try {
// // //     const res = await http.get<Record<string, unknown>>(`/roles/${roleId}`);
// // //     return normalizeRole(res.data);
// // //   } catch {
// // //     const res = await http.get<Record<string, unknown>[]>("/roles");
// // //     const found = res.data.find((r) => String(pick(r, ["id", "_id"])) === roleId);
// // //     if (!found) {
// // //       throw new ApiRequestError(
// // //         `No role found for roleId "${roleId}" (checked GET /admin/roles/:id and GET /admin/roles).`,
// // //         "ROLE_NOT_FOUND"
// // //       );
// // //     }
// // //     return normalizeRole(found);
// // //   }
// // // }

// // // export async function login(email: string, password: string): Promise<{ data: Session }> {
// // //   const res = await authHttp.post<LoginResponseData>("/login", { email, password });
// // //   const data = res.data;

// // //   const token = pick<string>(data, ["accessToken", "access_token", "token", "jwt", "authToken"])
// // //     ?? pick<string>(pick(data, ["tokens"]) as Record<string, unknown> | undefined, ["accessToken", "access_token", "access"]);

// // //   if (!token) {
// // //     throw new ApiRequestError(
// // //       `Login succeeded but no access token was found in the response (keys received: ${Object.keys(data).join(", ") || "none"}). ` +
// // //         `Check /admin/auth/login's response shape against src/lib/api.ts's login().`,
// // //       "MISSING_ACCESS_TOKEN"
// // //     );
// // //   }

// // //   const adminRaw = pick<Record<string, unknown>>(data, ["admin", "user"]);
// // //   if (!adminRaw) {
// // //     throw new ApiRequestError(
// // //       `Login succeeded but no admin user object was found in the response (keys received: ${Object.keys(data).join(", ") || "none"}).`,
// // //       "MISSING_ADMIN_USER"
// // //     );
// // //   }

// // //   const admin = normalizeAdmin(adminRaw, email);
// // //   if (!admin.roleId) {
// // //     throw new ApiRequestError(
// // //       `Login succeeded but the admin object has no roleId to resolve permissions from.`,
// // //       "MISSING_ROLE_ID"
// // //     );
// // //   }

// // //  // Set the token now — whoami resolves the logged-in user's own role +
// // // // permissions without needing role:manage (unlike GET /roles/:id, which
// // // // only Super Admin/Admin can call).
// // // setAccessToken(token);
// // // let role: Role;
// // // try {
// // //   const whoamiRes = await http.get<{
// // //     admin: Record<string, unknown>;
// // //     role: Record<string, unknown>;
// // //     permissions: string[];
// // //   }>("/auth/whoami");
// // //   const roleRaw = whoamiRes.data.role;
// // //   role = {
// // //     id: String(pick(roleRaw, ["id", "_id"]) ?? admin.roleId),
// // //     name: String(pick(roleRaw, ["name"]) ?? ""),
// // //     description: "",
// // //     permissions: whoamiRes.data.permissions as Permission[],
// // //     isSystem: undefined,
// // //   };
// // // } catch (e) {
// // //   setAccessToken(null);
// // //   throw e;
// // // }

// // // return { data: { token, user: admin, role } };
// // // }

// // // // ASSUMPTION: POST /admin/auth/logout exists for the backend to record/audit the
// // // // event; since the JWT itself isn't revocable without a session store, this is
// // // // best-effort — the client clears its token regardless of whether the call succeeds.
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

// // // // export async function getDashboard() {
// // // //   return http.get<{
// // // //     stats: { revenue30d: number; orders30d: number; customers: number; openOrders: number; lowStock: number; pendingReturns: number };
// // // //     trend: { label: string; revenue: number; orders: number }[];
// // // //     recentOrders: Order[];
// // // //     lowStockRows: InventoryRow[];
// // // //   }>("/dashboard");
// // // // }
// // // export async function getDashboard() {
// // //   const [summaryRes, trendRes, lowStockRes] = await Promise.all([
// // //     http.get<{
// // //       range: { from: string; to: string };
// // //       revenue: number;
// // //       orderCount: number;
// // //       averageOrderValue: number;
// // //       newCustomers: number;
// // //       lowStockCount: number;
// // //       pendingReturns: number;
// // //     }>("/dashboard/summary"),
// // //     http.get<{ trend: { date: string; revenue: number; orders: number }[] }>("/dashboard/revenue-trend"),
// // //     http.get<{ items: InventoryRow[] }>("/dashboard/low-stock", { limit: 5 }),
// // //   ]);

// // //   const summary = summaryRes.data;
// // //   const trend = trendRes.data.trend;
// // //   const lowStockRows = lowStockRes.data.items;

// // //   return {
// // //     ...summaryRes,
// // //     data: {
// // //       stats: {
// // //         revenue30d: summary.revenue,
// // //         orders30d: summary.orderCount,
// // //         customers: summary.newCustomers,
// // //         openOrders: 0, // no matching backend field — see note below
// // //         lowStock: summary.lowStockCount,
// // //         pendingReturns: summary.pendingReturns,
// // //       },
// // //       trend: trend.map((t) => ({ label: t.date, revenue: t.revenue, orders: t.orders })),
// // //       recentOrders: [], // no matching backend field — see note below
// // //       lowStockRows,
// // //     },
// // //   };
// // // }

// // // // ---------------------------------------------------------------------------
// // // // Media (Cloudinary, via backend's /admin/media routes)
// // // // ---------------------------------------------------------------------------

// // // export interface UploadedImage {
// // //   url: string;
// // //   publicId: string;
// // //   width: number;
// // //   height: number;
// // //   format: string;
// // //   bytes: number;
// // // }

// // // // POST /admin/media/upload?folder=products|categories|banners — multipart
// // // // field name must be "image" (see backend upload.middleware.ts /
// // // // media.routes.ts). folder is nested under the fixed "cml-jewellers" root on
// // // // the backend, so pass just "products" / "categories" / "banners" here.
// // // export async function uploadImage(file: File, folder?: "products" | "categories" | "banners") {
// // //   const formData = new FormData();
// // //   formData.append("image", file);
// // //   return http.upload<{ image: UploadedImage }>("/media/upload", formData, { folder });
// // // }

// // // export async function deleteImage(publicId: string) {
// // //   // publicId contains slashes (e.g. "cml-jewellers/products/abc123") so it
// // //   // must be encoded before being placed in the URL path.
// // //   return http.delete<{ id: string }>(`/media/${encodeURIComponent(publicId)}`);
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
// // //   name: string; sku: string; categoryId: string; basePrice: number; mrp: number; status: Product["status"]; images?: string[];
// // // }) {
// // //   return http.post<Product>("/products", input);
// // // }

// // // export async function updateProduct(id: string, patch: Partial<Pick<Product, "name" | "categoryId" | "basePrice" | "mrp" | "status" | "images">>) {
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

// // // export async function listInventory(params: { page?: number; limit?: number; lowStock?: boolean } = {}) {
// // //   return http.get<InventoryRow[]>("/inventory", params);
// // // }

// // // // export async function listInventoryTransactions(sku?: string) {
// // // //   return http.get<InventoryTransaction[]>("/inventory/adjustments", { sku });
// // // // }

// // // export async function listInventoryTransactions(variantId: string) {
// // //   return http.get<InventoryTransaction[]>(`/inventory/${variantId}/transactions`);
// // // }


// // // export async function adjustInventory(variantId: string, delta: number, note: string) {
// // //   return http.post<InventoryRow>("/inventory/adjustments", { variantId, delta, note });
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

// // // export async function me(): Promise<{ user: AdminUser; role: Role }> {
// // //   const res = await http.get<{ user: AdminUser; role: Role }>("/auth/me");
// // //   return res.data;
// // // }

// // // export async function whoami(): Promise<{ user: AdminUser; role: Role }> {
// // //   const res = await http.get<{
// // //     admin: Record<string, unknown>;
// // //     role: Record<string, unknown>;
// // //     permissions: string[];
// // //   }>("/auth/whoami");

// // //   const admin = normalizeAdmin(res.data.admin, "");
// // //   const role: Role = {
// // //     id: String(pick(res.data.role, ["id", "_id"]) ?? admin.roleId),
// // //     name: String(pick(res.data.role, ["name"]) ?? ""),
// // //     description: "",
// // //     permissions: res.data.permissions as Permission[],
// // //     isSystem: undefined,
// // //   };

// // //   return { user: admin, role };
// // // }

// // // // ---------------------------------------------------------------------------
// // // // Static reference data (no backend round-trip needed)
// // // // ---------------------------------------------------------------------------

// // // const ALL_PERMISSIONS: Permission[] = [
// // //   "dashboard:read",
// // //   "product:read", "product:write", "category:write", "category:write",
// // //   "inventory:read", "inventory:write", "purchase:manage", "purchase:manage",
// // //   "order:read", "order:write", "order:read", "order:read",
// // //   "return:manage", "return:manage", "refund:manage", "refund:manage",
// // //   "customer:read", "coupon:manage", "coupon:manage", "content:manage", "content:manage",
// // //   "admin_user:manage", "admin_user:manage", "role:manage", "role:manage", "dashboard:read",
// // // ];

// // // export function allPermissions() {
// // //   return ALL_PERMISSIONS;
// // // }

// // // export type { Product, Category, InventoryRow, Supplier, Purchase, Order, Return, Refund, Customer, Coupon, Banner, HomepageSection, Payment, Role, AdminUser };

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
// // //
// // // CONFIRMED from the real adminLogin controller: the response only contains
// // // `{ admin: { id, name, email, roleId }, accessToken }` — no embedded role or
// // // permissions. So after login, the role is resolved separately by roleId
// // // against GET /admin/roles/:id (falling back to GET /admin/roles + find if
// // // there's no single-role route), using the token we just received.
// // type LoginResponseData = Record<string, unknown>;

// // function pick<T = unknown>(obj: Record<string, unknown> | undefined, keys: string[]): T | undefined {
// //   if (!obj) return undefined;
// //   for (const key of keys) {
// //     if (obj[key] !== undefined && obj[key] !== null) return obj[key] as T;
// //   }
// //   return undefined;
// // }

// // function normalizeAdmin(raw: Record<string, unknown>, fallbackEmail: string): AdminUser {
// //   return {
// //     id: String(pick(raw, ["id", "_id"]) ?? ""),
// //     name: String(pick(raw, ["name"]) ?? ""),
// //     email: String(pick(raw, ["email"]) ?? fallbackEmail),
// //     roleId: String(pick(raw, ["roleId", "role_id", "role"]) ?? ""),
// //     isActive: (pick<boolean>(raw, ["isActive"]) ?? true),
// //     status: (pick(raw, ["status"]) as AdminUser["status"]) ?? "active",
// //     createdAt: String(pick(raw, ["createdAt", "created_at"]) ?? new Date().toISOString()),
// //     lastLoginAt: pick<string>(raw, ["lastLoginAt", "last_login_at"]),
// //   };
// // }

// // function normalizeRole(raw: Record<string, unknown>): Role {
// //   return {
// //     id: String(pick(raw, ["id", "_id"]) ?? ""),
// //     name: String(pick(raw, ["name"]) ?? ""),
// //     description: String(pick(raw, ["description"]) ?? ""),
// //     permissions: (pick<Permission[]>(raw, ["permissions"]) ?? []),
// //     isSystem: pick<boolean>(raw, ["isSystem", "is_system"]),
// //   };
// // }

// // async function resolveRole(roleId: string): Promise<Role> {
// //   // Try a single-resource lookup first; not every backend implements one.
// //   try {
// //     const res = await http.get<Record<string, unknown>>(`/roles/${roleId}`);
// //     return normalizeRole(res.data);
// //   } catch {
// //     const res = await http.get<Record<string, unknown>[]>("/roles");
// //     const found = res.data.find((r) => String(pick(r, ["id", "_id"])) === roleId);
// //     if (!found) {
// //       throw new ApiRequestError(
// //         `No role found for roleId "${roleId}" (checked GET /admin/roles/:id and GET /admin/roles).`,
// //         "ROLE_NOT_FOUND"
// //       );
// //     }
// //     return normalizeRole(found);
// //   }
// // }

// // export async function login(email: string, password: string): Promise<{ data: Session }> {
// //   const res = await authHttp.post<LoginResponseData>("/login", { email, password });
// //   const data = res.data;

// //   const token = pick<string>(data, ["accessToken", "access_token", "token", "jwt", "authToken"])
// //     ?? pick<string>(pick(data, ["tokens"]) as Record<string, unknown> | undefined, ["accessToken", "access_token", "access"]);

// //   if (!token) {
// //     throw new ApiRequestError(
// //       `Login succeeded but no access token was found in the response (keys received: ${Object.keys(data).join(", ") || "none"}). ` +
// //         `Check /admin/auth/login's response shape against src/lib/api.ts's login().`,
// //       "MISSING_ACCESS_TOKEN"
// //     );
// //   }

// //   const adminRaw = pick<Record<string, unknown>>(data, ["admin", "user"]);
// //   if (!adminRaw) {
// //     throw new ApiRequestError(
// //       `Login succeeded but no admin user object was found in the response (keys received: ${Object.keys(data).join(", ") || "none"}).`,
// //       "MISSING_ADMIN_USER"
// //     );
// //   }

// //   const admin = normalizeAdmin(adminRaw, email);
// //   if (!admin.roleId) {
// //     throw new ApiRequestError(
// //       `Login succeeded but the admin object has no roleId to resolve permissions from.`,
// //       "MISSING_ROLE_ID"
// //     );
// //   }

// //  // Set the token now — whoami resolves the logged-in user's own role +
// // // permissions without needing role:manage (unlike GET /roles/:id, which
// // // only Super Admin/Admin can call).
// // setAccessToken(token);
// // let role: Role;
// // try {
// //   const whoamiRes = await http.get<{
// //     admin: Record<string, unknown>;
// //     role: Record<string, unknown>;
// //     permissions: string[];
// //   }>("/auth/whoami");
// //   const roleRaw = whoamiRes.data.role;
// //   role = {
// //     id: String(pick(roleRaw, ["id", "_id"]) ?? admin.roleId),
// //     name: String(pick(roleRaw, ["name"]) ?? ""),
// //     description: "",
// //     permissions: whoamiRes.data.permissions as Permission[],
// //     isSystem: undefined,
// //   };
// // } catch (e) {
// //   setAccessToken(null);
// //   throw e;
// // }

// // return { data: { token, user: admin, role } };
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

// // // export async function getDashboard() {
// // //   return http.get<{
// // //     stats: { revenue30d: number; orders30d: number; customers: number; openOrders: number; lowStock: number; pendingReturns: number };
// // //     trend: { label: string; revenue: number; orders: number }[];
// // //     recentOrders: Order[];
// // //     lowStockRows: InventoryRow[];
// // //   }>("/dashboard");
// // // }
// // export async function getDashboard() {
// //   const [summaryRes, trendRes, lowStockRes] = await Promise.all([
// //     http.get<{
// //       range: { from: string; to: string };
// //       revenue: number;
// //       orderCount: number;
// //       averageOrderValue: number;
// //       newCustomers: number;
// //       lowStockCount: number;
// //       pendingReturns: number;
// //     }>("/dashboard/summary"),
// //     http.get<{ trend: { date: string; revenue: number; orders: number }[] }>("/dashboard/revenue-trend"),
// //     http.get<{ items: InventoryRow[] }>("/dashboard/low-stock", { limit: 5 }),
// //   ]);

// //   const summary = summaryRes.data;
// //   const trend = trendRes.data.trend;
// //   const lowStockRows = lowStockRes.data.items;

// //   return {
// //     ...summaryRes,
// //     data: {
// //       stats: {
// //         revenue30d: summary.revenue,
// //         orders30d: summary.orderCount,
// //         customers: summary.newCustomers,
// //         openOrders: 0, // no matching backend field — see note below
// //         lowStock: summary.lowStockCount,
// //         pendingReturns: summary.pendingReturns,
// //       },
// //       trend: trend.map((t) => ({ label: t.date, revenue: t.revenue, orders: t.orders })),
// //       recentOrders: [], // no matching backend field — see note below
// //       lowStockRows,
// //     },
// //   };
// // }

// // // ---------------------------------------------------------------------------
// // // Media (Cloudinary, via backend's /admin/media routes)
// // // ---------------------------------------------------------------------------

// // export interface UploadedImage {
// //   url: string;
// //   publicId: string;
// //   width: number;
// //   height: number;
// //   format: string;
// //   bytes: number;
// // }

// // // POST /admin/media/upload?folder=products|categories|banners — multipart
// // // field name must be "image" (see backend upload.middleware.ts /
// // // media.routes.ts). folder is nested under the fixed "cml-jewellers" root on
// // // the backend, so pass just "products" / "categories" / "banners" here.
// // export async function uploadImage(file: File, folder?: "products" | "categories" | "banners") {
// //   const formData = new FormData();
// //   formData.append("image", file);
// //   return http.upload<{ image: UploadedImage }>("/media/upload", formData, { folder });
// // }

// // export async function deleteImage(publicId: string) {
// //   // publicId contains slashes (e.g. "cml-jewellers/products/abc123") so it
// //   // must be encoded before being placed in the URL path.
// //   return http.delete<{ id: string }>(`/media/${encodeURIComponent(publicId)}`);
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
// //   name: string; sku: string; categoryId: string; basePrice: number; mrp: number; status: Product["status"]; images?: string[];
// // }) {
// //   return http.post<Product>("/products", input);
// // }

// // export async function updateProduct(id: string, patch: Partial<Pick<Product, "name" | "categoryId" | "basePrice" | "mrp" | "status" | "images">>) {
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

// // export async function listInventory(params: { page?: number; limit?: number; lowStock?: boolean } = {}) {
// //   return http.get<InventoryRow[]>("/inventory", params);
// // }

// // // export async function listInventoryTransactions(sku?: string) {
// // //   return http.get<InventoryTransaction[]>("/inventory/adjustments", { sku });
// // // }

// // export async function listInventoryTransactions(variantId: string) {
// //   return http.get<InventoryTransaction[]>(`/inventory/${variantId}/transactions`);
// // }


// // export async function adjustInventory(variantId: string, delta: number, note: string) {
// //   return http.post<InventoryRow>("/inventory/adjustments", { variantId, delta, note });
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
// //   const current = await http.get<{ order: Order }>(`/orders/${id}`);
// //   const currentStatus = current.data.order.status;
// //   if (!canTransition(ORDER_TRANSITIONS, currentStatus, to)) {
// //     throw new ApiRequestError(`Cannot move an order from ${currentStatus} to ${to}.`, "ILLEGAL_TRANSITION");
// //   }
// //   return http.patch<Order>(`/orders/${id}/status`, { status: to });
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

// // // Returns are NOT a generic status-field PATCH on the backend — each step is
// // // its own action endpoint (see routes/admin/return.routes.ts). The client-side
// // // state machine (RETURN_TRANSITIONS) still gates which buttons are enabled,
// // // but the actual call must hit the matching action route.
// // export async function transitionReturn(
// //   id: string,
// //   to: ReturnStatus,
// //   extra?: { reason?: string; passed?: boolean; notes?: string }
// // ) {
// //   const current = await http.get<{ return: Return }>(`/returns/${id}`);
// //   const currentStatus = current.data.return.status;
// //   if (!canTransition(RETURN_TRANSITIONS, currentStatus, to)) {
// //     throw new ApiRequestError(`Cannot move a return from ${currentStatus} to ${to}.`, "ILLEGAL_TRANSITION");
// //   }

// //   switch (to) {
// //     case "Approved":
// //       return http.post<Return>(`/returns/${id}/approve`);
// //     case "Rejected":
// //       return http.post<Return>(`/returns/${id}/reject`, { reason: extra?.reason });
// //     case "PickedUp":
// //       return http.post<Return>(`/returns/${id}/pickup`);
// //     case "Received":
// //       return http.post<Return>(`/returns/${id}/received`);
// //     case "Inspected":
// //       return http.post<Return>(`/returns/${id}/inspect`, { passed: extra?.passed, notes: extra?.notes });
// //     case "Refunded":
// //       return http.post<Return>(`/returns/${id}/refund`);
// //     default:
// //       throw new ApiRequestError(`Unsupported return transition to ${to}.`, "ILLEGAL_TRANSITION");
// //   }
// // }

// // export async function listRefunds() {
// //   return http.get<Refund[]>("/refunds");
// // }

// // export async function transitionRefund(id: string, to: RefundStatus) {
// //   const current = await http.get<{ refund: Refund }>(`/refunds/${id}`);
// //   const currentStatus = current.data.refund.status;
// //   if (!canTransition(REFUND_TRANSITIONS, currentStatus, to)) {
// //     throw new ApiRequestError(`Cannot move a refund from ${currentStatus} to ${to}.`, "ILLEGAL_TRANSITION");
// //   }
// //   return http.patch<Refund>(`/refunds/${id}/status`, { status: to });
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

// // // AdminUser uses `isActive: boolean`, not a "active"/"suspended" status field.
// // // There's also no dedicated "reactivate" endpoint — only POST /:id/deactivate
// // // exists; reactivating goes through the generic PATCH /:id with { isActive: true }.
// // export async function toggleAdminUserStatus(id: string) {
// //   const current = await http.get<{ admin: AdminUser }>(`/users/${id}`);
// //   const isActive = current.data.admin.isActive;
// //   if (isActive) {
// //     return http.post<AdminUser>(`/users/${id}/deactivate`);
// //   }
// //   return http.patch<AdminUser>(`/users/${id}`, { isActive: true });
// // }

// // // ASSUMPTION: GET /admin/audit-log — not spelled out in the contract table but
// // // implied by Epic 5's "Audit log viewer" requirement.
// // export async function listAuditLog() {
// //   return http.get<{ id: string; actor: string; action: string; entity: string; entityId: string; createdAt: string }[]>("/audit-log");
// // }

// // export async function me(): Promise<{ user: AdminUser; role: Role }> {
// //   const res = await http.get<{ user: AdminUser; role: Role }>("/auth/me");
// //   return res.data;
// // }

// // export async function whoami(): Promise<{ user: AdminUser; role: Role }> {
// //   const res = await http.get<{
// //     admin: Record<string, unknown>;
// //     role: Record<string, unknown>;
// //     permissions: string[];
// //   }>("/auth/whoami");

// //   const admin = normalizeAdmin(res.data.admin, "");
// //   const role: Role = {
// //     id: String(pick(res.data.role, ["id", "_id"]) ?? admin.roleId),
// //     name: String(pick(res.data.role, ["name"]) ?? ""),
// //     description: "",
// //     permissions: res.data.permissions as Permission[],
// //     isSystem: undefined,
// //   };

// //   return { user: admin, role };
// // }

// // // ---------------------------------------------------------------------------
// // // Static reference data (no backend round-trip needed)
// // // ---------------------------------------------------------------------------

// // const ALL_PERMISSIONS: Permission[] = [
// //   "dashboard:read",
// //   "product:read", "product:write", "category:write", "category:write",
// //   "inventory:read", "inventory:write", "purchase:manage", "purchase:manage",
// //   "order:read", "order:write", "order:read", "order:read",
// //   "return:manage", "return:manage", "refund:manage", "refund:manage",
// //   "customer:read", "coupon:manage", "coupon:manage", "content:manage", "content:manage",
// //   "admin_user:manage", "admin_user:manage", "role:manage", "role:manage", "dashboard:read",
// // ];

// // export function allPermissions() {
// //   return ALL_PERMISSIONS;
// // }

// // export type { Product, Category, InventoryRow, Supplier, Purchase, Order, Return, Refund, Customer, Coupon, Banner, HomepageSection, Payment, Role, AdminUser };

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
// // CONFIRMED from the real adminLogin controller: the response only contains
// // `{ admin: { id, name, email, roleId }, accessToken }` — no embedded role or
// // permissions. So after login, the role is resolved separately by roleId
// // against GET /admin/roles/:id (falling back to GET /admin/roles + find if
// // there's no single-role route), using the token we just received.
// type LoginResponseData = Record<string, unknown>;

// function pick<T = unknown>(obj: Record<string, unknown> | undefined, keys: string[]): T | undefined {
//   if (!obj) return undefined;
//   for (const key of keys) {
//     if (obj[key] !== undefined && obj[key] !== null) return obj[key] as T;
//   }
//   return undefined;
// }

// function normalizeAdmin(raw: Record<string, unknown>, fallbackEmail: string): AdminUser {
//   return {
//     id: String(pick(raw, ["id", "_id"]) ?? ""),
//     name: String(pick(raw, ["name"]) ?? ""),
//     email: String(pick(raw, ["email"]) ?? fallbackEmail),
//     roleId: String(pick(raw, ["roleId", "role_id", "role"]) ?? ""),
//     isActive: (pick<boolean>(raw, ["isActive"]) ?? true),
//     status: (pick(raw, ["status"]) as AdminUser["status"]) ?? "active",
//     createdAt: String(pick(raw, ["createdAt", "created_at"]) ?? new Date().toISOString()),
//     lastLoginAt: pick<string>(raw, ["lastLoginAt", "last_login_at"]),
//   };
// }

// function normalizeRole(raw: Record<string, unknown>): Role {
//   return {
//     id: String(pick(raw, ["id", "_id"]) ?? ""),
//     name: String(pick(raw, ["name"]) ?? ""),
//     description: String(pick(raw, ["description"]) ?? ""),
//     permissions: (pick<Permission[]>(raw, ["permissions"]) ?? []),
//     isSystem: pick<boolean>(raw, ["isSystem", "is_system"]),
//   };
// }

// async function resolveRole(roleId: string): Promise<Role> {
//   // Try a single-resource lookup first; not every backend implements one.
//   try {
//     const res = await http.get<Record<string, unknown>>(`/roles/${roleId}`);
//     return normalizeRole(res.data);
//   } catch {
//     const res = await http.get<Record<string, unknown>[]>("/roles");
//     const found = res.data.find((r) => String(pick(r, ["id", "_id"])) === roleId);
//     if (!found) {
//       throw new ApiRequestError(
//         `No role found for roleId "${roleId}" (checked GET /admin/roles/:id and GET /admin/roles).`,
//         "ROLE_NOT_FOUND"
//       );
//     }
//     return normalizeRole(found);
//   }
// }

// export async function login(email: string, password: string): Promise<{ data: Session }> {
//   const res = await authHttp.post<LoginResponseData>("/login", { email, password });
//   const data = res.data;

//   const token = pick<string>(data, ["accessToken", "access_token", "token", "jwt", "authToken"])
//     ?? pick<string>(pick(data, ["tokens"]) as Record<string, unknown> | undefined, ["accessToken", "access_token", "access"]);

//   if (!token) {
//     throw new ApiRequestError(
//       `Login succeeded but no access token was found in the response (keys received: ${Object.keys(data).join(", ") || "none"}). ` +
//         `Check /admin/auth/login's response shape against src/lib/api.ts's login().`,
//       "MISSING_ACCESS_TOKEN"
//     );
//   }

//   const adminRaw = pick<Record<string, unknown>>(data, ["admin", "user"]);
//   if (!adminRaw) {
//     throw new ApiRequestError(
//       `Login succeeded but no admin user object was found in the response (keys received: ${Object.keys(data).join(", ") || "none"}).`,
//       "MISSING_ADMIN_USER"
//     );
//   }

//   const admin = normalizeAdmin(adminRaw, email);
//   if (!admin.roleId) {
//     throw new ApiRequestError(
//       `Login succeeded but the admin object has no roleId to resolve permissions from.`,
//       "MISSING_ROLE_ID"
//     );
//   }

//  // Set the token now — whoami resolves the logged-in user's own role +
// // permissions without needing role:manage (unlike GET /roles/:id, which
// // only Super Admin/Admin can call).
// setAccessToken(token);
// let role: Role;
// try {
//   const whoamiRes = await http.get<{
//     admin: Record<string, unknown>;
//     role: Record<string, unknown>;
//     permissions: string[];
//   }>("/auth/whoami");
//   const roleRaw = whoamiRes.data.role;
//   role = {
//     id: String(pick(roleRaw, ["id", "_id"]) ?? admin.roleId),
//     name: String(pick(roleRaw, ["name"]) ?? ""),
//     description: "",
//     permissions: whoamiRes.data.permissions as Permission[],
//     isSystem: undefined,
//   };
// } catch (e) {
//   setAccessToken(null);
//   throw e;
// }

// return { data: { token, user: admin, role } };
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

// // export async function getDashboard() {
// //   return http.get<{
// //     stats: { revenue30d: number; orders30d: number; customers: number; openOrders: number; lowStock: number; pendingReturns: number };
// //     trend: { label: string; revenue: number; orders: number }[];
// //     recentOrders: Order[];
// //     lowStockRows: InventoryRow[];
// //   }>("/dashboard");
// // }
// export async function getDashboard() {
//   const [summaryRes, trendRes, lowStockRes] = await Promise.all([
//     http.get<{
//       range: { from: string; to: string };
//       revenue: number;
//       orderCount: number;
//       averageOrderValue: number;
//       newCustomers: number;
//       lowStockCount: number;
//       pendingReturns: number;
//     }>("/dashboard/summary"),
//     http.get<{ trend: { date: string; revenue: number; orders: number }[] }>("/dashboard/revenue-trend"),
//     http.get<{ items: InventoryRow[] }>("/dashboard/low-stock", { limit: 5 }),
//   ]);

//   const summary = summaryRes.data;
//   const trend = trendRes.data.trend;
//   const lowStockRows = lowStockRes.data.items;

//   return {
//     ...summaryRes,
//     data: {
//       stats: {
//         revenue30d: summary.revenue,
//         orders30d: summary.orderCount,
//         customers: summary.newCustomers,
//         openOrders: 0, // no matching backend field — see note below
//         lowStock: summary.lowStockCount,
//         pendingReturns: summary.pendingReturns,
//       },
//       trend: trend.map((t) => ({ label: t.date, revenue: t.revenue, orders: t.orders })),
//       recentOrders: [], // no matching backend field — see note below
//       lowStockRows,
//     },
//   };
// }

// // ---------------------------------------------------------------------------
// // Media (Cloudinary, via backend's /admin/media routes)
// // ---------------------------------------------------------------------------

// export interface UploadedImage {
//   url: string;
//   publicId: string;
//   width: number;
//   height: number;
//   format: string;
//   bytes: number;
// }

// // POST /admin/media/upload?folder=products|categories|banners — multipart
// // field name must be "image" (see backend upload.middleware.ts /
// // media.routes.ts). folder is nested under the fixed "cml-jewellers" root on
// // the backend, so pass just "products" / "categories" / "banners" here.
// export async function uploadImage(file: File, folder?: "products" | "categories" | "banners") {
//   const formData = new FormData();
//   formData.append("image", file);
//   return http.upload<{ image: UploadedImage }>("/media/upload", formData, { folder });
// }

// export async function deleteImage(publicId: string) {
//   // publicId contains slashes (e.g. "cml-jewellers/products/abc123") so it
//   // must be encoded before being placed in the URL path.
//   return http.delete<{ id: string }>(`/media/${encodeURIComponent(publicId)}`);
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
//   name: string; sku: string; categoryId: string; basePrice: number; mrp: number; status: Product["status"]; images?: string[];
// }) {
//   return http.post<Product>("/products", input);
// }

// export async function updateProduct(id: string, patch: Partial<Pick<Product, "name" | "categoryId" | "basePrice" | "mrp" | "status" | "images">>) {
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

// export async function listInventory(params: { page?: number; limit?: number; lowStock?: boolean } = {}) {
//   return http.get<InventoryRow[]>("/inventory", params);
// }

// // export async function listInventoryTransactions(sku?: string) {
// //   return http.get<InventoryTransaction[]>("/inventory/adjustments", { sku });
// // }

// export async function listInventoryTransactions(variantId: string) {
//   return http.get<InventoryTransaction[]>(`/inventory/${variantId}/transactions`);
// }


// export async function adjustInventory(variantId: string, delta: number, note: string) {
//   return http.post<InventoryRow>("/inventory/adjustments", { variantId, delta, note });
// }

// export interface VariantShippingInfo {
//   weightKg?: number;
//   lengthCm?: number;
//   breadthCm?: number;
//   heightCm?: number;
// }

// export async function updateVariant(variantId: string, patch: VariantShippingInfo) {
//   return http.patch<Record<string, unknown>>(`/products/variants/${variantId}`, patch);
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
//   const current = await http.get<{ order: Order }>(`/orders/${id}`);
//   const currentStatus = current.data.order.status;
//   if (!canTransition(ORDER_TRANSITIONS, currentStatus, to)) {
//     throw new ApiRequestError(`Cannot move an order from ${currentStatus} to ${to}.`, "ILLEGAL_TRANSITION");
//   }
//   return http.patch<Order>(`/orders/${id}/status`, { status: to });
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

// // Returns are NOT a generic status-field PATCH on the backend — each step is
// // its own action endpoint (see routes/admin/return.routes.ts). The client-side
// // state machine (RETURN_TRANSITIONS) still gates which buttons are enabled,
// // but the actual call must hit the matching action route.
// export async function transitionReturn(
//   id: string,
//   to: ReturnStatus,
//   extra?: { reason?: string; passed?: boolean; notes?: string }
// ) {
//   const current = await http.get<{ return: Return }>(`/returns/${id}`);
//   const currentStatus = current.data.return.status;
//   if (!canTransition(RETURN_TRANSITIONS, currentStatus, to)) {
//     throw new ApiRequestError(`Cannot move a return from ${currentStatus} to ${to}.`, "ILLEGAL_TRANSITION");
//   }

//   switch (to) {
//     case "Approved":
//       return http.post<Return>(`/returns/${id}/approve`);
//     case "Rejected":
//       return http.post<Return>(`/returns/${id}/reject`, { reason: extra?.reason });
//     case "PickedUp":
//       return http.post<Return>(`/returns/${id}/pickup`);
//     case "Received":
//       return http.post<Return>(`/returns/${id}/received`);
//     case "Inspected":
//       return http.post<Return>(`/returns/${id}/inspect`, { passed: extra?.passed, notes: extra?.notes });
//     case "Refunded":
//       return http.post<Return>(`/returns/${id}/refund`);
//     default:
//       throw new ApiRequestError(`Unsupported return transition to ${to}.`, "ILLEGAL_TRANSITION");
//   }
// }

// export async function listRefunds() {
//   return http.get<Refund[]>("/refunds");
// }

// export async function transitionRefund(id: string, to: RefundStatus) {
//   const current = await http.get<{ refund: Refund }>(`/refunds/${id}`);
//   const currentStatus = current.data.refund.status;
//   if (!canTransition(REFUND_TRANSITIONS, currentStatus, to)) {
//     throw new ApiRequestError(`Cannot move a refund from ${currentStatus} to ${to}.`, "ILLEGAL_TRANSITION");
//   }
//   return http.patch<Refund>(`/refunds/${id}/status`, { status: to });
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

// // AdminUser uses `isActive: boolean`, not a "active"/"suspended" status field.
// // There's also no dedicated "reactivate" endpoint — only POST /:id/deactivate
// // exists; reactivating goes through the generic PATCH /:id with { isActive: true }.
// export async function toggleAdminUserStatus(id: string) {
//   const current = await http.get<{ admin: AdminUser }>(`/users/${id}`);
//   const isActive = current.data.admin.isActive;
//   if (isActive) {
//     return http.post<AdminUser>(`/users/${id}/deactivate`);
//   }
//   return http.patch<AdminUser>(`/users/${id}`, { isActive: true });
// }

// // ASSUMPTION: GET /admin/audit-log — not spelled out in the contract table but
// // implied by Epic 5's "Audit log viewer" requirement.
// export async function listAuditLog() {
//   return http.get<{ id: string; actor: string; action: string; entity: string; entityId: string; createdAt: string }[]>("/audit-log");
// }

// export async function me(): Promise<{ user: AdminUser; role: Role }> {
//   const res = await http.get<{ user: AdminUser; role: Role }>("/auth/me");
//   return res.data;
// }

// export async function whoami(): Promise<{ user: AdminUser; role: Role }> {
//   const res = await http.get<{
//     admin: Record<string, unknown>;
//     role: Record<string, unknown>;
//     permissions: string[];
//   }>("/auth/whoami");

//   const admin = normalizeAdmin(res.data.admin, "");
//   const role: Role = {
//     id: String(pick(res.data.role, ["id", "_id"]) ?? admin.roleId),
//     name: String(pick(res.data.role, ["name"]) ?? ""),
//     description: "",
//     permissions: res.data.permissions as Permission[],
//     isSystem: undefined,
//   };

//   return { user: admin, role };
// }

// // ---------------------------------------------------------------------------
// // Static reference data (no backend round-trip needed)
// // ---------------------------------------------------------------------------

// const ALL_PERMISSIONS: Permission[] = [
//   "dashboard:read",
//   "product:read", "product:write", "category:write", "category:write",
//   "inventory:read", "inventory:write", "purchase:manage", "purchase:manage",
//   "order:read", "order:write", "order:read", "order:read",
//   "return:manage", "return:manage", "refund:manage", "refund:manage",
//   "customer:read", "coupon:manage", "coupon:manage", "content:manage", "content:manage",
//   "admin_user:manage", "admin_user:manage", "role:manage", "role:manage", "dashboard:read",
// ];

// export function allPermissions() {
//   return ALL_PERMISSIONS;
// }

// // ---------------------------------------------------------------------------
// // Shipping (Shiprocket)
// // ---------------------------------------------------------------------------

// export interface ServiceableCourier {
//   courierId: string;
//   courierName: string;
//   rate: number;
//   estimatedDeliveryDays: string;
//   codAvailable: boolean;
// }

// export async function getShippingCouriers(orderId: string) {
//   return http.get<{ couriers: ServiceableCourier[] }>(`/orders/${orderId}/shipping/couriers`);
// }

// export async function assignShippingCourier(orderId: string, courierId: string) {
//   return http.post<{ order: Order }>(`/orders/${orderId}/shipping/awb`, { courierId });
// }

// export async function scheduleShippingPickup(orderId: string) {
//   return http.post<{ order: Order }>(`/orders/${orderId}/shipping/pickup`);
// }

// export async function syncShippingTracking(orderId: string) {
//   return http.post<{ order: Order }>(`/orders/${orderId}/shipping/sync`);
// }

// // ---------------------------------------------------------------------------
// // Site settings (COD toggle)
// // ---------------------------------------------------------------------------

// export interface SiteSettings {
//   codEnabled: boolean;
// }

// export async function getSettings() {
//   const res = await http.get<{ settings: SiteSettings }>("/settings");
//   return res.data.settings;
// }

// export async function updateSettings(codEnabled: boolean) {
//   const res = await http.patch<{ settings: SiteSettings }>("/settings", { codEnabled });
//   return res.data.settings;
// }

// export type { Product, Category, InventoryRow, Supplier, Purchase, Order, Return, Refund, Customer, Coupon, Banner, HomepageSection, Payment, Role, AdminUser };

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
 
export async function listProducts(params: { page?: number; limit?: number; q?: string; status?: string; categoryId?: string } = {}) {
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
 
export async function createProduct(input: {
  name: string; sku: string; categoryId: string; basePrice: number; mrp: number; status: Product["status"]; images?: string[];
  variant?: NewProductVariantInput;
}) {
  return http.post<Product>("/products", input);
}
 
export async function updateProduct(id: string, patch: Partial<Pick<Product, "name" | "categoryId" | "basePrice" | "mrp" | "status" | "images">>) {
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
  attributes?: Record<string, string>;
  price?: number;
  mrp?: number;
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
// Static reference data (no backend round-trip needed)
// ---------------------------------------------------------------------------
 
const ALL_PERMISSIONS: Permission[] = [
  "dashboard:read",
  "product:read", "product:write", "category:write", "category:write",
  "inventory:read", "inventory:write", "purchase:manage", "purchase:manage",
  "order:read", "order:write", "order:read", "order:read",
  "return:manage", "return:manage", "refund:manage", "refund:manage",
  "customer:read", "coupon:manage", "coupon:manage", "content:manage", "content:manage",
  "admin_user:manage", "admin_user:manage", "role:manage", "role:manage", "dashboard:read",
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
 
export type { Product, Category, InventoryRow, Supplier, Purchase, Order, Return, Refund, Customer, Coupon, Banner, HomepageSection, Payment, Role, AdminUser };




