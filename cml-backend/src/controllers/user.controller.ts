import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { User } from '../models/User.model';
import { Address } from '../models/Address.model';

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.sub);
  if (!user) throw AppError.notFound('User not found');
  sendSuccess(res, { data: { user } });
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const updates = req.body;
  const user = await User.findByIdAndUpdate(req.user!.sub, updates, { new: true, runValidators: true });
  if (!user) throw AppError.notFound('User not found');
  sendSuccess(res, { message: 'Profile updated', data: { user } });
});

export const listAddresses = asyncHandler(async (req: Request, res: Response) => {
  const addresses = await Address.find({ userId: req.user!.sub }).sort({ isDefault: -1, createdAt: -1 });
  sendSuccess(res, { data: { addresses } });
});

export const createAddress = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;

  if (req.body.isDefault) {
    await Address.updateMany({ userId }, { isDefault: false });
  }

  const address = await Address.create({ ...req.body, userId });
  sendSuccess(res, { message: 'Address added', data: { address }, statusCode: 201 });
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

  sendSuccess(res, { message: 'Address updated', data: { address } });
});

export const deleteAddress = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const { id } = req.params;

  const address = await Address.findOneAndDelete({ _id: id, userId });
  if (!address) throw AppError.notFound('Address not found');

  sendSuccess(res, { message: 'Address deleted' });
});
