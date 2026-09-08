import bcrypt from 'bcryptjs';
import { AdminUser, IAdminUser } from '../models/AdminUser.model';
import { AppError } from '../utils/AppError';
import { signAdminAccessToken } from '../utils/tokens';

export async function loginAdmin(email: string, password: string): Promise<{ admin: IAdminUser; accessToken: string }> {
  const admin = await AdminUser.findOne({ email }).select('+passwordHash');
  if (!admin || !admin.isActive) {
    throw AppError.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
  }

  const isValid = await bcrypt.compare(password, admin.passwordHash);
  if (!isValid) {
    throw AppError.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
  }

  admin.lastLoginAt = new Date();
  await admin.save();

  const accessToken = signAdminAccessToken(admin._id.toString(), admin.roleId.toString());
  return { admin, accessToken };
}
