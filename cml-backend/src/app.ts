import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import apiRouter from './routes';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimit.middleware';
import { sendSuccess } from './utils/apiResponse';

export function createApp(): Application {
  const app = express();

  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: [env.cors.client, env.cors.admin],
      credentials: true,
    })
  );
  app.use(
    express.json({
      limit: '2mb',
      verify: (req, _res, buf) => {
        (req as express.Request).rawBody = buf.toString('utf8');
      },
    })
  );
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

  app.get('/health', (_req, res) => {
    sendSuccess(res, { message: 'CML Jewellers API is healthy', data: { env: env.nodeEnv } });
  });


  app.use('/api/v1', apiRouter);

  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
