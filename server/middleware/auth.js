import { ApiError } from "./errorHandler.js";
import { verifyAccessToken } from "../config/auth.js";
import User from "../models/User.js";

export const authenticate = async (req, res, next) => {
  try {
    const header = req.get("authorization");
    if (!header?.startsWith("Bearer ")) {
      throw new ApiError(401, "Authentication required");
    }

    const token = header.slice(7).trim();
    if (!token) throw new ApiError(401, "Authentication required");
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (!user || !user.isActive)
      throw new ApiError(401, "Authentication required");

    req.user = user;
    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return next(new ApiError(401, "Invalid or expired token"));
    }
    next(error);
  }
};

export const requireAuth = authenticate;

export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "Insufficient permissions"));
    }
    next();
  };
