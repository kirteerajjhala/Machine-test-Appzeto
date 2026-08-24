import express from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
} from "../controllers/cartController.js";

const router = express.Router();
router.use(requireAuth);
router.get("/", asyncHandler(getCart));
router.post("/items", asyncHandler(addCartItem));
router.patch("/items/:id", asyncHandler(updateCartItem));
router.delete("/items/:id", asyncHandler(removeCartItem));

export default router;
