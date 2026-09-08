import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { AdminUser } from '../models/AdminUser.model';
import { Role } from '../models/Role.model';

export const adminListAdminUsers = asyncHandler(async (_req: Request, res: Response) => {
  const admins = await AdminUser.find().populate('roleId', 'name').sort({ createdAt: -1 });
  sendSuccess(res, { data: { admins } });
});

export const adminGetAdminUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const admin = await AdminUser.findById(id).populate('roleId', 'name');
  if (!admin) throw AppError.notFound('Admin user not found');
  sendSuccess(res, { data: { admin } });
});

export const adminCreateAdminUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, roleId } = req.body;

  const existing = await AdminUser.findOne({ email });
  if (existing) throw AppError.conflict('An admin with this email already exists', 'ADMIN_EMAIL_EXISTS');

  const role = await Role.findById(roleId);
  if (!role) throw AppError.badRequest('Role not found', 'ROLE_NOT_FOUND');

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await AdminUser.create({ name, email, passwordHash, roleId });

  sendSuccess(res, {
    message: 'Admin user created',
    data: { admin: { id: admin._id, name: admin.name, email: admin.email, roleId: admin.roleId } },
    statusCode: 201,
  });
});

export const adminUpdateAdminUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, roleId, isActive } = req.body;

  if (roleId) {
    const role = await Role.findById(roleId);
    if (!role) throw AppError.badRequest('Role not found', 'ROLE_NOT_FOUND');
  }

  const admin = await AdminUser.findByIdAndUpdate(id, { name, roleId, isActive }, { new: true, runValidators: true });
  if (!admin) throw AppError.notFound('Admin user not found');

  sendSuccess(res, { message: 'Admin user updated', data: { admin } });
});

export const adminResetAdminUserPassword = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  const admin = await AdminUser.findById(id);
  if (!admin) throw AppError.notFound('Admin user not found');

  admin.passwordHash = await bcrypt.hash(newPassword, 12);
  await admin.save();

  sendSuccess(res, { message: 'Admin password reset' });
});

export const adminDeactivateAdminUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (req.admin?.sub === id) {
    throw AppError.badRequest('You cannot deactivate your own account', 'CANNOT_DEACTIVATE_SELF');
  }

  const admin = await AdminUser.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!admin) throw AppError.notFound('Admin user not found');

  sendSuccess(res, { message: 'Admin user deactivated', data: { admin } });
});
