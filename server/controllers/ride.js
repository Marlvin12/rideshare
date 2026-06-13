import Ride from "../models/Ride.js";
import User from "../models/User.js";
import EarningsTransaction from "../models/EarningsTransaction.js";
import { BadRequestError, NotFoundError } from "../errors/index.js";
import logger from "../config/logger.js";
import { StatusCodes } from "http-status-codes";
import {
  calculateDistance,
  calculateFare,
  generateOTP,
} from "../utils/mapUtils.js";

export const createRide = async (req, res) => {
  const { vehicle, pickup, drop, proposedPrice, suggestedPriceRange, pricingModel = "bidding" } = req.body;

  if (!vehicle || !pickup || !drop) {
    throw new BadRequestError("Vehicle, pickup, and drop details are required");
  }

  const {
    address: pickupAddress,
    latitude: pickupLat,
    longitude: pickupLon,
  } = pickup;

  const { address: dropAddress, latitude: dropLat, longitude: dropLon } = drop;

  if (
    !pickupAddress ||
    !pickupLat ||
    !pickupLon ||
    !dropAddress ||
    !dropLat ||
    !dropLon
  ) {
    throw new BadRequestError("Complete pickup and drop details are required");
  }

  if (pricingModel === "bidding" && !proposedPrice) {
    throw new BadRequestError("Proposed price is required for bidding model");
  }

  const customer = req.user;

  try {
    const distance = calculateDistance(pickupLat, pickupLon, dropLat, dropLon);
    const fare = calculateFare(distance);
    
    const rideData = {
      vehicle,
      distance,
      fare: proposedPrice || fare[vehicle],
      proposedPrice: proposedPrice || fare[vehicle],
      suggestedPriceRange: suggestedPriceRange || { min: 0, max: 0 },
      pricingModel,
      pickup: {
        address: pickupAddress,
        latitude: pickupLat,
        longitude: pickupLon,
      },
      drop: { address: dropAddress, latitude: dropLat, longitude: dropLon },
      customer: customer.id,
      status: pricingModel === "bidding" ? "AWAITING_OFFERS" : "SEARCHING_FOR_RIDER",
      otp: generateOTP(),
    };

    const ride = new Ride(rideData);
    await ride.save();

    res.status(StatusCodes.CREATED).json({
      message: pricingModel === "bidding" 
        ? "Ride request created. Waiting for driver offers..." 
        : "Ride created successfully",
      ride,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to create ride');
    throw new BadRequestError("Failed to create ride");
  }
};

export const acceptRide = async (req, res) => {
  const riderId = req.user.id;
  const { rideId } = req.params;

  if (!rideId) {
    throw new BadRequestError("Ride ID is required");
  }

  try {
    let ride = await Ride.findById(rideId).populate("customer");

    if (!ride) {
      throw new NotFoundError("Ride not found");
    }

    if (ride.status !== "SEARCHING_FOR_RIDER") {
      throw new BadRequestError("Ride is no longer available for assignment");
    }

    ride.rider = riderId;
    ride.status = "START";
    ride.acceptedAt = new Date();
    await ride.save();

    ride = await ride.populate({
      path: "rider",
      select: "name phone stats.rating stats.totalRatings stats.completedRides vehicle profilePhoto"
    });

    req.socket.to(`ride_${rideId}`).emit("rideUpdate", ride);
    req.socket.to(`ride_${rideId}`).emit("rideAccepted", {
      rider: {
        id: ride.rider._id,
        name: ride.rider.name,
        phone: ride.rider.phone,
        rating: ride.rider.stats.rating,
        totalRatings: ride.rider.stats.totalRatings,
        completedRides: ride.rider.stats.completedRides,
        vehicle: ride.rider.vehicle,
        profilePhoto: ride.rider.profilePhoto,
      },
      estimatedArrival: calculateETA(ride.pickup.latitude, ride.pickup.longitude)
    });

    res.status(StatusCodes.OK).json({
      message: "Ride accepted successfully",
      ride,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to accept ride');
    throw new BadRequestError("Failed to accept ride");
  }
};

const calculateETA = (pickupLat, pickupLon) => {
  const avgSpeed = 30;
  return 5 + Math.floor(Math.random() * 10);
};

export const updateRideStatus = async (req, res) => {
  const { rideId } = req.params;
  const { status } = req.body;

  if (!rideId || !status) {
    throw new BadRequestError("Ride ID and status are required");
  }

  try {
    let ride = await Ride.findById(rideId).populate("customer rider");

    if (!ride) {
      throw new NotFoundError("Ride not found");
    }

    if (!["START", "ARRIVED", "COMPLETED"].includes(status)) {
      throw new BadRequestError("Invalid ride status");
    }

    ride.status = status;

    if (status === "ARRIVED") {
      ride.arrivedAt = new Date();
    } else if (status === "COMPLETED") {
      ride.completedAt = new Date();
      const riderShare = (ride.fare || 0) * 0.8;
      const riderId = ride.rider?._id ?? ride.rider;
      if (riderId && riderShare > 0) {
        await User.findByIdAndUpdate(riderId, {
          $inc: {
            "earnings.total": riderShare,
            "earnings.available": riderShare,
          },
        });
        await EarningsTransaction.create({
          userId: riderId,
          amount: riderShare,
          type: "ride",
          referenceType: "Ride",
          referenceId: ride._id,
        });
      }
    }

    await ride.save();

    req.socket.to(`ride_${rideId}`).emit("rideUpdate", ride);

    res.status(StatusCodes.OK).json({
      message: `Ride status updated to ${status}`,
      ride,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to update ride status');
    throw new BadRequestError("Failed to update ride status");
  }
};

export const getRideById = async (req, res) => {
  const userId = req.user.id;
  const { rideId } = req.params;

  const ride = await Ride.findById(rideId)
    .populate('customer', 'name phone')
    .populate('rider', 'name phone');

  if (!ride) {
    throw new NotFoundError('Ride not found');
  }

  const isParticipant =
    ride.customer?._id?.toString() === userId ||
    ride.rider?._id?.toString() === userId;

  if (!isParticipant) {
    throw new NotFoundError('Ride not found');
  }

  res.status(StatusCodes.OK).json({ ride });
};

export const getMyRides = async (req, res) => {
  const userId = req.user.id;
  const { status } = req.query;

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  try {
    const query = {
      $or: [{ customer: userId }, { rider: userId }],
    };

    if (status) {
      query.status = status;
    }

    const [rides, total] = await Promise.all([
      Ride.find(query)
        .populate("customer", "name phone")
        .populate("rider", "name phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Ride.countDocuments(query),
    ]);

    res.status(StatusCodes.OK).json({
      message: "Rides retrieved successfully",
      count: rides.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      rides,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to retrieve rides');
    throw new BadRequestError("Failed to retrieve rides");
  }
};

export const submitOffer = async (req, res) => {
  const riderId = req.user.id;
  const { rideId } = req.params;
  const { offeredPrice, message } = req.body;

  if (!rideId || !offeredPrice) {
    throw new BadRequestError("Ride ID and offered price are required");
  }

  try {
    const ride = await Ride.findById(rideId).populate("customer");

    if (!ride) {
      throw new NotFoundError("Ride not found");
    }

    if (ride.status !== "AWAITING_OFFERS") {
      throw new BadRequestError("This ride is no longer accepting offers");
    }

    const existingOfferIndex = ride.offers.findIndex(
      offer => offer.riderId.toString() === riderId
    );

    if (existingOfferIndex !== -1) {
      ride.offers[existingOfferIndex] = {
        riderId,
        offeredPrice,
        message: message || "",
        status: "pending",
        createdAt: new Date(),
      };
    } else {
      ride.offers.push({
        riderId,
        offeredPrice,
        message: message || "",
        status: "pending",
      });
    }

    await ride.save();
    await ride.populate("offers.riderId");

    req.socket.to(`ride_${rideId}`).emit("newOffer", {
      rideId,
      offer: ride.offers[ride.offers.length - 1],
    });

    res.status(StatusCodes.OK).json({
      message: "Offer submitted successfully",
      ride,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to submit offer');
    throw new BadRequestError("Failed to submit offer");
  }
};

export const acceptOffer = async (req, res) => {
  const customerId = req.user.id;
  const { rideId, offerId } = req.params;

  if (!rideId || !offerId) {
    throw new BadRequestError("Ride ID and Offer ID are required");
  }

  try {
    let ride = await Ride.findById(rideId).populate("offers.riderId");

    if (!ride) {
      throw new NotFoundError("Ride not found");
    }

    if (ride.customer.toString() !== customerId) {
      throw new BadRequestError("Unauthorized to accept offers for this ride");
    }

    const offer = ride.offers.id(offerId);

    if (!offer) {
      throw new NotFoundError("Offer not found");
    }

    offer.status = "accepted";
    ride.acceptedOffer = {
      riderId: offer.riderId,
      finalPrice: offer.offeredPrice,
    };
    ride.rider = offer.riderId;
    ride.fare = offer.offeredPrice;
    ride.status = "START";

    ride.offers.forEach(o => {
      if (o._id.toString() !== offerId) {
        o.status = "rejected";
      }
    });

    await ride.save();
    await ride.populate("rider");

    req.socket.to(`ride_${rideId}`).emit("offerAccepted", ride);
    req.socket.to(`ride_${rideId}`).emit("rideAccepted");

    res.status(StatusCodes.OK).json({
      message: "Offer accepted successfully",
      ride,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to accept offer');
    throw new BadRequestError("Failed to accept offer");
  }
};

export const getRideOffers = async (req, res) => {
  const { rideId } = req.params;

  if (!rideId) {
    throw new BadRequestError("Ride ID is required");
  }

  try {
    const ride = await Ride.findById(rideId)
      .populate("offers.riderId", "name phone")
      .populate("customer", "name phone");

    if (!ride) {
      throw new NotFoundError("Ride not found");
    }

    res.status(StatusCodes.OK).json({
      offers: ride.offers,
      proposedPrice: ride.proposedPrice,
      suggestedPriceRange: ride.suggestedPriceRange,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch ride offers');
    throw new BadRequestError("Failed to fetch offers");
  }
};

export const rateRide = async (req, res) => {
  const userId = req.user.id;
  const { rideId } = req.params;
  const { rating, feedback } = req.body;

  if (!rideId || !rating) {
    throw new BadRequestError("Ride ID and rating are required");
  }

  if (rating < 1 || rating > 5) {
    throw new BadRequestError("Rating must be between 1 and 5");
  }

  try {
    const ride = await Ride.findById(rideId).populate("customer rider");

    if (!ride) {
      throw new NotFoundError("Ride not found");
    }

    const user = await User.findById(userId);
    const isRider = user.role === "rider";

    if (isRider) {
      if (ride.rider?.toString() !== userId) {
        throw new BadRequestError("You are not the rider for this ride");
      }
      ride.rating.customerRating = rating;
      ride.rating.riderFeedback = feedback || "";

      const customer = await User.findById(ride.customer);
      customer.stats.totalRatings += 1;
      customer.stats.rating = 
        (customer.stats.rating * (customer.stats.totalRatings - 1) + rating) / 
        customer.stats.totalRatings;
      await customer.save();
    } else {
      if (ride.customer?.toString() !== userId) {
        throw new BadRequestError("You are not the customer for this ride");
      }
      ride.rating.riderRating = rating;
      ride.rating.customerFeedback = feedback || "";

      const rider = await User.findById(ride.rider);
      rider.stats.totalRatings += 1;
      rider.stats.rating = 
        (rider.stats.rating * (rider.stats.totalRatings - 1) + rating) / 
        rider.stats.totalRatings;
      await rider.save();
    }

    await ride.save();

    res.status(StatusCodes.OK).json({
      message: "Rating submitted successfully",
      ride,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to submit rating');
    throw new BadRequestError("Failed to submit rating");
  }
};

export const getRatings = async (req, res) => {
  const userId = req.user.id;
  const isRider = req.user.role === 'rider';

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const query = {
    status: 'COMPLETED',
    $and: [
      { $or: [{ customer: userId }, { rider: userId }] },
      { $or: [
        { 'rating.riderRating': { $exists: true, $ne: null } },
        { 'rating.customerRating': { $exists: true, $ne: null } },
      ]},
    ],
  };

  const [rides, total] = await Promise.all([
    Ride.find(query)
      .select('pickup drop fare rating createdAt customer rider')
      .populate('customer', 'name')
      .populate('rider', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Ride.countDocuments(query),
  ]);

  const ratings = rides.map((ride) => {
    const isCustomer = ride.customer?._id?.toString() === userId;
    return {
      rideId: ride._id,
      date: ride.createdAt,
      pickupAddress: ride.pickup?.address,
      dropAddress: ride.drop?.address,
      fare: ride.fare,
      counterpart: isCustomer ? ride.rider : ride.customer,
      myRole: isCustomer ? 'customer' : 'rider',
      givenRating: isCustomer ? ride.rating?.riderRating : ride.rating?.customerRating,
      givenFeedback: isCustomer ? ride.rating?.customerFeedback : ride.rating?.riderFeedback,
      receivedRating: isCustomer ? ride.rating?.customerRating : ride.rating?.riderRating,
    };
  });

  res.status(StatusCodes.OK).json({
    ratings,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
};
