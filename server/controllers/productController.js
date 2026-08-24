import mongoose from "mongoose";
import Product from "../models/Product.js";
import { ApiError } from "../middleware/errorHandler.js";
const fields = [
  "name",
  "description",
  "price",
  "discount",
  "stock",
  "image",
  "isActive",
];

const valid = (input, partial = false) => {
  const errors = {};
  if (!partial) {
    if (input.name === undefined || input.name === "")
      errors.name = "Product name is required";
    if (input.price === undefined || input.price === "")
      errors.price = "Product price is required";
  }

  if (
    input.name !== undefined &&
    (typeof input.name !== "string" || !input.name.trim())
  )
    errors.name = "Name must be a valid text";

  if (input.description !== undefined && typeof input.description !== "string")
    errors.description = "Description must be text";

  if (
    input.price !== undefined &&
    (!Number.isFinite(Number(input.price)) || Number(input.price) < 0)
  )
    errors.price = "Price must be a non-negative number";

  if (
    input.discount !== undefined &&
    (!Number.isFinite(Number(input.discount)) ||
      Number(input.discount) < 0 ||
      Number(input.discount) > 100)
  )
    errors.discount = "Discount must be between 0 and 100";

  if (
    input.stock !== undefined &&
    (!Number.isInteger(Number(input.stock)) || Number(input.stock) < 0)
  )
    errors.stock = "Stock must be a non-negative integer";

  if (Object.keys(errors).length)
    throw new ApiError(400, "Invalid product data", errors);
};

const parse = (req) => {
  const input = {};

  if (req.body?.name !== undefined) input.name = String(req.body.name).trim();
  if (req.body?.description !== undefined)
    input.description = String(req.body.description).trim();
  if (req.body?.image !== undefined) input.image = String(req.body.image).trim();
  if (req.body?.price !== undefined && req.body.price !== "")
    input.price = Number(req.body.price);
  if (req.body?.discount !== undefined && req.body.discount !== "")
    input.discount = Number(req.body.discount);
  else if (req.body?.discount === undefined && !req.params?.id)
    input.discount = 0;
  if (req.body?.stock !== undefined && req.body.stock !== "")
    input.stock = Number(req.body.stock);
  else if (req.body?.stock === undefined && !req.params?.id)
    input.stock = 0;
  if (req.body?.isActive !== undefined)
    input.isActive = req.body.isActive === true || req.body.isActive === "true";

  return input;
};
export const listProducts = async (req, res) => {
  const filter = { isActive: true };
  if (req.query.search) filter.$text = { $search: req.query.search };
  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json({
    success: true,
    data: {
      products,
      pagination: {
        page: 1,
        limit: products.length,
        total: products.length,
        pages: 1,
      },
    },
  });
};
export const getProduct = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    throw new ApiError(400, "Invalid product ID");
  const product = await Product.findOne({ _id: req.params.id, isActive: true });
  if (!product) throw new ApiError(404, "Product not found");
  res.json({ success: true, data: { product } });
};
export const createProduct = async (req, res) => {
  const input = parse(req);
  valid(input);
  try {
    const product = await Product.create(input);
    res.status(201).json({ success: true, data: { product } });
  } catch (error) {
    if (error.code === 11000) throw new ApiError(409, "Product already exists");
    throw error;
  }
};
export const updateProduct = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    throw new ApiError(400, "Invalid product ID");
  const input = parse(req);
  valid(input, true);
  const product = await Product.findByIdAndUpdate(req.params.id, input, {
    new: true,
    runValidators: true,
  });
  if (!product) throw new ApiError(404, "Product not found");
  res.json({ success: true, data: { product } });
};
export const deleteProduct = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    throw new ApiError(400, "Invalid product ID");
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true },
  );
  if (!product) throw new ApiError(404, "Product not found");
  res.json({ success: true, data: { product } });
};
