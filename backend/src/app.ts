import { env } from './config/env';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { database } from './config/db';
import { runSeed } from './config/seed';
import routes from './routes';
import { openApiSpec } from './config/swagger';
import { notFound, errorHandler } from './middleware/error';
import { logger } from './utils/logger';

async function bootstrap() {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigins === '*' ? true : env.corsOrigins.split(','),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan('tiny'));

  try {
    app.use(
      '/api/docs',
      ...(swaggerUi.serve as unknown as express.RequestHandler[]),
      swaggerUi.setup(openApiSpec, { customSiteTitle: 'ProcureAI API Docs' }) as unknown as express.RequestHandler,
    );
  } catch (err) {
    logger.error('Swagger UI setup skipped', err);
  }
  app.use('/api', routes);

  app.get('/', (_req, res) => res.json({ success: true, service: 'procureai-api', docs: '/api/docs' }));

  app.use(notFound);
  app.use(errorHandler);

  await database.connect();
  await runSeed();

  app.listen(env.port, '0.0.0.0', () => {
    logger.info(`ProcureAI API listening on :${env.port}`);
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
