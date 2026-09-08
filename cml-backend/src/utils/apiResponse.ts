import { Response } from 'express';

interface Meta {
  page?: number;
  limit?: number;
  total?: number;
  [key: string]: unknown;
}

export function sendSuccess(
  res: Response,
  {
    message = 'Success',
    data = {},
    meta,
    statusCode = 200,
  }: { message?: string; data?: unknown; meta?: Meta; statusCode?: number } = {}
): Response {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  });
}

export function sendError(
  res: Response,
  {
    message = 'Something went wrong',
    code = 'INTERNAL_ERROR',
    details = {},
    statusCode = 500,
  }: { message?: string; code?: string; details?: unknown; statusCode?: number } = {}
): Response {
  return res.status(statusCode).json({
    success: false,
    message,
    error: { code, details },
  });
}
