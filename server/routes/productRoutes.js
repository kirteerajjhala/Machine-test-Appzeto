import express from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { productImageFields } from "../middleware/upload.js";
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

const router = express.Router();

router.get("/", asyncHandler(listProducts));
router.get("/:id", asyncHandler(getProduct));
router.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  productImageFields,
  asyncHandler(createProduct),
);
router.put(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  productImageFields,
  asyncHandler(updateProduct),
);
router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(deleteProduct),
);

export default router;
