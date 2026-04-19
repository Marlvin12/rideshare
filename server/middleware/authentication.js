import jwt from "jsonwebtoken";
import User from "../models/User.js";
import NotFoundError from "../errors/not-found.js";
import UnauthenticatedError from "../errors/unauthenticated.js";

const auth = async (req, res, next) => {
  if (!process.env.ACCESS_TOKEN_SECRET) {
    throw new UnauthenticatedError("Server configuration error");
  }
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    throw new UnauthenticatedError("Authentication invalid");
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(payload.id);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    req.user = {
      id: user._id,
      _id: user._id,
      phone: user.phone,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId ?? null,
    };
    req.socket = req.io;

    next();
  } catch (error) {
    throw new UnauthenticatedError("Authentication invalid");
  }
};

export default auth;
