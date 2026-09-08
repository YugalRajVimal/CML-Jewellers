import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { sendError } from '../utils/apiResponse';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, {
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    code: 'ROUTE_NOT_FOUND',
    statusCode: 404,
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function globalErrorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  if (err instanceof AppError) {
    if (!err.isOperational) logger.error(err.message, err);
    sendError(res, {
      message: err.message,
      code: err.code,
      details: err.details,
      statusCode: err.statusCode,
    });
    return;
  }

  // Mongoose duplicate key error
  if (typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000) {
    const keyValue = (err as { keyValue?: Record<string, unknown> }).keyValue || {};
    sendError(res, {
      message: `Duplicate value for field: ${Object.keys(keyValue).join(', ')}`,
      code: 'DUPLICATE_KEY',
      details: keyValue,
      statusCode: 409,
    });
    return;
  }

  // Mongoose validation error
  if (typeof err === 'object' && err !== null && (err as { name?: string }).name === 'ValidationError') {
    sendError(res, {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: (err as Error).message,
      statusCode: 422,
    });
    return;
  }

  logger.error('Unhandled error', err);
  sendError(res, {
    message: env.nodeEnv === 'production' ? 'Internal server error' : (err as Error)?.message || 'Unknown error',
    code: 'INTERNAL_ERROR',
    statusCode: 500,
  });
}
