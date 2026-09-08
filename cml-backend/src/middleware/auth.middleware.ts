import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { verifyCustomerAccessToken } from '../utils/tokens';

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (!token) {
    next(AppError.unauthorized('Missing access token'));
    return;
  }

  try {
    const payload = verifyCustomerAccessToken(token);
    if (payload.aud !== 'customer') {
      next(AppError.unauthorized('Invalid token audience'));
      return;
    }
    req.user = payload;
    next();
  } catch {
    next(AppError.unauthorized('Invalid or expired access token', 'TOKEN_INVALID'));
  }
}

/** Attaches req.user if a valid token is present, but never rejects the request. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (!token) {
    next();
    return;
  }
  try {
    const payload = verifyCustomerAccessToken(token);
    if (payload.aud === 'customer') req.user = payload;
  } catch {
    // ignore invalid token in optional mode
  }
  next();
}
