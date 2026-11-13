import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import 'express-async-errors';

import authRoutes from './routes/authRoutes';
import orderRoutes from './routes/orderRoutes';
import returnRoutes from './routes/returnRoutes';
import adminRoutes from './routes/adminRoutes';
import testRoutes from './routes/testRoutes';
import { errorHandler } from './middleware/errorHandler';

export function createApp(): Express {
  const app = express();

  // Security Middleware
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS Middleware
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body Parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static files for uploaded proof images
  const uploadDir = path.resolve(__dirname, '../uploads');
  app.use('/uploads', express.static(uploadDir));

  // Swagger API Documentation
  const swaggerDocPath = path.resolve(__dirname, './swagger/openapi.yaml');
  try {
    const swaggerDocument = YAML.load(swaggerDocPath);
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    app.get('/api/docs.json', (_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerDocument);
    });
  } catch (err) {
    console.warn('⚠️ Could not load Swagger documentation:', err);
  }

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // Application Routes (Direct, /api, and /api/v1 prefixes)
  app.use('/auth', authRoutes);
  app.use('/orders', orderRoutes);
  app.use('/returns', returnRoutes);
  app.use('/admin', adminRoutes);

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/orders', orderRoutes);
  app.use('/api/v1/returns', returnRoutes);
  app.use('/api/v1/admin', adminRoutes);

  app.use('/api/auth', authRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/returns', returnRoutes);
  app.use('/api/admin', adminRoutes);

  // Test Utilities (enabled in non-production)
  if (
    process.env.ALLOW_TEST_ROUTES === 'true' ||
    process.env.NODE_ENV === 'test' ||
    process.env.NODE_ENV === 'development'
  ) {
    app.use('/test', testRoutes);
  }

  // 404 Route handler
  app.use((_req, res) => {
    res.status(404).json({
      code: 'NOT_FOUND',
      message: 'The requested resource or endpoint was not found.',
      details: [],
    });
  });

  // Central Error Handler
  app.use(errorHandler);

  return app;
}

export default createApp;

