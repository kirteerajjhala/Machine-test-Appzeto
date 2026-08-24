import express from "express";
import rateLimit from "express-rate-limit";
import asyncHandler from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
} from "../controllers/authController.js";

const router = express.Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 25,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many authentication attempts",
    },
  },
});

router.post("/register", authLimiter, asyncHandler(register));
router.post("/login", authLimiter, asyncHandler(login));
router.post("/logout", requireAuth, asyncHandler(logout));
router.get("/profile", requireAuth, asyncHandler(getProfile));
router.patch("/profile", requireAuth, asyncHandler(updateProfile));

export default router;
