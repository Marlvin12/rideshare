import { Worker } from 'bullmq';
import { getRedisConnection, isRedisAvailable } from '../config/redis.js';
import logger from '../config/logger.js';
import { QUEUE_NAMES } from './queues.js';
import Payout from '../models/Payout.js';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import EarningsTransaction from '../models/EarningsTransaction.js';

const workers = [];

const notificationProcessor = async (job) => {
  const { type, userId, payload } = job.data;
  logger.info({ type, userId, jobId: job.id }, 'Processing notification');
  return { sent: true, type };
};

const kycProcessor = async (job) => {
  const { userId, action } = job.data;
  logger.info({ userId, action, jobId: job.id }, 'Processing KYC job');
  return { processed: true, userId };
};

const analyticsProcessor = async (job) => {
  const { event, data } = job.data;
  logger.debug({ event, jobId: job.id }, 'Processing analytics event');
  return { recorded: true, event };
};

const cleanupProcessor = async (job) => {
  const { task } = job.data;
  logger.info({ task, jobId: job.id }, 'Running cleanup task');
  return { cleaned: true, task };
};

const riderPayoutProcessor = async (job) => {
  const { payoutId, userId, amount, method, destination } = job.data;
  logger.info({ payoutId, userId, amount, method, jobId: job.id }, 'Processing rider payout');
  try {
    // Placeholder: integrate PayNow (or Ecocash) API to push funds to destination
    // await payNowService.sendMobile({ amount, phone: destination, method });
    const payout = await Payout.findByIdAndUpdate(
      payoutId,
      { status: 'completed', completedAt: new Date() },
      { new: true }
    );
    if (!payout) {
      throw new Error('Payout not found');
    }
    return { processed: true, payoutId, status: 'completed' };
  } catch (err) {
    logger.error({ err, payoutId, userId }, 'Rider payout failed');
    await Payout.findByIdAndUpdate(payoutId, {
      status: 'failed',
      failureReason: err.message || 'Payout failed',
    });
    await User.findByIdAndUpdate(userId, {
      $inc: { 'earnings.available': amount },
    });
    throw err;
  }
};

const MIN_RESTAURANT_PAYOUT_THRESHOLD = 1;

const restaurantPayoutProcessor = async (job) => {
  const { threshold = MIN_RESTAURANT_PAYOUT_THRESHOLD } = job.data;
  logger.info({ threshold, jobId: job.id }, 'Processing restaurant batch payout');
  const restaurants = await Restaurant.find({
    'earnings.available': { $gte: threshold },
    status: 'active',
  }).lean();

  const results = [];
  for (const rest of restaurants) {
    const available = rest.earnings?.available ?? 0;
    if (available < threshold) continue;

    const destination = rest.mobileMoneyPhone || rest.bankDetails?.accountNumber;
    const method = rest.mobileMoneyPhone ? 'ecocash' : 'bank';
    if (!destination) {
      logger.warn({ restaurantId: rest._id }, 'Restaurant has no payout destination, skipping');
      results.push({ restaurantId: rest._id, skipped: true, reason: 'no_destination' });
      continue;
    }

    try {
      const payout = await Payout.create({
        restaurantId: rest._id,
        amount: available,
        status: 'pending',
        method,
        destination,
      });

      await Restaurant.findByIdAndUpdate(rest._id, {
        $set: { 'earnings.available': 0 },
      });

      await EarningsTransaction.create({
        restaurantId: rest._id,
        amount: -available,
        type: 'restaurant_payout',
        referenceType: 'Payout',
        referenceId: payout._id,
      });

      // Placeholder: integrate PayNow/bank API for merchant payout
      await Payout.findByIdAndUpdate(payout._id, {
        status: 'completed',
        completedAt: new Date(),
      });

      results.push({ restaurantId: rest._id, payoutId: payout._id, amount: available, status: 'completed' });
    } catch (err) {
      logger.error({ err, restaurantId: rest._id }, 'Restaurant payout failed');
      results.push({ restaurantId: rest._id, error: err.message, status: 'failed' });
    }
  }

  return { processed: results.length, results };
};

const PROCESSORS = {
  [QUEUE_NAMES.NOTIFICATIONS]: notificationProcessor,
  [QUEUE_NAMES.KYC_PROCESSING]: kycProcessor,
  [QUEUE_NAMES.ANALYTICS]: analyticsProcessor,
  [QUEUE_NAMES.CLEANUP]: cleanupProcessor,
  [QUEUE_NAMES.RIDER_PAYOUT]: riderPayoutProcessor,
  [QUEUE_NAMES.RESTAURANT_PAYOUT]: restaurantPayoutProcessor,
};

export const startWorkers = () => {
  if (!isRedisAvailable()) {
    logger.info('Redis unavailable, background workers not started');
    return;
  }

  const connection = getRedisConnection();

  for (const [queueName, processor] of Object.entries(PROCESSORS)) {
    const worker = new Worker(queueName, processor, {
      connection,
      concurrency: 5,
      limiter: { max: 50, duration: 1000 },
    });

    worker.on('completed', (job) => {
      logger.debug({ queue: queueName, jobId: job.id }, 'Job completed');
    });

    worker.on('failed', (job, err) => {
      logger.error({ err, queue: queueName, jobId: job?.id }, 'Job failed');
    });

    workers.push(worker);
    logger.info({ queue: queueName }, 'Worker started');
  }
};

export const stopWorkers = async () => {
  for (const worker of workers) {
    await worker.close().catch((err) =>
      logger.error({ err }, 'Error closing worker')
    );
  }
  workers.length = 0;
};
