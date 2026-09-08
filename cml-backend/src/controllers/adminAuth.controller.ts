import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import * as adminAuthService from '../services/adminAuth.service';
import { AdminUser } from '../models/AdminUser.model';
import { Role } from '../models/Role.model';

export const adminLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { admin, accessToken } = await adminAuthService.loginAdmin(email, password);

  sendSuccess(res, {
    message: 'Login successful',
    data: {
      admin: { id: admin._id, name: admin.name, email: admin.email, roleId: admin.roleId },
      accessToken,
    },
  });
});

export const adminLogout = asyncHandler(async (_req: Request, res: Response) => {
  // Admin tokens are stateless short-lived JWTs; client discards the token.
  sendSuccess(res, { message: 'Logged out successfully' });
});

export const whoami = asyncHandler(async (req: Request, res: Response) => {
  const adminUser = await AdminUser.findById(req.admin!.sub);
  if (!adminUser) throw AppError.notFound('Admin user not found');

  const role = await Role.findById(adminUser.roleId).populate('permissions');

  sendSuccess(res, {
    data: {
      admin: { id: adminUser._id, name: adminUser.name, email: adminUser.email },
      role: { id: role?._id, name: role?.name },
      permissions: req.admin!.permissions,
    },
  });
});
