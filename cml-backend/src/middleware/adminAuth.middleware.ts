import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { verifyAdminAccessToken } from '../utils/tokens';
import { AdminUser } from '../models/AdminUser.model';
import { Role } from '../models/Role.model';
import { Permission } from '../models/Permission.model';

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim();
}

/**
 * Verifies the admin JWT, confirms the admin user is still active,
 * and attaches the resolved permission set to req.admin.
 */
export async function requireAdminAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = extractBearerToken(req);
  if (!token) {
    next(AppError.unauthorized('Missing admin access token'));
    return;
  }

  try {
    const payload = verifyAdminAccessToken(token);
    if (payload.aud !== 'admin') {
      next(AppError.unauthorized('Invalid token audience'));
      return;
    }

    const adminUser = await AdminUser.findById(payload.sub);
    if (!adminUser || !adminUser.isActive) {
      next(AppError.unauthorized('Admin account inactive or not found'));
      return;
    }

    const role = await Role.findById(adminUser.roleId).populate('permissions');
    const permissions = (role?.permissions as unknown as { key: string }[] | undefined)?.map((p) => p.key) || [];

    req.admin = { ...payload, permissions };
    next();
  } catch {
    next(AppError.unauthorized('Invalid or expired admin token', 'TOKEN_INVALID'));
  }
}

/** RBAC gate: requires ALL listed permissions to be present on req.admin.permissions. */
export function requirePermission(...permissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const granted = req.admin?.permissions || [];
    const missing = permissions.filter((p) => !granted.includes(p));
    if (missing.length > 0) {
      next(AppError.forbidden('Insufficient permissions', 'FORBIDDEN', { missing }));
      return;
    }
    next();
  };
}

/** RBAC gate: requires AT LEAST ONE of the listed permissions. */
export function requireAnyPermission(...permissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const granted = req.admin?.permissions || [];
    const hasAny = permissions.some((p) => granted.includes(p));
    if (!hasAny) {
      next(AppError.forbidden('Insufficient permissions', 'FORBIDDEN', { requiresAnyOf: permissions }));
      return;
    }
    next();
  };
}

// Re-exported so seed scripts / other modules can reference the Permission model consistently.
export { Permission };
