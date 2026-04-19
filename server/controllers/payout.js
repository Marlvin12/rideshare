import User from '../models/User.js';
import Payout from '../models/Payout.js';
import EarningsTransaction from '../models/EarningsTransaction.js';
import { StatusCodes } from 'http-status-codes';
import { BadRequestError, UnauthenticatedError } from '../errors/index.js';
import logger from '../config/logger.js';
import { enqueue, QUEUE_NAMES } from '../jobs/queues.js';

export const requestWithdrawal = async (req, res) => {
  const userId = req.user.id;
  const { amount, method, destination, saveDestination } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new UnauthenticatedError('User not found');
  }
  if (user.role !== 'rider') {
    throw new BadRequestError('Withdrawals are only available for riders');
  }

  const numAmount = typeof amount === 'number' ? amount : parseFloat(amount, 10);
  if (!Number.isFinite(numAmount) || numAmount <= 0) {
    throw new BadRequestError('Valid positive amount is required');
  }

  const available = user.earnings?.available ?? 0;
  if (numAmount > available) {
    throw new BadRequestError(`Insufficient balance. Available: ${available}`);
  }

  const validMethods = ['ecocash', 'onemoney', 'bank'];
  const payoutMethod = method && validMethods.includes(method) ? method : user.payoutMethod;
  if (!payoutMethod) {
    throw new BadRequestError('Payout method is required (ecocash, onemoney, or bank)');
  }

  const dest = (destination && String(destination).trim()) || (payoutMethod !== 'bank' ? user.payoutMobile : null);
  if (!dest) {
    throw new BadRequestError('Payout destination (mobile number or account) is required');
  }

  const payout = await Payout.create({
    userId,
    amount: numAmount,
    status: 'pending',
    method: payoutMethod,
    destination: dest,
  });

  await User.findByIdAndUpdate(userId, {
    $inc: { 'earnings.available': -numAmount },
    ...(saveDestination && payoutMethod !== 'bank' ? { payoutMethod, payoutMobile: dest } : {}),
    ...(saveDestination && payoutMethod === 'bank' ? { payoutMethod } : {}),
  });

  await EarningsTransaction.create({
    userId,
    amount: -numAmount,
    type: 'withdrawal',
    referenceType: 'Payout',
    referenceId: payout._id,
  });

  await enqueue(QUEUE_NAMES.RIDER_PAYOUT, 'process', {
    payoutId: payout._id.toString(),
    userId,
    amount: numAmount,
    method: payoutMethod,
    destination: dest,
  });

  logger.info({ payoutId: payout._id, userId, amount: numAmount }, 'Withdrawal requested');

  res.status(StatusCodes.CREATED).json({
    message: 'Withdrawal requested. Funds will be sent shortly.',
    payout: {
      id: payout._id,
      amount: numAmount,
      method: payoutMethod,
      status: payout.status,
    },
  });
};
