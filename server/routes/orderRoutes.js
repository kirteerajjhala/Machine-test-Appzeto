import express from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import {
  createOrder,
  listOrders,
  getOrder,
  cancelOrder,
} from "../controllers/orderController.js";

const router = express.Router();
router.use(requireAuth);
router.post("/", asyncHandler(createOrder));
router.get("/", asyncHandler(listOrders));
router.get("/:id", asyncHandler(getOrder));
router.post("/:id/cancel", asyncHandler(cancelOrder));

export default router;
