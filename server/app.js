import dotenv from 'dotenv';

dotenv.config();

const REQUIRED_ENV = ['MONGO_URI', 'ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET', 'GOOGLE_MAPS_API_KEY'];
const missing = REQUIRED_ENV.filter(key => !process.env[key]);
if (missing.length > 0) {
  process.stderr.write(`Fatal: missing required env vars: ${missing.join(', ')}\n`);
  process.exit(1);
}

import 'express-async-errors';
import EventEmitter from 'events';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import http from 'http';
import mongoose from 'mongoose';
import { Server as socketIo } from 'socket.io';
import logger from './config/logger.js';
import connectDB from './config/connect.js';
import initializeFirebase from './config/firebase.js';
import { metricsMiddleware, metricsEndpoint } from './middleware/metrics.js';
import notFoundMiddleware from './middleware/not-found.js';
import errorHandlerMiddleware from './middleware/error-handler.js';
import authMiddleware from './middleware/authentication.js';
import cacheControl from './middleware/cacheControl.js';

import authRouter from './routes/auth.js';
import rideRouter from './routes/ride.js';
import mapsRouter from './routes/maps.js';
import kycRouter from './routes/kyc.js';
import adminRouter from './routes/admin.js';
import agentRouter from './routes/agent.js';
import restaurantRouter from './routes/restaurant.js';
import merchantRouter from './routes/merchant.js';
import foodOrderRouter from './routes/foodOrder.js';
import promotionsRouter from './routes/promotions.js';
import customerRouter from './routes/customer.js';
import onboardingRouter from './routes/onboarding.js';

import handleSocketConnection from './controllers/sockets.js';
import { attachRedisAdapter } from './config/socketAdapter.js';
import { startWorkers, stopWorkers } from './jobs/workers.js';
import { closeQueues } from './jobs/queues.js';
import { closeRedis, connectRedis } from './config/redis.js';

EventEmitter.defaultMaxListeners = 20;

const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : [];

const corsOptions = {
  origin: allowedOrigins.length > 0
    ? (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    : isProduction
      ? false
      : true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
};

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors(corsOptions));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { msg: 'Too many requests, try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));
app.use(pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => req.url === '/health' || req.url === '/metrics',
  },
}));
app.use(metricsMiddleware);

const server = http.createServer(app);

const io = new socketIo(server, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.set('io', io);

app.use((req, res, next) => {
  req.io = io;
  return next();
});

// Enable cross-instance Socket.IO fan-out (BE-2) before wiring handlers, so
// io.to(room).emit reaches sockets on every instance, not just this process.
// No-op/degrades to single-instance if Redis is unavailable.
attachRedisAdapter(io);

handleSocketConnection(io);

// --- Infrastructure endpoints (no auth, no versioning) ---

app.get('/health', async (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbOk = dbState === 1;
  const status = dbOk ? 'ok' : 'degraded';
  const code = dbOk ? 200 : 503;

  res.status(code).json({
    status,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    checks: {
      database: dbOk ? 'connected' : 'disconnected',
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1048576),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1048576),
      },
    },
  });
});

app.get('/metrics', metricsEndpoint);

// --- Route mounting helper ---
const mountRoutes = (router) => {
  router.use('/auth', authRouter);
  router.use('/maps', mapsRouter);
  router.use('/ride', authMiddleware, rideRouter);
  router.use('/kyc', kycRouter);
  router.use('/admin', adminRouter);
  router.use('/agent', agentRouter);
  router.use('/restaurants', cacheControl('public', 60), restaurantRouter);
  router.use('/merchant', merchantRouter);
  router.use('/food-orders', authMiddleware, foodOrderRouter);
  router.use('/customer/promotions', promotionsRouter);
  router.use('/customer', customerRouter);
  router.use('/onboarding', onboardingRouter);
};

// Versioned API routes
const v1Router = express.Router();
mountRoutes(v1Router);
app.use('/api/v1', v1Router);

// Backward-compatible root routes for existing clients
mountRoutes(app);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

// --- Graceful shutdown ---
const gracefulShutdown = async (signal) => {
  logger.info({ signal }, 'Received shutdown signal, draining connections');

  server.close(async () => {
    logger.info('HTTP server closed');

    io.close(() => {
      logger.info('WebSocket server closed');
    });

    try {
      await stopWorkers();
      await closeQueues();
      await closeRedis();
      logger.info('Background jobs shut down');
    } catch (err) {
      logger.error({ err }, 'Error shutting down background jobs');
    }

    try {
      await mongoose.connection.close(false);
      logger.info('MongoDB connection closed');
    } catch (err) {
      logger.error({ err }, 'Error closing MongoDB connection');
    }

    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Graceful shutdown timed out after 15s, forcing exit');
    process.exit(1);
  }, 15_000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.once('SIGUSR2', () => {
  server.close(() => {
    process.kill(process.pid, 'SIGUSR2');
  });
});

process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled promise rejection');
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});

// --- Start ---
const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    initializeFirebase();
    await connectRedis();
    startWorkers();
    const port = process.env.PORT || 3000;

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.warn({ port }, 'Port in use, retrying in 2s');
        setTimeout(() => server.listen(port, '0.0.0.0'), 2000);
      } else {
        logger.fatal({ err }, 'Server error');
        process.exit(1);
      }
    });

    server.listen(port, '0.0.0.0', () =>
      logger.info({ port }, 'HTTP server started')
    );
  } catch (error) {
    logger.fatal({ err: error }, 'Server failed to start');
    process.exit(1);
  }
};

start();
