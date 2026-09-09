import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AuditLog } from '../models/AuditLog.model';
import { parsePagination, buildMeta } from '../utils/pagination';

export const listAuditLog = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);

  const [items, total] = await Promise.all([
    AuditLog.find({})
      .populate('adminUserId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AuditLog.countDocuments({}),
  ]);

  sendSuccess(res, { data: { logs: items }, meta: buildMeta(page, limit, total) });
});