/**
 * Canonical permission strings, format: "<resource>:<action>"
 * Extend freely in later EPICs — RBAC middleware only checks membership.
 */
export const PERMISSIONS = {
  PRODUCT_READ: 'product:read',
  PRODUCT_WRITE: 'product:write',
  CATEGORY_WRITE: 'category:write',
  INVENTORY_READ: 'inventory:read',
  INVENTORY_WRITE: 'inventory:write',
  ORDER_READ: 'order:read',
  ORDER_WRITE: 'order:write',
  RETURN_MANAGE: 'return:manage',
  REFUND_MANAGE: 'refund:manage',
  PURCHASE_MANAGE: 'purchase:manage',
  CUSTOMER_READ: 'customer:read',
  COUPON_MANAGE: 'coupon:manage',
  CONTENT_MANAGE: 'content:manage',
  ADMIN_USER_MANAGE: 'admin_user:manage',
  ROLE_MANAGE: 'role:manage',
  DASHBOARD_READ: 'dashboard:read',
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export type PermissionValue = (typeof PERMISSIONS)[PermissionKey];

export const ALL_PERMISSIONS: PermissionValue[] = Object.values(PERMISSIONS);

/** Base roles seeded in EPIC 1. Later EPICs may add more granular roles. */
export const BASE_ROLES: { name: string; description: string; permissions: PermissionValue[] }[] = [
  {
    name: 'Super Admin',
    description: 'Full unrestricted access',
    permissions: ALL_PERMISSIONS,
  },
  {
    name: 'Admin',
    description: 'General administrative access',
    permissions: ALL_PERMISSIONS.filter((p) => p !== PERMISSIONS.ADMIN_USER_MANAGE && p !== PERMISSIONS.ROLE_MANAGE),
  },
  {
    name: 'Inventory Manager',
    description: 'Manage stock, purchases, suppliers',
    permissions: [
      PERMISSIONS.PRODUCT_READ,
      PERMISSIONS.INVENTORY_READ,
      PERMISSIONS.INVENTORY_WRITE,
      PERMISSIONS.PURCHASE_MANAGE,
    ],
  },
  {
    name: 'Order Manager',
    description: 'Manage orders, returns, refunds',
    permissions: [
      PERMISSIONS.ORDER_READ,
      PERMISSIONS.ORDER_WRITE,
      PERMISSIONS.RETURN_MANAGE,
      PERMISSIONS.REFUND_MANAGE,
      PERMISSIONS.CUSTOMER_READ,
    ],
  },
  {
    name: 'Content Manager',
    description: 'Manage catalog content, banners, homepage',
    permissions: [PERMISSIONS.PRODUCT_READ, PERMISSIONS.PRODUCT_WRITE, PERMISSIONS.CATEGORY_WRITE, PERMISSIONS.CONTENT_MANAGE],
  },
];
