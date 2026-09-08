import 'express';

export interface CustomerJwtPayload {
  sub: string; // userId
  aud: 'customer';
}

export interface AdminJwtPayload {
  sub: string; // adminUserId
  aud: 'admin';
  roleId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: CustomerJwtPayload;
      admin?: AdminJwtPayload & { permissions?: string[] };
      rawBody?: string;
    }
  }
}
