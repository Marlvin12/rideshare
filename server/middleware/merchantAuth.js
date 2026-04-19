/**
 * merchantAuth middleware
 *
 * Verifies a Firebase ID token from a separately deployed merchant web app.
 * Distinct from the mobile JWT flow: merchant web sends the Firebase token per request.
 *
 * On success attaches req.user = { id, _id, email, role, restaurantId }.
 * Rejects with 401 if the token is missing or invalid, and 403 if the
 * verified user is not a merchant or has no linked restaurant.
 */

import admin from '../config/firebase.js';
import User from '../models/User.js';
import { UnauthenticatedError, UnauthorizedError } from '../errors/index.js';

export const requireMerchantFirebaseAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthenticatedError('Authorization header missing');
    }

    const token = authHeader.slice(7);
    const decoded = await admin.auth().verifyIdToken(token);

    const user = await User.findOne({ firebaseUid: decoded.uid }).lean();

    if (!user) {
      throw new UnauthenticatedError('Account not found. Complete sign-up first.');
    }

    if (user.role !== 'merchant') {
      throw new UnauthorizedError('Merchant access only');
    }

    req.user = {
      id: user._id,
      _id: user._id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      restaurantId: user.restaurantId ?? null,
    };

    next();
  } catch (err) {
    if (err.code && err.code.startsWith('auth/')) {
      return next(new UnauthenticatedError('Invalid or expired Firebase token'));
    }
    next(err);
  }
};

/**
 * optionalFirebaseAuth
 *
 * Same as requireMerchantFirebaseAuth but never rejects.
 * Attaches req.user if a valid token is present; otherwise continues
 * with req.user = undefined.
 */
export const optionalFirebaseAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.slice(7);
    const decoded = await admin.auth().verifyIdToken(token);
    const user = await User.findOne({ firebaseUid: decoded.uid }).lean();

    if (user) {
      req.user = {
        id: user._id,
        _id: user._id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        restaurantId: user.restaurantId ?? null,
      };
    }
  } catch (_) {
    // Non-fatal — proceed without user context
  }
  next();
};

export const requireLinkedRestaurant = (req, res, next) => {
  if (!req.user?.restaurantId) {
    return next(
      new UnauthorizedError(
        'No restaurant linked to this account. Await admin approval.'
      )
    );
  }
  next();
};
