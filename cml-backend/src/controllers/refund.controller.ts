import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { Refund } from '../models/Refund.model';
import * as refundService from '../services/refund.service';

export const adminListRefunds = asyncHandler(async (req: Request, res: Response) => {
  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = req.query.status;

  const refunds = await Refund.find(filter).sort({ createdAt: -1 });
  sendSuccess(res, { data: { refunds } });
});

export const adminGetRefund = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const refund = await Refund.findById(id);
  if (!refund) throw AppError.notFound('Refund not found');
  sendSuccess(res, { data: { refund } });
});

export const adminUpdateRefundStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, failureReason } = req.body;
  const refund = await refundService.transitionRefund(id, status, failureReason);
  sendSuccess(res, { message: 'Refund status updated', data: { refund } });
});
