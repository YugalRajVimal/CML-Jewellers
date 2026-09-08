import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
// import { env } from '../config/env';
// import { logger } from '@/logger';
// import { Permission } from '../models/Permission.model';
import { Role } from '@/models/Role.model';
import { AdminUser } from '@/models/AdminUser.model';
// import { ALL_PERMISSIONS, BASE_ROLES } from '../constants/permissions';
import { connectDB } from '@/config/db';
import { env } from '@/config/env';
import { logger } from './logger';
import { Permission } from '@/models/Permission.model';
import { ALL_PERMISSIONS,BASE_ROLES } from '@/constants/permissions';

async function seedPermissions(): Promise<Map<string, mongoose.Types.ObjectId>> {
  const map = new Map<string, mongoose.Types.ObjectId>();

  for (const key of ALL_PERMISSIONS) {
    const doc = await Permission.findOneAndUpdate(
      { key },
      { key },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    map.set(key, doc._id);
  }

  logger.info(`Seeded ${map.size} permissions`);
  return map;
}

async function seedRoles(permissionIds: Map<string, mongoose.Types.ObjectId>): Promise<Map<string, mongoose.Types.ObjectId>> {
  const map = new Map<string, mongoose.Types.ObjectId>();

  for (const roleDef of BASE_ROLES) {
    const permissionObjectIds = roleDef.permissions.map((p) => permissionIds.get(p)).filter(Boolean);

    const doc = await Role.findOneAndUpdate(
      { name: roleDef.name },
      {
        name: roleDef.name,
        description: roleDef.description,
        permissions: permissionObjectIds,
        isSystem: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    map.set(roleDef.name, doc._id);
  }

  logger.info(`Seeded ${map.size} base roles`);
  return map;
}

async function seedSuperAdmin(roleIds: Map<string, mongoose.Types.ObjectId>): Promise<void> {
  const superAdminRoleId = roleIds.get('Super Admin');
  if (!superAdminRoleId) {
    throw new Error('Super Admin role was not seeded correctly');
  }

  const existing = await AdminUser.findOne({ email: env.superAdmin.email });
  if (existing) {
    logger.info(`Super Admin already exists: ${env.superAdmin.email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(env.superAdmin.password, 12);

  await AdminUser.create({
    name: 'Super Admin',
    email: env.superAdmin.email,
    passwordHash,
    roleId: superAdminRoleId,
    isActive: true,
  });

  logger.info(`Super Admin created: ${env.superAdmin.email} (change the default password immediately)`);
}

async function run(): Promise<void> {
  await connectDB();

  const permissionIds = await seedPermissions();
  const roleIds = await seedRoles(permissionIds);
  await seedSuperAdmin(roleIds);

  logger.info('Seeding complete.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  logger.error('Seeding failed', err);
  process.exit(1);
});
