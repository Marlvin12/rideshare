import mongoose from 'mongoose';
import User from '../models/User.js';
import Ride from '../models/Ride.js';
import Admin from '../models/Admin.js';
import Restaurant from '../models/Restaurant.js';
import MerchantApplication from '../models/MerchantApplication.js';
import { StatusCodes } from 'http-status-codes';
import { BadRequestError, UnauthenticatedError, NotFoundError } from '../errors/index.js';
import { enqueue, QUEUE_NAMES } from '../jobs/queues.js';

const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError('Email and password are required');
  }

  const admin = await Admin.findOne({ email });

  if (!admin) {
    throw new UnauthenticatedError('Invalid credentials');
  }

  const isMatch = await admin.comparePassword(password);

  if (!isMatch) {
    throw new UnauthenticatedError('Invalid credentials');
  }

  if (!admin.isActive) {
    throw new UnauthenticatedError('Admin account is inactive');
  }

  const accessToken = admin.createAccessToken();

  res.status(StatusCodes.OK).json({
    message: 'Login successful',
    access_token: accessToken,
    admin: {
      id: admin._id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    },
  });
};

const getPeriodBounds = (daysAgoStart, daysAgoEnd) => {
  const start = new Date();
  start.setDate(start.getDate() - daysAgoStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setDate(end.getDate() - daysAgoEnd);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export const getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalRiders, totalCustomers, totalRides, activeRides, completedRides, pendingKyc] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'rider' }),
        User.countDocuments({ role: 'customer' }),
        Ride.countDocuments(),
        Ride.countDocuments({ status: { $in: ['SEARCHING_FOR_RIDER', 'START', 'ARRIVED'] } }),
        Ride.countDocuments({ status: 'COMPLETED' }),
        User.countDocuments({ role: 'rider', 'kyc.status': 'submitted' }),
      ]);

    const revenueResult = await Ride.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $group: { _id: null, total: { $sum: '$fare' } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    const currentPeriod = getPeriodBounds(6, 0);
    const previousPeriod = getPeriodBounds(13, 7);

    const [
      currentRides,
      currentCompleted,
      currentRevenueAgg,
      currentNewUsers,
      currentNewRiders,
      currentNewCustomers,
      previousRides,
      previousCompleted,
      previousRevenueAgg,
      previousNewUsers,
      previousNewRiders,
      previousNewCustomers,
    ] = await Promise.all([
      Ride.countDocuments({ createdAt: { $gte: currentPeriod.start, $lte: currentPeriod.end } }),
      Ride.countDocuments({ createdAt: { $gte: currentPeriod.start, $lte: currentPeriod.end }, status: 'COMPLETED' }),
      Ride.aggregate([
        { $match: { createdAt: { $gte: currentPeriod.start, $lte: currentPeriod.end }, status: 'COMPLETED' } },
        { $group: { _id: null, total: { $sum: '$fare' } } },
      ]),
      User.countDocuments({ createdAt: { $gte: currentPeriod.start, $lte: currentPeriod.end } }),
      User.countDocuments({ role: 'rider', createdAt: { $gte: currentPeriod.start, $lte: currentPeriod.end } }),
      User.countDocuments({ role: 'customer', createdAt: { $gte: currentPeriod.start, $lte: currentPeriod.end } }),
      Ride.countDocuments({ createdAt: { $gte: previousPeriod.start, $lte: previousPeriod.end } }),
      Ride.countDocuments({ createdAt: { $gte: previousPeriod.start, $lte: previousPeriod.end }, status: 'COMPLETED' }),
      Ride.aggregate([
        { $match: { createdAt: { $gte: previousPeriod.start, $lte: previousPeriod.end }, status: 'COMPLETED' } },
        { $group: { _id: null, total: { $sum: '$fare' } } },
      ]),
      User.countDocuments({ createdAt: { $gte: previousPeriod.start, $lte: previousPeriod.end } }),
      User.countDocuments({ role: 'rider', createdAt: { $gte: previousPeriod.start, $lte: previousPeriod.end } }),
      User.countDocuments({ role: 'customer', createdAt: { $gte: previousPeriod.start, $lte: previousPeriod.end } }),
    ]);

    const currentPeriodStats = {
      totalRides: currentRides,
      completedRides: currentCompleted,
      totalRevenue: Math.round((currentRevenueAgg[0]?.total || 0) * 100) / 100,
      newUsers: currentNewUsers,
      newRiders: currentNewRiders,
      newCustomers: currentNewCustomers,
    };
    const previousPeriodStats = {
      totalRides: previousRides,
      completedRides: previousCompleted,
      totalRevenue: Math.round((previousRevenueAgg[0]?.total || 0) * 100) / 100,
      newUsers: previousNewUsers,
      newRiders: previousNewRiders,
      newCustomers: previousNewCustomers,
    };

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [dayRides, dayRevenue] = await Promise.all([
        Ride.countDocuments({ createdAt: { $gte: date, $lt: nextDate } }),
        Ride.aggregate([
          { $match: { createdAt: { $gte: date, $lt: nextDate }, status: 'COMPLETED' } },
          { $group: { _id: null, total: { $sum: '$fare' } } },
        ]),
      ]);

      last7Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rides: dayRides,
        revenue: dayRevenue[0]?.total || 0,
      });
    }

    res.status(StatusCodes.OK).json({
      stats: {
        totalUsers,
        totalRiders,
        totalCustomers,
        totalRides,
        activeRides,
        completedRides,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        pendingKyc,
      },
      currentPeriodStats,
      previousPeriodStats,
      chartData: last7Days,
    });
  } catch (error) {
    throw new BadRequestError('Failed to fetch dashboard stats');
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const { page, limit, skip } = parsePagination(req.query);
    const query = role && role !== 'all' ? { role } : {};

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    res.status(StatusCodes.OK).json({
      message: 'Users retrieved successfully',
      count: users.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      users,
    });
  } catch (error) {
    throw new BadRequestError('Failed to fetch users');
  }
};

export const getAllRides = async (req, res) => {
  try {
    const { status } = req.query;
    const { page, limit, skip } = parsePagination(req.query);
    const query = status && status !== 'all' ? { status } : {};

    const [rides, total] = await Promise.all([
      Ride.find(query)
        .populate('customer', 'phone kyc')
        .populate('rider', 'phone kyc')
        .populate('offers.riderId', 'phone kyc')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Ride.countDocuments(query),
    ]);

    res.status(StatusCodes.OK).json({
      message: 'Rides retrieved successfully',
      count: rides.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      rides,
    });
  } catch (error) {
    throw new BadRequestError('Failed to fetch rides');
  }
};

export const getKYCSubmissions = async (req, res) => {
  try {
    const { status } = req.query;
    const { page, limit, skip } = parsePagination(req.query);
    const query = { role: 'rider' };

    if (status && status !== 'all') {
      query['kyc.status'] = status;
    }

    const [submissions, total, statusCounts] = await Promise.all([
      User.find(query)
        .select('-__v')
        .sort({ 'kyc.submittedAt': -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
      User.aggregate([
        { $match: { role: 'rider' } },
        { $group: { _id: '$kyc.status', count: { $sum: 1 } } },
      ]),
    ]);

    const counts = { submitted: 0, approved: 0, rejected: 0, not_submitted: 0 };
    statusCounts.forEach(({ _id, count }) => {
      if (_id === 'pending' || _id == null) counts.not_submitted += count;
      else if (_id in counts) counts[_id] = count;
    });

    res.status(StatusCodes.OK).json({
      message: 'KYC submissions retrieved successfully',
      count: submissions.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      statusCounts: counts,
      submissions,
    });
  } catch (error) {
    throw new BadRequestError('Failed to fetch KYC submissions');
  }
};

export const getFinancials = async (req, res) => {
  try {
    const revenueResult = await Ride.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $group: { _id: null, total: { $sum: '$fare' } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;
    const platformFees = totalRevenue * 0.2;
    const riderEarnings = totalRevenue * 0.8;

    const revenueByVehicle = await Ride.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $group: { _id: '$vehicle', total: { $sum: '$fare' } } },
    ]);

    const vehicleData = revenueByVehicle.map((item) => ({
      name: item._id,
      value: Math.round(item.total * 100) / 100,
    }));

    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      const nextMonth = new Date(date);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const monthRevenue = await Ride.aggregate([
        { $match: { createdAt: { $gte: date, $lt: nextMonth }, status: 'COMPLETED' } },
        { $group: { _id: null, total: { $sum: '$fare' } } },
      ]);

      const revenue = monthRevenue[0]?.total || 0;
      last6Months.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        revenue: Math.round(revenue * 100) / 100,
        platformFee: Math.round(revenue * 0.2 * 100) / 100,
      });
    }

    const recentTransactions = await Ride.find({ status: 'COMPLETED' })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const transactions = recentTransactions.map((ride) => ({
      date: ride.createdAt,
      rideId: ride._id.toString().slice(-8),
      vehicle: ride.vehicle,
      fare: ride.fare,
      platformFee: ride.fare * 0.2,
      riderEarning: ride.fare * 0.8,
    }));

    const currentMonthRevenue = last6Months.length > 0 ? last6Months[last6Months.length - 1].revenue : 0;
    const previousMonthRevenue = last6Months.length >= 2 ? last6Months[last6Months.length - 2].revenue : 0;

    res.status(StatusCodes.OK).json({
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      platformFees: Math.round(platformFees * 100) / 100,
      riderEarnings: Math.round(riderEarnings * 100) / 100,
      revenueByVehicle: vehicleData,
      monthlyRevenue: last6Months,
      currentMonthRevenue,
      previousMonthRevenue,
      transactions,
    });
  } catch (error) {
    throw new BadRequestError('Failed to fetch financial data');
  }
};

export const triggerRestaurantPayout = async (req, res) => {
  const threshold = typeof req.body?.threshold === 'number' && req.body.threshold >= 0
    ? req.body.threshold
    : 1;
  const job = await enqueue(QUEUE_NAMES.RESTAURANT_PAYOUT, 'batch', { threshold });
  res.status(StatusCodes.ACCEPTED).json({
    message: 'Restaurant payout job queued',
    jobId: job?.id ?? null,
    threshold,
  });
};

export const getMerchantApplications = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { status } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const [applications, total] = await Promise.all([
    MerchantApplication.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('applicantUserId', 'email phone')
      .populate('restaurantId', 'name')
      .lean(),
    MerchantApplication.countDocuments(filter),
  ]);

  res.status(StatusCodes.OK).json({
    applications,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
};

export const reviewMerchantApplication = async (req, res) => {
  const { applicationId } = req.params;
  const { action, rejectionReason, adminNotes } = req.body;

  if (!mongoose.isValidObjectId(applicationId)) {
    throw new BadRequestError('Invalid application ID');
  }

  if (!['approve', 'reject'].includes(action)) {
    throw new BadRequestError('Action must be "approve" or "reject"');
  }

  const application = await MerchantApplication.findById(applicationId);

  if (!application) {
    throw new NotFoundError('Application not found');
  }

  if (application.status === 'approved') {
    throw new BadRequestError('Application is already approved');
  }

  if (action === 'reject') {
    application.status = 'rejected';
    application.rejectionReason = rejectionReason ?? null;
    application.adminNotes = adminNotes ?? null;
    application.reviewedBy = req.admin?._id ?? null;
    application.reviewedAt = new Date();
    await application.save();

    return res.status(StatusCodes.OK).json({ application });
  }

  // Approve: create a draft restaurant and link the merchant user.
  const existingRestaurant = await Restaurant.findOne({
    $or: [
      { _id: application.restaurantId },
      { ownerId: application.applicantUserId },
    ],
  });

  let restaurant = existingRestaurant;

  if (!restaurant) {
    restaurant = await Restaurant.create({
      name: application.restaurantName,
      cuisine: application.cuisineType
        ? [application.cuisineType]
        : ['General'],
      ownerId: application.applicantUserId,
      isOpen: false,
      status: 'draft',
      deliveryFee: 0,
      minimumOrder: 0,
      preparationTime: 25,
      rating: 0,
      address: application.address ?? '',
    });
  }

  application.status = 'approved';
  application.restaurantId = restaurant._id;
  application.adminNotes = adminNotes ?? null;
  application.reviewedBy = req.admin?._id ?? null;
  application.reviewedAt = new Date();
  await application.save();

  if (application.applicantUserId) {
    await User.findByIdAndUpdate(application.applicantUserId, {
      $set: { role: 'merchant', restaurantId: restaurant._id },
    });
  }

  res.status(StatusCodes.OK).json({ application, restaurant });
};
