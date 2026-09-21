import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { AdminUser } from '../models/AdminUser.model';
import { Role } from '../models/Role.model';

// Name of the seeded, unrestricted base role (see BASE_ROLES in constants/permissions.ts).
const SUPER_ADMIN_ROLE_NAME = 'Super Admin';

/**
 * True when `adminId` is an active Super Admin and no OTHER active Super Admin
 * exists — i.e. deactivating or demoting them would leave nobody able to
 * manage admin users and roles (BUG-05).
 */
async function isLastActiveSuperAdmin(adminId: string): Promise<boolean> {
  const superRole = await Role.findOne({ name: SUPER_ADMIN_ROLE_NAME, isSystem: true }).select('_id');
  if (!superRole) return false;

  const target = await AdminUser.findById(adminId).select('roleId isActive');
  if (!target || !target.isActive || String(target.roleId) !== String(superRole._id)) return false;

  const otherActiveSuperAdmins = await AdminUser.countDocuments({
    _id: { $ne: adminId },
    roleId: superRole._id,
    isActive: true,
  });
  return otherActiveSuperAdmins === 0;
}

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

  const existing = await AdminUser.findById(id).select('roleId isActive');
  if (!existing) throw AppError.notFound('Admin user not found');

  if (roleId) {
    const role = await Role.findById(roleId);
    if (!role) throw AppError.badRequest('Role not found', 'ROLE_NOT_FOUND');
  }

  const isDemoting = roleId !== undefined && String(existing.roleId) !== String(roleId);
  const isDeactivating = isActive === false && existing.isActive;

  // An admin must not be able to lock themselves out or change their own
  // privileges through this endpoint (only the deactivate endpoint used to
  // check this) — BUG-05.
  if (req.admin?.sub === id) {
    if (isActive === false) {
      throw AppError.badRequest('You cannot deactivate your own account', 'CANNOT_DEACTIVATE_SELF');
    }
    if (isDemoting) {
      throw AppError.badRequest('You cannot change your own role', 'CANNOT_CHANGE_OWN_ROLE');
    }
  }

  if ((isDemoting || isDeactivating) && (await isLastActiveSuperAdmin(id))) {
    throw AppError.conflict(
      'At least one active Super Admin is required — assign another Super Admin first',
      'LAST_SUPER_ADMIN'
    );
  }

  const update: Record<string, unknown> = {};
  if (name !== undefined) update.name = name;
  if (roleId !== undefined) update.roleId = roleId;
  if (isActive !== undefined) update.isActive = isActive;

  const admin = await AdminUser.findByIdAndUpdate(id, update, { new: true, runValidators: true });
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

  if (await isLastActiveSuperAdmin(id)) {
    throw AppError.conflict(
      'At least one active Super Admin is required — assign another Super Admin first',
      'LAST_SUPER_ADMIN'
    );
  }

  const admin = await AdminUser.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!admin) throw AppError.notFound('Admin user not found');

  sendSuccess(res, { message: 'Admin user deactivated', data: { admin } });
});