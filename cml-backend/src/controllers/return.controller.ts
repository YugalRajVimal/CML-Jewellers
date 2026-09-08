import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { Return } from '../models/Return.model';
import * as returnService from '../services/return.service';

// ---------- Customer ----------

export const createReturn = asyncHandler(async (req: Request, res: Response) => {
  const returnDoc = await returnService.requestReturn(req.user!.sub, req.body);
  sendSuccess(res, { message: 'Return requested', data: { return: returnDoc }, statusCode: 201 });
});

export const getMyReturn = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const returnDoc = await Return.findOne({ _id: id, userId: req.user!.sub });
  if (!returnDoc) throw AppError.notFound('Return not found');
  sendSuccess(res, { data: { return: returnDoc } });
});

// ---------- Admin ----------

export const adminListReturns = asyncHandler(async (req: Request, res: Response) => {
  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = req.query.status;

  const returns = await Return.find(filter).sort({ createdAt: -1 });
  sendSuccess(res, { data: { returns } });
});

export const adminGetReturn = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const returnDoc = await Return.findById(id);
  if (!returnDoc) throw AppError.notFound('Return not found');
  sendSuccess(res, { data: { return: returnDoc } });
});

export const adminApproveReturn = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const returnDoc = await returnService.approveReturn(id);
  sendSuccess(res, { message: 'Return approved', data: { return: returnDoc } });
});

export const adminRejectReturn = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const returnDoc = await returnService.rejectReturn(id, reason);
  sendSuccess(res, { message: 'Return rejected', data: { return: returnDoc } });
});

export const adminMarkPickedUp = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const returnDoc = await returnService.markPickedUp(id);
  sendSuccess(res, { message: 'Return marked picked up', data: { return: returnDoc } });
});

export const adminMarkReceived = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const returnDoc = await returnService.markReceived(id);
  sendSuccess(res, { message: 'Return marked received', data: { return: returnDoc } });
});

export const adminInspectReturn = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { passed, notes } = req.body;
  const returnDoc = await returnService.inspectReturn(id, passed, notes);
  sendSuccess(res, { message: 'Return inspection recorded', data: { return: returnDoc } });
});

export const adminProcessRefund = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const returnDoc = await returnService.processReturnRefund(id);
  sendSuccess(res, { message: 'Refund initiated for return', data: { return: returnDoc } });
});
