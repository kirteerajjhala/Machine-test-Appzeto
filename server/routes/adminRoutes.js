import express from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  dashboard,
  adminOrders,
  updateOrderStatus,
} from "../controllers/adminController.js";

const router = express.Router();
router.use(requireAuth, requireRole("ADMIN"));
router.get("/dashboard", asyncHandler(dashboard));
router.get("/orders", asyncHandler(adminOrders));
router.patch("/orders/:id/status", asyncHandler(updateOrderStatus));
export default router;
