// import {
//   AdminUser, AuditLogEntry, Banner, Category, Coupon, Customer, HomepageSection, InventoryRow,
//   InventoryTransaction, Order, Payment, Product, Purchase, Refund, Return, Role, Supplier,
// } from "./types";

// export const ROLES: Role[] = [
//   {
//     id: "role_super",
//     name: "Super Admin",
//     description: "Full access to every module, including RBAC and audit.",
//     isSystem: true,
//     permissions: [
//       "product:read", "product:write", "category:write", "category:write",
//       "inventory:read", "inventory:write", "purchase:manage", "purchase:manage",
//       "order:read", "order:write", "order:read", "order:read",
//       "return:manage", "return:manage", "refund:manage", "refund:manage",
//       "customer:read", "coupon:manage", "coupon:manage", "content:manage",
//       "content:manage", "admin_user:manage", "admin_user:manage", "role:manage",
//       "role:manage", "dashboard:read", "dashboard:read",
//     ],
//   },
//   {
//     id: "role_catalog",
//     name: "Catalog Manager",
//     description: "Manages products, categories and inventory levels.",
//     permissions: [
//       "dashboard:read", "product:read", "product:write",
//       "category:write", "category:write", "inventory:read", "inventory:write",
//     ],
//   },
//   {
//     id: "role_ops",
//     name: "Operations",
//     description: "Runs purchasing, order fulfilment and returns.",
//     permissions: [
//       "dashboard:read", "order:read", "order:write", "purchase:manage",
//       "purchase:manage", "inventory:read", "return:manage", "return:manage",
//       "refund:manage", "refund:manage", "order:read",
//     ],
//   },
//   {
//     id: "role_support",
//     name: "Customer Support",
//     description: "Read-only visibility into orders, payments and customers.",
//     permissions: [
//       "dashboard:read", "order:read", "order:read", "customer:read",
//       "return:manage", "coupon:manage",
//     ],
//   },
// ];

// export const ADMIN_USERS: AdminUser[] = [
//   { id: "au_1", name: "Meera Kapoor", email: "meera@cmljewellers.com", roleId: "role_super", status: "active", lastLoginAt: "2026-09-07T06:12:00Z", createdAt: "2025-01-10T00:00:00Z" },
//   { id: "au_2", name: "Rohan Iyer", email: "rohan@cmljewellers.com", roleId: "role_catalog", status: "active", lastLoginAt: "2026-09-06T15:40:00Z", createdAt: "2025-03-02T00:00:00Z" },
//   { id: "au_3", name: "Priya Nair", email: "priya@cmljewellers.com", roleId: "role_ops", status: "active", lastLoginAt: "2026-09-07T04:02:00Z", createdAt: "2025-04-18T00:00:00Z" },
//   { id: "au_4", name: "Dev Malhotra", email: "dev@cmljewellers.com", roleId: "role_support", status: "suspended", lastLoginAt: "2026-08-11T09:00:00Z", createdAt: "2025-06-30T00:00:00Z" },
// ];

// export const CATEGORIES: Category[] = [
//   { id: "cat_1", name: "Necklaces", slug: "necklaces", parentId: null, productCount: 42, isActive: true },
//   { id: "cat_2", name: "Bracelets", slug: "bracelets", parentId: null, productCount: 27, isActive: true },
//   { id: "cat_3", name: "Bangles", slug: "bangles", parentId: "cat_2", productCount: 11, isActive: true },
//   { id: "cat_4", name: "Earrings", slug: "earrings", parentId: null, productCount: 35, isActive: true },
//   { id: "cat_5", name: "Rings", slug: "rings", parentId: null, productCount: 19, isActive: true },
//   { id: "cat_6", name: "Bridal", slug: "bridal", parentId: null, productCount: 8, isActive: true },
//   { id: "cat_7", name: "Anklets", slug: "anklets", parentId: null, productCount: 6, isActive: false },
// ];

// function variant(sku: string, size: string, price: number, mrp: number, available: number, reserved = 0): Product["variants"][number] {
//   return { id: `v_${sku}`, sku, attributes: { size }, price, mrp, available, reserved };
// }

// export const PRODUCTS: Product[] = [
//   {
//     id: "p_1", name: "Padmini Gold Lotus Necklace", slug: "padmini-gold-lotus-necklace",
//     categoryId: "cat_1", subcategoryId: null, sku: "CML-NK-1001", basePrice: 84500, mrp: 92000,
//     attributes: { material: "Gold", metal: "22K", purity: "916", occasion: "Wedding" },
//     images: [], status: "active", isFeatured: true, ratingAvg: 4.8, createdAt: "2026-01-14T00:00:00Z",
//     variants: [variant("CML-NK-1001-S", "16in", 84500, 92000, 4), variant("CML-NK-1001-L", "18in", 89500, 97000, 2, 1)],
//   },
//   {
//     id: "p_2", name: "Anantha Diamond Bracelet", slug: "anantha-diamond-bracelet",
//     categoryId: "cat_2", subcategoryId: null, sku: "CML-BR-2004", basePrice: 46200, mrp: 51000,
//     attributes: { material: "Gold + Diamond", metal: "18K", purity: "750", occasion: "Everyday" },
//     images: [], status: "active", isFeatured: false, ratingAvg: 4.6, createdAt: "2026-02-02T00:00:00Z",
//     variants: [variant("CML-BR-2004-M", "M", 46200, 51000, 1)],
//   },
//   {
//     id: "p_3", name: "Kiran Temple Bangle Set", slug: "kiran-temple-bangle-set",
//     categoryId: "cat_3", subcategoryId: "cat_2", sku: "CML-BN-3012", basePrice: 61800, mrp: 66500,
//     attributes: { material: "Gold", metal: "22K", purity: "916", occasion: "Festive" },
//     images: [], status: "active", isFeatured: true, ratingAvg: 4.9, createdAt: "2026-03-19T00:00:00Z",
//     variants: [variant("CML-BN-3012-24", "2.4in", 61800, 66500, 0), variant("CML-BN-3012-26", "2.6in", 63200, 68000, 6)],
//   },
//   {
//     id: "p_4", name: "Meenal Ruby Drop Earrings", slug: "meenal-ruby-drop-earrings",
//     categoryId: "cat_4", subcategoryId: null, sku: "CML-ER-4021", basePrice: 28900, mrp: 31500,
//     attributes: { material: "Gold + Ruby", metal: "18K", purity: "750", occasion: "Party" },
//     images: [], status: "draft", isFeatured: false, ratingAvg: 0, createdAt: "2026-05-28T00:00:00Z",
//     variants: [variant("CML-ER-4021-1", "Std", 28900, 31500, 9)],
//   },
//   {
//     id: "p_5", name: "Suhaana Bridal Ring", slug: "suhaana-bridal-ring",
//     categoryId: "cat_5", subcategoryId: "cat_6", sku: "CML-RG-5033", basePrice: 112500, mrp: 121000,
//     attributes: { material: "Gold + Diamond", metal: "18K", purity: "750", occasion: "Wedding" },
//     images: [], status: "active", isFeatured: true, ratingAvg: 5.0, createdAt: "2026-04-11T00:00:00Z",
//     variants: [variant("CML-RG-5033-12", "12", 112500, 121000, 2), variant("CML-RG-5033-14", "14", 112500, 121000, 3)],
//   },
//   {
//     id: "p_6", name: "Ojasvi Everyday Chain", slug: "ojasvi-everyday-chain",
//     categoryId: "cat_1", subcategoryId: null, sku: "CML-NK-1088", basePrice: 32100, mrp: 34000,
//     attributes: { material: "Gold", metal: "22K", purity: "916", occasion: "Everyday" },
//     images: [], status: "active", isFeatured: false, ratingAvg: 4.4, createdAt: "2026-06-01T00:00:00Z",
//     variants: [variant("CML-NK-1088-18", "18in", 32100, 34000, 3)],
//   },
// ];

// export const INVENTORY: InventoryRow[] = PRODUCTS.flatMap((p) =>
//   p.variants.map((v) => ({
//     id: `inv_${v.sku}`,
//     variantId: v.id,
//     productName: p.name,
//     sku: v.sku,
//     available: v.available,
//     reserved: v.reserved,
//     sold: Math.max(2, Math.round(v.available * 1.4)),
//     damaged: v.available === 0 ? 1 : 0,
//     returned: 0,
//     lowStockThreshold: 3,
//   }))
// );

// export const INVENTORY_TXNS: InventoryTransaction[] = [
//   { id: "it_1", inventoryId: "inv_CML-BN-3012-24", sku: "CML-BN-3012-24", type: "sale", qty: -2, refId: "ORD-10045", createdAt: "2026-09-05T10:20:00Z" },
//   { id: "it_2", inventoryId: "inv_CML-BR-2004-M", sku: "CML-BR-2004-M", type: "adjustment", qty: -1, refId: "manual", createdAt: "2026-09-04T08:00:00Z" },
//   { id: "it_3", inventoryId: "inv_CML-NK-1001-L", sku: "CML-NK-1001-L", type: "purchase", qty: 3, refId: "PO-2031", createdAt: "2026-09-01T09:00:00Z" },
//   { id: "it_4", inventoryId: "inv_CML-RG-5033-12", sku: "CML-RG-5033-12", type: "return", qty: 1, refId: "RET-3081", createdAt: "2026-08-30T13:11:00Z" },
// ];

// export const SUPPLIERS: Supplier[] = [
//   { id: "sup_1", name: "Chennai Gold Refiners", contact: "+91 98765 43210", address: "Sowcarpet, Chennai" },
//   { id: "sup_2", name: "Surat Diamond Works", contact: "+91 91234 56780", address: "Varachha, Surat" },
// ];

// export const PURCHASES: Purchase[] = [
//   {
//     id: "po_1", supplierId: "sup_1", supplierName: "Chennai Gold Refiners", status: "PartiallyReceived",
//     items: [
//       { variantId: "v_CML-NK-1001-L", sku: "CML-NK-1001-L", orderedQty: 5, receivedQty: 3, cost: 78000 },
//       { variantId: "v_CML-NK-1088-18", sku: "CML-NK-1088-18", orderedQty: 4, receivedQty: 4, cost: 29500 },
//     ],
//     createdAt: "2026-08-25T00:00:00Z",
//   },
//   {
//     id: "po_2", supplierId: "sup_2", supplierName: "Surat Diamond Works", status: "Ordered",
//     items: [{ variantId: "v_CML-RG-5033-12", sku: "CML-RG-5033-12", orderedQty: 4, receivedQty: 0, cost: 98000 }],
//     createdAt: "2026-09-02T00:00:00Z",
//   },
// ];

// export const ORDERS: Order[] = [
//   {
//     id: "ord_1", orderNumber: "ORD-10045", userId: "u_1", customerName: "Anita Subramaniam",
//     items: [{ variantId: "v_CML-BN-3012-24", productName: "Kiran Temple Bangle Set", sku: "CML-BN-3012-24", qty: 2, price: 61800 }],
//     addressLine: "14 Lake View Rd, Chennai 600028", subtotal: 123600, discount: 3000, shipping: 0, tax: 6180,
//     total: 126780, status: "Shipped", paymentId: "pay_1", paymentStatus: "Success", createdAt: "2026-09-05T10:00:00Z",
//   },
//   {
//     id: "ord_2", orderNumber: "ORD-10046", userId: "u_2", customerName: "Karthik Rao",
//     items: [{ variantId: "v_CML-BR-2004-M", productName: "Anantha Diamond Bracelet", sku: "CML-BR-2004-M", qty: 1, price: 46200 }],
//     addressLine: "22 MG Road, Bengaluru 560001", subtotal: 46200, discount: 0, shipping: 150, tax: 2310,
//     total: 48660, status: "Pending", paymentId: "pay_2", paymentStatus: "Pending", createdAt: "2026-09-07T02:30:00Z",
//   },
//   {
//     id: "ord_3", orderNumber: "ORD-10047", userId: "u_3", customerName: "Fathima Begum",
//     items: [{ variantId: "v_CML-RG-5033-14", productName: "Suhaana Bridal Ring", sku: "CML-RG-5033-14", qty: 1, price: 112500 }],
//     addressLine: "9 Marine Drive, Kochi 682031", subtotal: 112500, discount: 5000, shipping: 0, tax: 5625,
//     total: 113125, status: "Delivered", paymentId: "pay_3", paymentStatus: "Success", createdAt: "2026-08-20T07:00:00Z",
//   },
//   {
//     id: "ord_4", orderNumber: "ORD-10048", userId: "u_4", customerName: "Vivek Menon",
//     items: [{ variantId: "v_CML-NK-1088-18", productName: "Ojasvi Everyday Chain", sku: "CML-NK-1088-18", qty: 1, price: 32100 }],
//     addressLine: "5 Residency Rd, Hyderabad 500034", subtotal: 32100, discount: 0, shipping: 0, tax: 1605,
//     total: 33705, status: "Confirmed", paymentId: "pay_4", paymentStatus: "Success", createdAt: "2026-09-06T11:15:00Z",
//   },
//   {
//     id: "ord_5", orderNumber: "ORD-10049", userId: "u_5", customerName: "Lakshmi Venkat",
//     items: [{ variantId: "v_CML-NK-1001-S", productName: "Padmini Gold Lotus Necklace", sku: "CML-NK-1001-S", qty: 1, price: 84500 }],
//     addressLine: "31 Anna Nagar, Madurai 625020", subtotal: 84500, discount: 2000, shipping: 0, tax: 4225,
//     total: 86725, status: "Cancelled", paymentId: "pay_5", paymentStatus: "Cancelled", createdAt: "2026-08-15T09:40:00Z",
//   },
//   {
//     id: "ord_6", orderNumber: "ORD-10050", userId: "u_1", customerName: "Anita Subramaniam",
//     items: [{ variantId: "v_CML-RG-5033-12", productName: "Suhaana Bridal Ring", sku: "CML-RG-5033-12", qty: 1, price: 112500 }],
//     addressLine: "14 Lake View Rd, Chennai 600028", subtotal: 112500, discount: 0, shipping: 0, tax: 5625,
//     total: 118125, status: "ReturnRequested", paymentId: "pay_6", paymentStatus: "Success", createdAt: "2026-08-02T09:40:00Z",
//   },
// ];

// export const RETURNS: Return[] = [
//   { id: "ret_1", orderId: "ord_6", orderNumber: "ORD-10050", items: [{ productName: "Suhaana Bridal Ring", qty: 1 }], reason: "Size doesn't fit", status: "Requested", createdAt: "2026-09-06T12:00:00Z" },
//   { id: "ret_2", orderId: "ord_3", orderNumber: "ORD-10047", items: [{ productName: "Suhaana Bridal Ring", qty: 1 }], reason: "Changed mind", status: "Refunded", createdAt: "2026-08-25T12:00:00Z" },
// ];

// export const REFUNDS: Refund[] = [
//   { id: "rf_1", paymentId: "pay_3", returnId: "ret_2", orderNumber: "ORD-10047", amount: 112500, status: "Completed", createdAt: "2026-08-27T12:00:00Z" },
// ];

// export const CUSTOMERS: Customer[] = [
//   { id: "u_1", name: "Anita Subramaniam", email: "anita.s@example.com", phone: "+91 98400 11122", ordersCount: 5, lifetimeValue: 412000, emailVerified: true, phoneVerified: true, createdAt: "2025-02-11T00:00:00Z" },
//   { id: "u_2", name: "Karthik Rao", email: "karthik.rao@example.com", phone: "+91 90000 22233", ordersCount: 1, lifetimeValue: 48660, emailVerified: true, phoneVerified: false, createdAt: "2026-09-01T00:00:00Z" },
//   { id: "u_3", name: "Fathima Begum", email: "fathima.b@example.com", phone: "+91 99887 33344", ordersCount: 3, lifetimeValue: 256000, emailVerified: true, phoneVerified: true, createdAt: "2025-11-19T00:00:00Z" },
//   { id: "u_4", name: "Vivek Menon", email: "vivek.menon@example.com", phone: "+91 93700 44455", ordersCount: 2, lifetimeValue: 61000, emailVerified: false, phoneVerified: true, createdAt: "2026-01-05T00:00:00Z" },
//   { id: "u_5", name: "Lakshmi Venkat", email: "lakshmi.v@example.com", phone: "+91 96000 55566", ordersCount: 4, lifetimeValue: 302000, emailVerified: true, phoneVerified: true, createdAt: "2025-07-22T00:00:00Z" },
// ];

// export const COUPONS: Coupon[] = [
//   { id: "cp_1", code: "WELCOME10", type: "percent", value: 10, minCartValue: 5000, expiry: "2026-12-31", usageLimit: 500, used: 214, isActive: true },
//   { id: "cp_2", code: "FEST2500", type: "flat", value: 2500, minCartValue: 30000, expiry: "2026-10-15", usageLimit: 200, used: 178, isActive: true },
//   { id: "cp_3", code: "SUMMEROFF", type: "percent", value: 15, minCartValue: 10000, expiry: "2026-06-30", usageLimit: 300, used: 300, isActive: false },
// ];

// export const BANNERS: Banner[] = [
//   { id: "bn_1", title: "Bridal collection — book a consult", ctaText: "Explore bridal", ctaUrl: "/collections/bridal", order: 1, isActive: true },
//   { id: "bn_2", title: "Festive gold, ready to ship", ctaText: "Shop festive", ctaUrl: "/collections/festive", order: 2, isActive: true },
//   { id: "bn_3", title: "Everyday fine jewellery under ₹35,000", ctaText: "View picks", ctaUrl: "/collections/everyday", order: 3, isActive: false },
// ];

// export const AUDIT_LOG: AuditLogEntry[] = [
//   { id: "al_1", actor: "Meera Kapoor", action: "updated role permissions", entity: "Role", entityId: "role_ops", createdAt: "2026-09-06T10:00:00Z" },
//   { id: "al_2", actor: "Priya Nair", action: "approved return", entity: "Return", entityId: "ret_2", createdAt: "2026-08-25T12:05:00Z" },
//   { id: "al_3", actor: "Rohan Iyer", action: "published product", entity: "Product", entityId: "p_3", createdAt: "2026-08-19T09:12:00Z" },
//   { id: "al_4", actor: "Priya Nair", action: "received purchase order", entity: "Purchase", entityId: "po_1", createdAt: "2026-09-01T09:05:00Z" },
// ];

// export const REVENUE_TREND = [
//   { label: "Mar", revenue: 1180000, orders: 142 },
//   { label: "Apr", revenue: 1340000, orders: 158 },
//   { label: "May", revenue: 1290000, orders: 149 },
//   { label: "Jun", revenue: 1510000, orders: 171 },
//   { label: "Jul", revenue: 1680000, orders: 188 },
//   { label: "Aug", revenue: 1750000, orders: 196 },
//   { label: "Sep", revenue: 620000, orders: 74 },
// ];

// export const PAYMENTS: Payment[] = ORDERS.map((o) => ({
//   id: o.paymentId,
//   orderId: o.id,
//   orderNumber: o.orderNumber,
//   provider: "cashfree",
//   providerRefId: `cf_${o.paymentId}_ref`,
//   amount: o.total,
//   status: o.paymentStatus,
//   verifiedAt: o.paymentStatus === "Success" ? o.createdAt : undefined,
//   createdAt: o.createdAt,
// }));

// export const HOMEPAGE_SECTIONS: HomepageSection[] = [
//   { id: "hs_1", type: "hero", title: "Hero — hand with bracelet, collections wordmark", order: 1, isActive: true },
//   { id: "hs_2", type: "category_strip", title: "Shop by category (scrolling circles)", order: 2, isActive: true },
//   { id: "hs_3", type: "promo_grid", title: "3-column editorial promo banners", order: 3, isActive: true },
//   { id: "hs_4", type: "testimonials", title: "Customer testimonials", order: 4, isActive: true },
//   { id: "hs_5", type: "newsletter", title: "Dotted world map + newsletter band", order: 5, isActive: false },
// ];


// NOTE: superseded by src/lib/api.ts, which now talks to the real backend
// (see src/lib/http.ts). This dataset is kept only as a reference for the
// shape of each collection and as an offline/demo fallback if you want one —
// nothing in the app imports it anymore.
import {
  AdminUser, AuditLogEntry, Banner, Category, Coupon, Customer, HomepageSection, InventoryRow,
  InventoryTransaction, Order, Payment, Product, Purchase, Refund, Return, Role, Supplier,
} from "./types";

export const ROLES: Role[] = [
  {
    id: "role_super",
    name: "Super Admin",
    description: "Full access to every module, including RBAC and audit.",
    isSystem: true,
    permissions: [
      "product:read", "product:write", "category:write", "category:write",
      "inventory:read", "inventory:write", "purchase:manage", "purchase:manage",
      "order:read", "order:write", "order:read", "order:read",
      "return:manage", "return:manage", "refund:manage", "refund:manage",
      "customer:read", "coupon:manage", "coupon:manage", "content:manage",
      "content:manage", "admin_user:manage", "admin_user:manage", "role:manage",
      "role:manage", "dashboard:read", "dashboard:read",
    ],
  },
  {
    id: "role_catalog",
    name: "Catalog Manager",
    description: "Manages products, categories and inventory levels.",
    permissions: [
      "dashboard:read", "product:read", "product:write",
      "category:write", "category:write", "inventory:read", "inventory:write",
    ],
  },
  {
    id: "role_ops",
    name: "Operations",
    description: "Runs purchasing, order fulfilment and returns.",
    permissions: [
      "dashboard:read", "order:read", "order:write", "purchase:manage",
      "purchase:manage", "inventory:read", "return:manage", "return:manage",
      "refund:manage", "refund:manage", "order:read",
    ],
  },
  {
    id: "role_support",
    name: "Customer Support",
    description: "Read-only visibility into orders, payments and customers.",
    permissions: [
      "dashboard:read", "order:read", "order:read", "customer:read",
      "return:manage", "coupon:manage",
    ],
  },
];

export const ADMIN_USERS: AdminUser[] = [
  { id: "au_1", name: "Meera Kapoor", email: "meera@cmljewellers.com", roleId: "role_super", status: "active", lastLoginAt: "2026-09-07T06:12:00Z", createdAt: "2025-01-10T00:00:00Z" },
  { id: "au_2", name: "Rohan Iyer", email: "rohan@cmljewellers.com", roleId: "role_catalog", status: "active", lastLoginAt: "2026-09-06T15:40:00Z", createdAt: "2025-03-02T00:00:00Z" },
  { id: "au_3", name: "Priya Nair", email: "priya@cmljewellers.com", roleId: "role_ops", status: "active", lastLoginAt: "2026-09-07T04:02:00Z", createdAt: "2025-04-18T00:00:00Z" },
  { id: "au_4", name: "Dev Malhotra", email: "dev@cmljewellers.com", roleId: "role_support", status: "suspended", lastLoginAt: "2026-08-11T09:00:00Z", createdAt: "2025-06-30T00:00:00Z" },
];

export const CATEGORIES: Category[] = [
  { id: "cat_1", name: "Necklaces", slug: "necklaces", parentId: null, productCount: 42, isActive: true },
  { id: "cat_2", name: "Bracelets", slug: "bracelets", parentId: null, productCount: 27, isActive: true },
  { id: "cat_3", name: "Bangles", slug: "bangles", parentId: "cat_2", productCount: 11, isActive: true },
  { id: "cat_4", name: "Earrings", slug: "earrings", parentId: null, productCount: 35, isActive: true },
  { id: "cat_5", name: "Rings", slug: "rings", parentId: null, productCount: 19, isActive: true },
  { id: "cat_6", name: "Bridal", slug: "bridal", parentId: null, productCount: 8, isActive: true },
  { id: "cat_7", name: "Anklets", slug: "anklets", parentId: null, productCount: 6, isActive: false },
];

function variant(sku: string, size: string, price: number, mrp: number, available: number, reserved = 0): Product["variants"][number] {
  return { id: `v_${sku}`, sku, attributes: { size }, price, mrp, available, reserved };
}

export const PRODUCTS: Product[] = [
  {
    id: "p_1",
    name: "Padmini Gold Lotus Necklace",
    slug: "padmini-gold-lotus-necklace",
    categoryId: "cat_1",
    subcategoryId: null,
    category_id: "cat_1",
    sku: "CML-NK-1001",
    basePrice: 84500,
    mrp: 92000,
    attributes: { material: "Gold", metal: "22K", purity: "916", occasion: "Wedding" },
    images: [],
    status: "active",
    isFeatured: true,
    isNewArrival: false,
    ratingAvg: 4.8,
    description: "A stunning gold necklace inspired by lotus motifs, perfect for weddings or grand occasions.",
    createdAt: "2026-01-14T00:00:00Z",
    variants: [
      variant("CML-NK-1001-S", "16in", 84500, 92000, 4),
      variant("CML-NK-1001-L", "18in", 89500, 97000, 2, 1),
    ],
  },
  {
    id: "p_2",
    name: "Anantha Diamond Bracelet",
    slug: "anantha-diamond-bracelet",
    categoryId: "cat_2",
    subcategoryId: null,
    category_id: "cat_2",
    sku: "CML-BR-2004",
    basePrice: 46200,
    mrp: 51000,
    attributes: { material: "Gold + Diamond", metal: "18K", purity: "750", occasion: "Everyday" },
    images: [],
    status: "active",
    isFeatured: false,
    isNewArrival: true,
    ratingAvg: 4.6,
    description: "A refined diamond-studded bracelet ideal for everyday elegance and understated sparkle.",
    createdAt: "2026-02-02T00:00:00Z",
    variants: [
      variant("CML-BR-2004-M", "M", 46200, 51000, 1),
    ],
  },
  {
    id: "p_3",
    name: "Kiran Temple Bangle Set",
    slug: "kiran-temple-bangle-set",
    categoryId: "cat_3",
    subcategoryId: "cat_2",
    category_id: "cat_3",
    sku: "CML-BN-3012",
    basePrice: 61800,
    mrp: 66500,
    attributes: { material: "Gold", metal: "22K", purity: "916", occasion: "Festive" },
    images: [],
    status: "active",
    isFeatured: true,
    isNewArrival: true,
    ratingAvg: 4.9,
    description: "Traditional gold bangle set with temple designs, crafted for festive celebrations.",
    createdAt: "2026-03-19T00:00:00Z",
    variants: [
      variant("CML-BN-3012-24", "2.4in", 61800, 66500, 0),
      variant("CML-BN-3012-26", "2.6in", 63200, 68000, 6),
    ],
  },
  {
    id: "p_4",
    name: "Meenal Ruby Drop Earrings",
    slug: "meenal-ruby-drop-earrings",
    categoryId: "cat_4",
    subcategoryId: null,
    category_id: "cat_4",
    sku: "CML-ER-4021",
    basePrice: 28900,
    mrp: 31500,
    attributes: { material: "Gold + Ruby", metal: "18K", purity: "750", occasion: "Party" },
    images: [],
    status: "draft",
    isFeatured: false,
    isNewArrival: false,
    ratingAvg: 0,
    description: "Delicate ruby drop earrings set in gold—an ideal choice for party wear.",
    createdAt: "2026-05-28T00:00:00Z",
    variants: [
      variant("CML-ER-4021-1", "Std", 28900, 31500, 9),
    ],
  },
  {
    id: "p_5",
    name: "Suhaana Bridal Ring",
    slug: "suhaana-bridal-ring",
    categoryId: "cat_5",
    subcategoryId: "cat_6",
    category_id: "cat_5",
    sku: "CML-RG-5033",
    basePrice: 112500,
    mrp: 121000,
    attributes: { material: "Gold + Diamond", metal: "18K", purity: "750", occasion: "Wedding" },
    images: [],
    status: "active",
    isFeatured: true,
    isNewArrival: false,
    ratingAvg: 5.0,
    description: "An exclusive bridal ring with diamonds set in 18K gold to make your big day unforgettable.",
    createdAt: "2026-04-11T00:00:00Z",
    variants: [
      variant("CML-RG-5033-12", "12", 112500, 121000, 2),
      variant("CML-RG-5033-14", "14", 112500, 121000, 3),
    ],
  },
  {
    id: "p_6",
    name: "Ojasvi Everyday Chain",
    slug: "ojasvi-everyday-chain",
    categoryId: "cat_1",
    subcategoryId: null,
    category_id: "cat_1",
    sku: "CML-NK-1088",
    basePrice: 32100,
    mrp: 34000,
    attributes: { material: "Gold", metal: "22K", purity: "916", occasion: "Everyday" },
    images: [],
    status: "active",
    isFeatured: false,
    isNewArrival: true,
    ratingAvg: 4.4,
    description: "A classic gold chain, versatile for daily wear and perfect as a gift.",
    createdAt: "2026-06-01T00:00:00Z",
    variants: [
      variant("CML-NK-1088-18", "18in", 32100, 34000, 3),
    ],
  },
];

export const INVENTORY: InventoryRow[] = PRODUCTS.flatMap((p) =>
  p.variants.map((v) => ({
    id: `inv_${v.sku}`,
    variantId: v.id,
    productName: p.name,
    sku: v.sku,
    available: v.available,
    reserved: v.reserved,
    sold: Math.max(2, Math.round(v.available * 1.4)),
    damaged: v.available === 0 ? 1 : 0,
    returned: 0,
    lowStockThreshold: 3,
  }))
);

export const INVENTORY_TXNS: InventoryTransaction[] = [
  { id: "it_1", inventoryId: "inv_CML-BN-3012-24", sku: "CML-BN-3012-24", type: "sale", qty: -2, refId: "ORD-10045", createdAt: "2026-09-05T10:20:00Z" },
  { id: "it_2", inventoryId: "inv_CML-BR-2004-M", sku: "CML-BR-2004-M", type: "adjustment", qty: -1, refId: "manual", createdAt: "2026-09-04T08:00:00Z" },
  { id: "it_3", inventoryId: "inv_CML-NK-1001-L", sku: "CML-NK-1001-L", type: "purchase", qty: 3, refId: "PO-2031", createdAt: "2026-09-01T09:00:00Z" },
  { id: "it_4", inventoryId: "inv_CML-RG-5033-12", sku: "CML-RG-5033-12", type: "return", qty: 1, refId: "RET-3081", createdAt: "2026-08-30T13:11:00Z" },
];

export const SUPPLIERS: Supplier[] = [
  { id: "sup_1", name: "Chennai Gold Refiners", contact: "+91 98765 43210", address: "Sowcarpet, Chennai" },
  { id: "sup_2", name: "Surat Diamond Works", contact: "+91 91234 56780", address: "Varachha, Surat" },
];

export const PURCHASES: Purchase[] = [
  {
    id: "po_1", supplierId: "sup_1", supplierName: "Chennai Gold Refiners", status: "PartiallyReceived",
    items: [
      { variantId: "v_CML-NK-1001-L", sku: "CML-NK-1001-L", orderedQty: 5, receivedQty: 3, cost: 78000 },
      { variantId: "v_CML-NK-1088-18", sku: "CML-NK-1088-18", orderedQty: 4, receivedQty: 4, cost: 29500 },
    ],
    createdAt: "2026-08-25T00:00:00Z",
  },
  {
    id: "po_2", supplierId: "sup_2", supplierName: "Surat Diamond Works", status: "Ordered",
    items: [{ variantId: "v_CML-RG-5033-12", sku: "CML-RG-5033-12", orderedQty: 4, receivedQty: 0, cost: 98000 }],
    createdAt: "2026-09-02T00:00:00Z",
  },
];

export const ORDERS: Order[] = [
  {
    id: "ord_1", orderNumber: "ORD-10045", userId: "u_1", customerName: "Anita Subramaniam",
    items: [{ variantId: "v_CML-BN-3012-24", productName: "Kiran Temple Bangle Set", sku: "CML-BN-3012-24", qty: 2, price: 61800 }],
    addressLine: "14 Lake View Rd, Chennai 600028", subtotal: 123600, discount: 3000, shipping: 0, tax: 6180,
    total: 126780, status: "Shipped", paymentId: "pay_1", paymentStatus: "Success", createdAt: "2026-09-05T10:00:00Z",
  },
  {
    id: "ord_2", orderNumber: "ORD-10046", userId: "u_2", customerName: "Karthik Rao",
    items: [{ variantId: "v_CML-BR-2004-M", productName: "Anantha Diamond Bracelet", sku: "CML-BR-2004-M", qty: 1, price: 46200 }],
    addressLine: "22 MG Road, Bengaluru 560001", subtotal: 46200, discount: 0, shipping: 150, tax: 2310,
    total: 48660, status: "Pending", paymentId: "pay_2", paymentStatus: "Pending", createdAt: "2026-09-07T02:30:00Z",
  },
  {
    id: "ord_3", orderNumber: "ORD-10047", userId: "u_3", customerName: "Fathima Begum",
    items: [{ variantId: "v_CML-RG-5033-14", productName: "Suhaana Bridal Ring", sku: "CML-RG-5033-14", qty: 1, price: 112500 }],
    addressLine: "9 Marine Drive, Kochi 682031", subtotal: 112500, discount: 5000, shipping: 0, tax: 5625,
    total: 113125, status: "Delivered", paymentId: "pay_3", paymentStatus: "Success", createdAt: "2026-08-20T07:00:00Z",
  },
  {
    id: "ord_4", orderNumber: "ORD-10048", userId: "u_4", customerName: "Vivek Menon",
    items: [{ variantId: "v_CML-NK-1088-18", productName: "Ojasvi Everyday Chain", sku: "CML-NK-1088-18", qty: 1, price: 32100 }],
    addressLine: "5 Residency Rd, Hyderabad 500034", subtotal: 32100, discount: 0, shipping: 0, tax: 1605,
    total: 33705, status: "Confirmed", paymentId: "pay_4", paymentStatus: "Success", createdAt: "2026-09-06T11:15:00Z",
  },
  {
    id: "ord_5", orderNumber: "ORD-10049", userId: "u_5", customerName: "Lakshmi Venkat",
    items: [{ variantId: "v_CML-NK-1001-S", productName: "Padmini Gold Lotus Necklace", sku: "CML-NK-1001-S", qty: 1, price: 84500 }],
    addressLine: "31 Anna Nagar, Madurai 625020", subtotal: 84500, discount: 2000, shipping: 0, tax: 4225,
    total: 86725, status: "Cancelled", paymentId: "pay_5", paymentStatus: "Cancelled", createdAt: "2026-08-15T09:40:00Z",
  },
  {
    id: "ord_6", orderNumber: "ORD-10050", userId: "u_1", customerName: "Anita Subramaniam",
    items: [{ variantId: "v_CML-RG-5033-12", productName: "Suhaana Bridal Ring", sku: "CML-RG-5033-12", qty: 1, price: 112500 }],
    addressLine: "14 Lake View Rd, Chennai 600028", subtotal: 112500, discount: 0, shipping: 0, tax: 5625,
    total: 118125, status: "ReturnRequested", paymentId: "pay_6", paymentStatus: "Success", createdAt: "2026-08-02T09:40:00Z",
  },
];

export const RETURNS: Return[] = [
  { id: "ret_1", orderId: "ord_6", orderNumber: "ORD-10050", items: [{ productName: "Suhaana Bridal Ring", qty: 1 }], reason: "Size doesn't fit", status: "Requested", createdAt: "2026-09-06T12:00:00Z" },
  { id: "ret_2", orderId: "ord_3", orderNumber: "ORD-10047", items: [{ productName: "Suhaana Bridal Ring", qty: 1 }], reason: "Changed mind", status: "Refunded", createdAt: "2026-08-25T12:00:00Z" },
];

export const REFUNDS: Refund[] = [
  { id: "rf_1", paymentId: "pay_3", returnId: "ret_2", orderNumber: "ORD-10047", amount: 112500, status: "Completed", createdAt: "2026-08-27T12:00:00Z" },
];

export const CUSTOMERS: Customer[] = [
  { id: "u_1", name: "Anita Subramaniam", email: "anita.s@example.com", phone: "+91 98400 11122", ordersCount: 5, lifetimeValue: 412000, emailVerified: true, phoneVerified: true, createdAt: "2025-02-11T00:00:00Z" },
  { id: "u_2", name: "Karthik Rao", email: "karthik.rao@example.com", phone: "+91 90000 22233", ordersCount: 1, lifetimeValue: 48660, emailVerified: true, phoneVerified: false, createdAt: "2026-09-01T00:00:00Z" },
  { id: "u_3", name: "Fathima Begum", email: "fathima.b@example.com", phone: "+91 99887 33344", ordersCount: 3, lifetimeValue: 256000, emailVerified: true, phoneVerified: true, createdAt: "2025-11-19T00:00:00Z" },
  { id: "u_4", name: "Vivek Menon", email: "vivek.menon@example.com", phone: "+91 93700 44455", ordersCount: 2, lifetimeValue: 61000, emailVerified: false, phoneVerified: true, createdAt: "2026-01-05T00:00:00Z" },
  { id: "u_5", name: "Lakshmi Venkat", email: "lakshmi.v@example.com", phone: "+91 96000 55566", ordersCount: 4, lifetimeValue: 302000, emailVerified: true, phoneVerified: true, createdAt: "2025-07-22T00:00:00Z" },
];

export const COUPONS: Coupon[] = [
  { id: "cp_1", code: "WELCOME10", type: "percent", value: 10, minCartValue: 5000, expiry: "2026-12-31", usageLimit: 500, used: 214, isActive: true },
  { id: "cp_2", code: "FEST2500", type: "flat", value: 2500, minCartValue: 30000, expiry: "2026-10-15", usageLimit: 200, used: 178, isActive: true },
  { id: "cp_3", code: "SUMMEROFF", type: "percent", value: 15, minCartValue: 10000, expiry: "2026-06-30", usageLimit: 300, used: 300, isActive: false },
];

export const BANNERS: Banner[] = [
  { id: "bn_1", title: "Bridal collection — book a consult", ctaText: "Explore bridal", ctaUrl: "/collections/bridal", order: 1, isActive: true },
  { id: "bn_2", title: "Festive gold, ready to ship", ctaText: "Shop festive", ctaUrl: "/collections/festive", order: 2, isActive: true },
  { id: "bn_3", title: "Everyday fine jewellery under ₹35,000", ctaText: "View picks", ctaUrl: "/collections/everyday", order: 3, isActive: false },
];

export const AUDIT_LOG: AuditLogEntry[] = [
  { id: "al_1", actor: "Meera Kapoor", action: "updated role permissions", entity: "Role", entityId: "role_ops", createdAt: "2026-09-06T10:00:00Z" },
  { id: "al_2", actor: "Priya Nair", action: "approved return", entity: "Return", entityId: "ret_2", createdAt: "2026-08-25T12:05:00Z" },
  { id: "al_3", actor: "Rohan Iyer", action: "published product", entity: "Product", entityId: "p_3", createdAt: "2026-08-19T09:12:00Z" },
  { id: "al_4", actor: "Priya Nair", action: "received purchase order", entity: "Purchase", entityId: "po_1", createdAt: "2026-09-01T09:05:00Z" },
];

export const REVENUE_TREND = [
  { label: "Mar", revenue: 1180000, orders: 142 },
  { label: "Apr", revenue: 1340000, orders: 158 },
  { label: "May", revenue: 1290000, orders: 149 },
  { label: "Jun", revenue: 1510000, orders: 171 },
  { label: "Jul", revenue: 1680000, orders: 188 },
  { label: "Aug", revenue: 1750000, orders: 196 },
  { label: "Sep", revenue: 620000, orders: 74 },
];

export const PAYMENTS: Payment[] = ORDERS.map((o) => ({
  id: o.paymentId,
  orderId: o.id,
  orderNumber: o.orderNumber,
  provider: "cashfree",
  providerRefId: `cf_${o.paymentId}_ref`,
  amount: o.total,
  status: o.paymentStatus,
  verifiedAt: o.paymentStatus === "Success" ? o.createdAt : undefined,
  createdAt: o.createdAt,
}));

export const HOMEPAGE_SECTIONS: HomepageSection[] = [
  { id: "hs_1", type: "hero", title: "Hero — hand with bracelet, collections wordmark", order: 1, isActive: true },
  { id: "hs_2", type: "category_strip", title: "Shop by category (scrolling circles)", order: 2, isActive: true },
  { id: "hs_3", type: "promo_grid", title: "3-column editorial promo banners", order: 3, isActive: true },
  { id: "hs_4", type: "testimonials", title: "Customer testimonials", order: 4, isActive: true },
  { id: "hs_5", type: "newsletter", title: "Dotted world map + newsletter band", order: 5, isActive: false },
];