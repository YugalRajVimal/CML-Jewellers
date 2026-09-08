import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/AuditLog.model';
import { logger } from '../utils/logger';

const SENSITIVE_BODY_KEYS = ['password', 'passwordHash', 'newPassword', 'code'];

function redact(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;
  const clone: Record<string, unknown> = { ...(body as Record<string, unknown>) };
  for (const key of SENSITIVE_BODY_KEYS) {
    if (key in clone) clone[key] = '[REDACTED]';
  }
  return clone;
}

/**
 * Wraps an admin route group: on any non-GET request that completes with a
 * success status code, writes an AuditLog entry capturing who did what to which
 * resource. Attach after requireAdminAuth so req.admin is populated.
 */
export function auditLog(resource: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method === 'GET') {
      next();
      return;
    }

    res.on('finish', () => {
      if (res.statusCode >= 400) return; // only log successful mutations
      if (!req.admin?.sub) return; // no admin context (shouldn't happen post requireAdminAuth)

      const resourceId = req.params.id || req.params.productId || req.params.variantId || req.params.publicId;

      AuditLog.create({
        adminUserId: req.admin.sub,
        action: `${req.method.toLowerCase()}:${req.originalUrl.split('?')[0]}`,
        resource,
        resourceId,
        after: redact(req.body),
        ip: req.ip,
      }).catch((err) => logger.error('Failed to write audit log', err));
    });

    next();
  };
}
