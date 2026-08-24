import express from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { createPayment } from "../controllers/paymentController.js";

const router = express.Router();
router.use(requireAuth);
router.post("/", asyncHandler(createPayment));
export default router;
