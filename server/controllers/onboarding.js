import { StatusCodes } from 'http-status-codes';
import User from '../models/User.js';
import { BadRequestError } from '../errors/index.js';
import logger from '../config/logger.js';

const mapVehicleType = (vehicle) => {
  if (!vehicle) return undefined;
  const v = String(vehicle).toLowerCase();
  if (v === 'bicycle' || v === 'bike') return 'bike';
  if (v === 'scooter' || v === 'motorbike' || v === 'moto') return 'bike';
  if (v === 'car' || v === 'cab' || v === 'cab economy') return 'cabEconomy';
  return undefined;
};

export const createRiderLead = async (req, res) => {
  const sharedSecret = process.env.XIGOA_PARTNER_TOKEN;
  const token = req.headers['x-partner-token'];

  if (sharedSecret && token !== sharedSecret) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid partner token' });
  }

  const { name, email, phone, city, vehicle } = req.body || {};

  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    throw new BadRequestError('Phone is required');
  }

  try {
    const normalizedPhone = phone.trim();
    const normalizedEmail = email ? String(email).trim().toLowerCase() : undefined;

    let user =
      (normalizedEmail && (await User.findOne({ email: normalizedEmail, role: 'rider' }))) ||
      (await User.findOne({ phone: normalizedPhone, role: 'rider' }));

    if (!user) {
      user = await User.create({
        role: 'rider',
        name: name || undefined,
        email: normalizedEmail,
        phone: normalizedPhone,
        kyc: { status: 'pending', address: city || undefined, fullName: name || undefined },
        vehicle: { type: mapVehicleType(vehicle) },
      });
    } else {
      if (name && !user.name) user.name = name;
      if (normalizedEmail && !user.email) user.email = normalizedEmail;
      if (!user.kyc) user.kyc = {};
      if (city && !user.kyc.address) user.kyc.address = city;
      if (name && !user.kyc.fullName) user.kyc.fullName = name;
      const mappedVehicle = mapVehicleType(vehicle);
      if (mappedVehicle) {
        user.vehicle = user.vehicle || {};
        user.vehicle.type = mappedVehicle;
      }
      if (!user.kyc.status || user.kyc.status === 'pending') {
        user.kyc.status = 'pending';
      }
      await user.save();
    }

    logger.info(
      { userId: user._id, phone: normalizedPhone, email: normalizedEmail },
      'Rider lead ingested from xigoa'
    );

    return res.status(StatusCodes.CREATED).json({
      message: 'Rider lead received',
      riderId: user._id,
      kycStatus: user.kyc?.status ?? 'pending',
    });
  } catch (err) {
    logger.error({ err }, 'Failed to create rider lead');
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'Failed to create rider lead' });
  }
};

