import mongoose from 'mongoose';
import logger from './logger.js';

const RETRY_DELAY_MS = 5000;
const MAX_RETRIES = 5;

const connectDB = async (url) => {
  mongoose.connection.on('error', (err) => {
    logger.error({ err: err.message }, 'MongoDB connection error');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected, Mongoose will auto-reconnect');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
  });

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(url, {
        serverSelectionTimeoutMS: 5000,
        heartbeatFrequencyMS: 10000,
      });
      logger.info('MongoDB connected');
      return;
    } catch (err) {
      logger.error({ attempt, maxRetries: MAX_RETRIES, err: err.message }, 'MongoDB connection attempt failed');
      if (attempt === MAX_RETRIES) {
        throw new Error(`Failed to connect to MongoDB after ${MAX_RETRIES} attempts`);
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
};

export default connectDB;
