import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { Supplier } from '../models/Supplier.model';
import { Purchase } from '../models/Purchase.model';

export const listSuppliers = asyncHandler(async (_req: Request, res: Response) => {
  const suppliers = await Supplier.find().sort({ name: 1 });
  sendSuccess(res, { data: { suppliers } });
});

export const getSupplier = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const supplier = await Supplier.findById(id);
  if (!supplier) throw AppError.notFound('Supplier not found');
  sendSuccess(res, { data: { supplier } });
});

export const createSupplier = asyncHandler(async (req: Request, res: Response) => {
  const supplier = await Supplier.create(req.body);
  sendSuccess(res, { message: 'Supplier created', data: { supplier }, statusCode: 201 });
});

export const updateSupplier = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const supplier = await Supplier.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
  if (!supplier) throw AppError.notFound('Supplier not found');
  sendSuccess(res, { message: 'Supplier updated', data: { supplier } });
});

export const deleteSupplier = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const hasPurchases = await Purchase.exists({ supplierId: id });
  if (hasPurchases) {
    throw AppError.conflict('Cannot delete a supplier that has purchase orders', 'SUPPLIER_HAS_PURCHASES');
  }

  const supplier = await Supplier.findByIdAndDelete(id);
  if (!supplier) throw AppError.notFound('Supplier not found');
  sendSuccess(res, { message: 'Supplier deleted' });
});
