import express from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  makeDefaultAddress,
} from "../controllers/addressController.js";

const router = express.Router();
router.use(requireAuth);
router.get("/", asyncHandler(listAddresses));
router.post("/", asyncHandler(createAddress));
router.put("/:id", asyncHandler(updateAddress));
router.delete("/:id", asyncHandler(deleteAddress));
router.patch("/:id/default", asyncHandler(makeDefaultAddress));

export default router;
