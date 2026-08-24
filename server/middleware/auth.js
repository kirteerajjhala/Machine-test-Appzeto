import { ApiError } from "./errorHandler.js";

export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required"));
  }
  next();
};

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
