import { Queue } from 'bullmq';
import { getRedisConnection, isRedisAvailable } from '../config/redis.js';
import logger from '../config/logger.js';

const queues = new Map();

const getOrCreateQueue = (name) => {
  if (queues.has(name)) return queues.get(name);

  const connection = getRedisConnection();
  if (!connection) return null;

  const queue = new Queue(name, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 5000 },
    },
  });

  queues.set(name, queue);
  return queue;
};

export const QUEUE_NAMES = {
  NOTIFICATIONS: 'notifications',
  KYC_PROCESSING: 'kyc-processing',
  ANALYTICS: 'analytics',
  CLEANUP: 'cleanup',
  RIDER_PAYOUT: 'rider-payout',
  RESTAURANT_PAYOUT: 'restaurant-payout',
};

export const enqueue = async (queueName, jobName, data, opts = {}) => {
  if (!isRedisAvailable()) {
    logger.debug({ queueName, jobName }, 'Redis unavailable, skipping job enqueue');
    return null;
  }

  const queue = getOrCreateQueue(queueName);
  if (!queue) return null;

  try {
    const job = await queue.add(jobName, data, opts);
    logger.debug({ queueName, jobName, jobId: job.id }, 'Job enqueued');
    return job;
  } catch (err) {
    logger.error({ err, queueName, jobName }, 'Failed to enqueue job');
    return null;
  }
};

export const closeQueues = async () => {
  for (const [name, queue] of queues) {
    await queue.close().catch((err) =>
      logger.error({ err, queue: name }, 'Error closing queue')
    );
  }
  queues.clear();
};
