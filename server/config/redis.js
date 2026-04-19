import IORedis from 'ioredis';
import logger from './logger.js';

let connection = null;
let available = false;

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const createConnection = () => {
  if (connection) return connection;

  try {
    connection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      retryStrategy: (times) => {
        if (times > 5) {
          logger.warn('Redis max reconnect attempts reached, giving up');
          return null;
        }
        return Math.min(times * 500, 5000);
      },
      lazyConnect: true,
    });

    connection.on('connect', () => {
      available = true;
      logger.info('Redis connected');
    });

    connection.on('error', (err) => {
      available = false;
      logger.warn({ err: err.message }, 'Redis connection error (jobs will be skipped)');
    });

    connection.on('close', () => {
      available = false;
    });
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to create Redis connection');
  }

  return connection;
};

export const connectRedis = async () => {
  const conn = createConnection();
  if (!conn) return false;
  try {
    await conn.connect();
    return true;
  } catch {
    logger.warn('Redis not available, background jobs disabled');
    return false;
  }
};

export const getRedisConnection = () => {
  if (!connection) createConnection();
  return connection;
};

export const isRedisAvailable = () => available;

export const closeRedis = async () => {
  if (connection) {
    await connection.quit().catch(() => {});
    connection = null;
    available = false;
  }
};
