import User from "../models/User.js";
import logger from "../config/logger.js";
import { StatusCodes } from "http-status-codes";
import NotFoundError from "../errors/not-found.js";
import { BadRequestError, UnauthenticatedError } from "../errors/index.js";
import jwt from "jsonwebtoken";
import admin from "firebase-admin";

export const auth = async (req, res) => {
  const { phone, role } = req.body;

  if (!phone) {
    throw new BadRequestError("Phone number is required");
  }

  if (!role || !["customer", "rider", "merchant"].includes(role)) {
    throw new BadRequestError("Valid role is required (customer, rider, or merchant)");
  }

  try {
    let user = await User.findOne({ phone });

    if (user) {
      if (user.role !== role) {
        throw new BadRequestError("Phone number and role do not match");
      }

      const accessToken = user.createAccessToken();
      const refreshToken = user.createRefreshToken();

      return res.status(StatusCodes.OK).json({
        message: "User logged in successfully",
        user,
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }

    user = new User({
      phone,
      role,
    });

    await user.save();

    const accessToken = user.createAccessToken();
    const refreshToken = user.createRefreshToken();

    res.status(StatusCodes.CREATED).json({
      message: "User created successfully",
      user,
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  } catch (error) {
    logger.error({ err: error }, 'Auth error');
    throw error;
  }
};

export const firebaseAuth = async (req, res) => {
  const { firebaseToken, role, phone, uid, email: bodyEmail } = req.body;

  if (!firebaseToken) {
    throw new BadRequestError("Firebase token is required");
  }

  if (!role || !["customer", "rider", "merchant"].includes(role)) {
    throw new BadRequestError("Valid role is required (customer, rider, or merchant)");
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    
    if (decodedToken.uid !== uid) {
      throw new UnauthenticatedError("Invalid Firebase token");
    }

    let user = await User.findOne({ firebaseUid: uid });

    if (user) {
      if (user.role !== role) {
        throw new BadRequestError("Account role does not match the requested role");
      }

      const accessToken = user.createAccessToken();
      const refreshToken = user.createRefreshToken();

      return res.status(StatusCodes.OK).json({
        message: "User logged in successfully",
        user,
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }

    const resolvedEmail = bodyEmail || decodedToken.email || null;
    const resolvedPhone = phone || decodedToken.phone_number || null;

    user = new User({
      phone: resolvedPhone,
      email: resolvedEmail,
      role,
      firebaseUid: uid,
    });

    await user.save();

    const accessToken = user.createAccessToken();
    const refreshToken = user.createRefreshToken();

    res.status(StatusCodes.CREATED).json({
      message: "User created successfully",
      user,
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  } catch (error) {
    logger.error({ err: error }, 'Firebase auth error');
    if (error.code === 'auth/id-token-expired') {
      throw new UnauthenticatedError("Firebase token expired");
    }
    throw error;
  }
};

export const updateProfile = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  const {
    firstName,
    lastName,
    whatsapp,
    gender,
    residencyType,
    marketingOptOut,
  } = req.body;

  user.name = `${firstName} ${lastName}`.trim();
  if (typeof whatsapp === "string") {
    user.whatsapp = whatsapp || user.whatsapp;
  }
  if (gender) {
    user.gender = gender;
  }
  if (residencyType) {
    user.residencyType = residencyType;
  }
  if (typeof marketingOptOut === "boolean") {
    user.marketingOptOut = marketingOptOut;
  }

  await user.save();

  res.status(StatusCodes.OK).json({
    message: "Profile updated",
    user,
  });
};

export const refreshToken = async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    throw new BadRequestError("Refresh token is required");
  }

  try {
    const payload = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(payload.id);

    if (!user) {
      throw new UnauthenticatedError("Invalid refresh token");
    }

    const newAccessToken = user.createAccessToken();
    const newRefreshToken = user.createRefreshToken();

    res.status(StatusCodes.OK).json({
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    });
  } catch (error) {
    logger.error({ err: error }, 'Token refresh error');
    throw new UnauthenticatedError("Invalid refresh token");
  }
};
