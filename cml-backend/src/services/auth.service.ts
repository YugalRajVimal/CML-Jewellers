import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User.model';
import { AppError } from '../utils/AppError';
import { signCustomerAccessToken, signCustomerRefreshToken, verifyCustomerRefreshToken } from '../utils/tokens';
import { verifyOtp } from './otp.service';

interface RegisterInput {
  name: string;
  email?: string;
  phone?: string;
  password: string;
}

/**
 * Registration requires a prior successful OTP verification for the given
 * identifier (email or phone) under purpose "register".
 */
export async function registerUser(input: RegisterInput, otpCode?: string): Promise<IUser> {
  const identifier = input.email || input.phone;
  if (!identifier) {
    throw AppError.badRequest('Either email or phone is required');
  }

  const existing = await User.findOne(input.email ? { email: input.email } : { phone: input.phone });
  if (existing) {
    throw AppError.conflict('An account with this email/phone already exists', 'USER_EXISTS');
  }

  if (otpCode) {
    await verifyOtp(identifier, 'register', otpCode);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await User.create({
    name: input.name,
    email: input.email,
    phone: input.phone,
    passwordHash,
    emailVerified: Boolean(input.email && otpCode),
    phoneVerified: Boolean(input.phone && otpCode),
  });

  return user;
}

export async function loginUser(identifier: { email?: string; phone?: string }, password: string): Promise<IUser> {
  const user = await User.findOne(identifier.email ? { email: identifier.email } : { phone: identifier.phone }).select(
    '+passwordHash'
  );

  if (!user || !user.isActive) {
    throw AppError.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw AppError.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
  }

  return user;
}

export function issueTokenPair(userId: string): { accessToken: string; refreshToken: string } {
  return {
    accessToken: signCustomerAccessToken(userId),
    refreshToken: signCustomerRefreshToken(userId),
  };
}

export async function rotateRefreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  let payload;
  try {
    payload = verifyCustomerRefreshToken(refreshToken);
  } catch {
    throw AppError.unauthorized('Invalid or expired refresh token', 'REFRESH_TOKEN_INVALID');
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) {
    throw AppError.unauthorized('User not found or inactive', 'REFRESH_TOKEN_INVALID');
  }

  return issueTokenPair(user._id.toString());
}

export async function resetPassword(identifier: string, code: string, newPassword: string): Promise<void> {
  await verifyOtp(identifier, 'password_reset', code);

  const user = await User.findOne(identifier.includes('@') ? { email: identifier } : { phone: identifier });
  if (!user) {
    throw AppError.notFound('Account not found', 'USER_NOT_FOUND');
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();
}
