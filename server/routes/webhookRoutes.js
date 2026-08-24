import express from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { paymentWebhook } from "../controllers/paymentController.js";

const router = express.Router();
router.post("/payment", asyncHandler(paymentWebhook));
export default router;
