import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { Payment } from '../models/Payment.model';
import { parsePagination, buildMeta } from '../utils/pagination';

export const listPayments = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
  const { status, q } = req.query as { status?: string; q?: string };

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (q) filter.providerRefId = { $regex: q, $options: 'i' };

  const [items, total] = await Promise.all([
    Payment.find(filter)
      .populate('orderId', 'orderNumber total userId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments(filter),
  ]);

  sendSuccess(res, { data: { payments: items }, meta: buildMeta(page, limit, total) });
});