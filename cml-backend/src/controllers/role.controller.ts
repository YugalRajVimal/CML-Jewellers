import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { Role } from '../models/Role.model';
import { Permission } from '../models/Permission.model';
import { AdminUser } from '../models/AdminUser.model';
import { ALL_PERMISSIONS } from '../constants/permissions';

export const listPermissions = asyncHandler(async (_req: Request, res: Response) => {
  // Ensures the response always reflects the canonical permission set even if
  // the DB seed hasn't run for a newly added permission key.
  sendSuccess(res, { data: { permissions: ALL_PERMISSIONS } });
});

export const adminListRoles = asyncHandler(async (_req: Request, res: Response) => {
  const roles = await Role.find().populate('permissions', 'key').sort({ name: 1 });
  sendSuccess(res, { data: { roles } });
});

export const adminGetRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const role = await Role.findById(id).populate('permissions', 'key');
  if (!role) throw AppError.notFound('Role not found');
  sendSuccess(res, { data: { role } });
});

export const adminCreateRole = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, permissionKeys } = req.body;

  const existing = await Role.findOne({ name });
  if (existing) throw AppError.conflict('A role with this name already exists', 'ROLE_NAME_EXISTS');

  const permissionDocs = await Permission.find({ key: { $in: permissionKeys || [] } });
  const role = await Role.create({
    name,
    description,
    permissions: permissionDocs.map((p) => p._id),
    isSystem: false,
  });

  sendSuccess(res, { message: 'Role created', data: { role }, statusCode: 201 });
});

export const adminUpdateRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, permissionKeys } = req.body;

  const role = await Role.findById(id);
  if (!role) throw AppError.notFound('Role not found');

  if (role.isSystem) {
    throw AppError.conflict('Base system roles cannot be modified — create a new role instead', 'ROLE_IS_SYSTEM');
  }

  if (name) role.name = name;
  if (description !== undefined) role.description = description;
  if (permissionKeys) {
    const permissionDocs = await Permission.find({ key: { $in: permissionKeys } });
    role.permissions = permissionDocs.map((p) => p._id);
  }

  await role.save();
  sendSuccess(res, { message: 'Role updated', data: { role } });
});

export const adminDeleteRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const role = await Role.findById(id);
  if (!role) throw AppError.notFound('Role not found');

  if (role.isSystem) {
    throw AppError.conflict('Base system roles cannot be deleted', 'ROLE_IS_SYSTEM');
  }

  const inUse = await AdminUser.exists({ roleId: id });
  if (inUse) {
    throw AppError.conflict('Cannot delete a role that is assigned to admin users', 'ROLE_IN_USE');
  }

  await Role.findByIdAndDelete(id);
  sendSuccess(res, { message: 'Role deleted' });
});
