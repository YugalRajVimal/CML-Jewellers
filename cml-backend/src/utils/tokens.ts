import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { CustomerJwtPayload, AdminJwtPayload } from '../types/express';

export function signCustomerAccessToken(userId: string): string {
  const payload: CustomerJwtPayload = { sub: userId, aud: 'customer' };
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  } as SignOptions);
}

export function signCustomerRefreshToken(userId: string): string {
  const payload: CustomerJwtPayload = { sub: userId, aud: 'customer' };
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  } as SignOptions);
}

export function verifyCustomerAccessToken(token: string): CustomerJwtPayload {
  return jwt.verify(token, env.jwt.accessSecret) as unknown as CustomerJwtPayload;
}

export function verifyCustomerRefreshToken(token: string): CustomerJwtPayload {
  return jwt.verify(token, env.jwt.refreshSecret) as unknown as CustomerJwtPayload;
}

export function signAdminAccessToken(adminUserId: string, roleId: string): string {
  const payload: AdminJwtPayload = { sub: adminUserId, aud: 'admin', roleId };
  return jwt.sign(payload, env.jwt.adminAccessSecret, {
    expiresIn: env.jwt.adminAccessExpiresIn,
  } as SignOptions);
}

export function verifyAdminAccessToken(token: string): AdminJwtPayload {
  return jwt.verify(token, env.jwt.adminAccessSecret) as unknown as AdminJwtPayload;
}
