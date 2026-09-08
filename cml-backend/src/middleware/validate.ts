import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';
import { AppError } from '../utils/AppError';

type RequestPart = 'body' | 'query' | 'params';

export function validate(schema: ZodTypeAny, part: RequestPart = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[part]);
      req[part] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(
          AppError.badRequest('Validation failed', 'VALIDATION_ERROR', {
            issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
          })
        );
        return;
      }
      next(err);
    }
  };
}
