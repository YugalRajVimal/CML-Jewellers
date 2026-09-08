import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { Purchase } from '../models/Purchase.model';
import * as purchaseService from '../services/purchase.service';

export const listPurchases = asyncHandler(async (req: Request, res: Response) => {
  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.supplierId) filter.supplierId = req.query.supplierId;

  const purchases = await Purchase.find(filter).sort({ createdAt: -1 });
  sendSuccess(res, { data: { purchases } });
});

export const getPurchase = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const purchase = await Purchase.findById(id);
  if (!purchase) throw AppError.notFound('Purchase order not found');
  sendSuccess(res, { data: { purchase } });
});

export const createPurchase = asyncHandler(async (req: Request, res: Response) => {
  const purchase = await purchaseService.createPurchase(req.body);
  sendSuccess(res, { message: 'Purchase order created', data: { purchase }, statusCode: 201 });
});

export const receivePurchase = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const purchase = await purchaseService.receivePurchase(id, req.body);
  sendSuccess(res, { message: 'Stock received', data: { purchase } });
});

export const cancelPurchase = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const purchase = await purchaseService.cancelPurchase(id);
  sendSuccess(res, { message: 'Purchase order cancelled', data: { purchase } });
});
