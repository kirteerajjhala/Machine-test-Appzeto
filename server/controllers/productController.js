import mongoose from "mongoose";
import Product from "../models/Product.js";
import { ApiError } from "../middleware/errorHandler.js";

const productFields = [
  "name",
  "description",
  "images",
  "category",
  "price",
  "discount",
  "sku",
  "variants",
  "stock",
  "isActive",
];

const variantFields = [
  "sku",
  "attributes",
  "price",
  "discount",
  "stock",
  "images",
  "isActive",
];

const isNonNegativeNumber = (value) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const isStock = (value) => Number.isInteger(value) && value >= 0;

const normalizeSku = (sku) => sku.trim().toUpperCase();

const validateSku = (sku) =>
  typeof sku === "string" && /^[A-Z0-9][A-Z0-9._-]{0,63}$/i.test(sku.trim());

const validateImages = (images) =>
  Array.isArray(images) &&
  images.every((image) => typeof image === "string" && image.trim().length > 0);

const validateAttributes = (attributes) =>
  attributes &&
  !Array.isArray(attributes) &&
  typeof attributes === "object" &&
  Object.keys(attributes).length > 0 &&
  Object.entries(attributes).every(
    ([key, value]) =>
      typeof key === "string" &&
      key.trim().length > 0 &&
      typeof value === "string" &&
      value.trim().length > 0,
  );

const validateVariant = (variant, index) => {
  if (!variant || typeof variant !== "object" || Array.isArray(variant)) {
    return { [`variants.${index}`]: "Variant must be an object" };
  }

  const errors = {};
  const unknownFields = Object.keys(variant).filter(
    (field) => !variantFields.includes(field),
  );
  if (unknownFields.length) errors[`variants.${index}.fields`] = unknownFields;
  if (!validateSku(variant.sku))
    errors[`variants.${index}.sku`] = "A valid variant SKU is required";
  if (!validateAttributes(variant.attributes))
    errors[`variants.${index}.attributes`] =
      "At least one non-empty attribute is required";
  if (!isNonNegativeNumber(variant.price))
    errors[`variants.${index}.price`] =
      "Variant price must be a non-negative number";
  if (
    variant.discount !== undefined &&
    (!isNonNegativeNumber(variant.discount) || variant.discount > 100)
  )
    errors[`variants.${index}.discount`] =
      "Variant discount must be between 0 and 100";
  if (!isStock(variant.stock))
    errors[`variants.${index}.stock`] =
      "Variant stock must be a non-negative integer";
  if (variant.images !== undefined && !validateImages(variant.images))
    errors[`variants.${index}.images`] =
      "Variant images must be an array of non-empty strings";
  if (variant.isActive !== undefined && typeof variant.isActive !== "boolean")
    errors[`variants.${index}.isActive`] =
      "Variant active status must be boolean";
  return errors;
};

const validateProduct = (input, partial = false) => {
  const errors = {};
  const unknownFields = Object.keys(input).filter(
    (field) => !productFields.includes(field),
  );
  if (unknownFields.length) errors.fields = unknownFields;

  const requiredFields = ["name", "category", "price", "sku", "stock"];
  if (!partial) {
    for (const field of requiredFields) {
      if (
        input[field] === undefined ||
        input[field] === null ||
        input[field] === ""
      )
        errors[field] = "This field is required";
    }
  }
  for (const field of ["name", "description", "category"]) {
    if (
      input[field] !== undefined &&
      (typeof input[field] !== "string" || !input[field].trim())
    )
      errors[field] = "This field must be a non-empty string";
  }
  if (input.images !== undefined && !validateImages(input.images))
    errors.images = "Images must be an array of non-empty strings";
  if (input.price !== undefined && !isNonNegativeNumber(input.price))
    errors.price = "Price must be a non-negative number";
  if (
    input.discount !== undefined &&
    (!isNonNegativeNumber(input.discount) || input.discount > 100)
  )
    errors.discount = "Discount must be between 0 and 100";
  if (input.sku !== undefined && !validateSku(input.sku))
    errors.sku = "A valid SKU is required";
  if (input.stock !== undefined && !isStock(input.stock))
    errors.stock = "Stock must be a non-negative integer";
  if (input.isActive !== undefined && typeof input.isActive !== "boolean")
    errors.isActive = "Active status must be boolean";
  if (
    input.variants !== undefined &&
    (!Array.isArray(input.variants) || input.variants.length === 0)
  )
    errors.variants = "Variants must be a non-empty array when provided";

  if (Array.isArray(input.variants)) {
    input.variants.forEach((variant, index) =>
      Object.assign(errors, validateVariant(variant, index)),
    );
    const skus = input.variants
      .filter((variant) => validateSku(variant?.sku))
      .map((variant) => normalizeSku(variant.sku));
    if (new Set(skus).size !== skus.length)
      errors.variants = "Variant SKUs must be unique";
    if (input.sku && skus.includes(normalizeSku(input.sku)))
      errors.variants = "Product and variant SKUs must be unique";
  }

  if (Object.keys(errors).length)
    throw new ApiError(400, "Invalid product data", errors);
};

const handleProductError = (error) => {
  if (error?.code === 11000)
    return new ApiError(409, "SKU is already in use", {
      code: "DUPLICATE_SKU",
    });
  return error;
};

export const listProducts = async (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(
    Math.max(Number.parseInt(req.query.limit, 10) || 20, 1),
    100,
  );
  const filter = { isActive: true };
  if (typeof req.query.category === "string" && req.query.category.trim())
    filter.category = req.query.category.trim();
  if (typeof req.query.search === "string" && req.query.search.trim())
    filter.$text = { $search: req.query.search.trim() };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);
  res.json({
    success: true,
    data: {
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
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
  const input = req.body || {};
  validateProduct(input);
  try {
    const product = await Product.create({
      ...input,
      sku: normalizeSku(input.sku),
      variants: input.variants?.map((variant) => ({
        ...variant,
        sku: normalizeSku(variant.sku),
      })),
    });
    res.status(201).json({ success: true, data: { product } });
  } catch (error) {
    throw handleProductError(error);
  }
};

export const updateProduct = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    throw new ApiError(400, "Invalid product ID");
  const input = req.body || {};
  validateProduct(input, true);
  const updates = { ...input };
  if (updates.sku) updates.sku = normalizeSku(updates.sku);
  if (updates.variants)
    updates.variants = updates.variants.map((variant) => ({
      ...variant,
      sku: normalizeSku(variant.sku),
    }));
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!product) throw new ApiError(404, "Product not found");
    res.json({ success: true, data: { product } });
  } catch (error) {
    throw handleProductError(error);
  }
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
