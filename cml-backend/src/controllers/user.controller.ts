import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { User } from '../models/User.model';
import { Address, IAddress } from '../models/Address.model';

function serializeAddress(address: IAddress) {
  const obj = address.toJSON() as Record<string, unknown>;
  return { ...obj, postalCode: address.pincode }; // frontend reads postalCode; keep pincode too for back-compat
}

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.sub);
  if (!user) throw AppError.notFound('User not found');
  sendSuccess(res, { data: user }); // flattened — was { data: { user } }
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const updates: { name?: string; email?: string; phone?: string; emailVerified?: boolean; phoneVerified?: boolean } = {
    ...req.body,
  };

  const existing = await User.findById(req.user!.sub);
  if (!existing) throw AppError.notFound('User not found');

  // Changing the contact detail invalidates any prior verification of it.
  if (updates.email !== undefined && updates.email !== existing.email) {
    updates.emailVerified = false;
  }
  if (updates.phone !== undefined && updates.phone !== existing.phone) {
    updates.phoneVerified = false;
  }

  const user = await User.findByIdAndUpdate(req.user!.sub, updates, { new: true, runValidators: true });
  if (!user) throw AppError.notFound('User not found');
  sendSuccess(res, { message: 'Profile updated', data: user });
});

export const listAddresses = asyncHandler(async (req: Request, res: Response) => {
  const addresses = await Address.find({ userId: req.user!.sub }).sort({ isDefault: -1, createdAt: -1 });
  sendSuccess(res, { data: addresses.map(serializeAddress) }); // flattened bare array
});

export const createAddress = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;

  if (req.body.isDefault) {
    await Address.updateMany({ userId }, { isDefault: false });
  }

  const address = await Address.create({ ...req.body, userId });
  sendSuccess(res, { message: 'Address added', data: serializeAddress(address), statusCode: 201 });
});

export const updateAddress = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const { id } = req.params;

  const address = await Address.findOne({ _id: id, userId });
  if (!address) throw AppError.notFound('Address not found');

  if (req.body.isDefault) {
    await Address.updateMany({ userId, _id: { $ne: id } }, { isDefault: false });
  }

  Object.assign(address, req.body);
  await address.save();

  sendSuccess(res, { message: 'Address updated', data: serializeAddress(address) });
});

export const deleteAddress = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const { id } = req.params;

  const address = await Address.findOneAndDelete({ _id: id, userId });
  if (!address) throw AppError.notFound('Address not found');

  sendSuccess(res, { message: 'Address deleted' });
});