import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { ApiError } from "../middleware/errorHandler.js";

const toNumber = (value) => Number(value?.toString?.() ?? value ?? 0);

const validateQuantity = (quantity) => {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) {
    throw new ApiError(400, "Quantity must be an integer between 1 and 999");
  }
};

const validateProductId = (productId) => {
  if (!mongoose.isValidObjectId(productId))
    throw new ApiError(400, "Invalid product ID");
};

const findCart = (userId) => Cart.findOne({ user: userId });

const getStock = (product, variant) =>
  variant ? variant.stock : product.stock;

const findProductSelection = async (productId, variantId) => {
  validateProductId(productId);
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) throw new ApiError(404, "Product not found");

  let variant = null;
  if (variantId !== undefined && variantId !== null) {
    if (!mongoose.isValidObjectId(variantId))
      throw new ApiError(400, "Invalid variant ID");
    variant = product.variants.id(variantId);
    if (!variant || !variant.isActive)
      throw new ApiError(404, "Product variant not found");
  } else if (product.variants.length > 0) {
    throw new ApiError(400, "A variant is required for this product");
  }

  return { product, variant };
};

const serializeCart = (cart) => {
  let subtotal = 0;
  let discount = 0;
  const items = cart.items.map((item) => {
    const product = item.product;
    const variant = item.variantId
      ? product?.variants?.find(
          (entry) => entry._id.toString() === item.variantId.toString(),
        )
      : null;
    const price = toNumber(variant?.price ?? product?.price);
    const discountRate = toNumber(variant?.discount ?? product?.discount);
    const unitDiscount = price * (discountRate / 100);
    const lineSubtotal = price * item.quantity;
    subtotal += lineSubtotal;
    discount += unitDiscount * item.quantity;
    return {
      id: item._id.toString(),
      product: product
        ? {
            id: product._id.toString(),
            name: product.name,
            images: product.images,
            category: product.category,
            isActive: product.isActive,
          }
        : null,
      variant: variant
        ? {
            id: variant._id.toString(),
            sku: variant.sku,
            attributes: Object.fromEntries(variant.attributes),
            images: variant.images,
            isActive: variant.isActive,
          }
        : null,
      sku: item.variantSku || product?.sku,
      quantity: item.quantity,
      unitPrice: price,
      discount: discountRate,
      lineSubtotal,
      lineTotal: lineSubtotal - unitDiscount * item.quantity,
      availableStock: getStock(product, variant),
    };
  });

  return {
    id: cart._id.toString(),
    items,
    totals: { subtotal, discount, finalTotal: subtotal - discount },
    lastActivityAt: cart.lastActivityAt,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
};

const loadCartForResponse = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).populate("items.product");
  return cart || new Cart({ user: userId, items: [] });
};

export const getCart = async (req, res) => {
  const cart = await loadCartForResponse(req.user._id);
  res.json({ success: true, data: { cart: serializeCart(cart) } });
};

export const addCartItem = async (req, res) => {
  const { productId, variantId, quantity } = req.body || {};
  validateQuantity(quantity);
  const { product, variant } = await findProductSelection(productId, variantId);
  const stock = getStock(product, variant);
  if (quantity > stock)
    throw new ApiError(400, "Requested quantity exceeds available stock");

  let cart = await findCart(req.user._id);
  if (!cart) cart = new Cart({ user: req.user._id, items: [] });
  const existing = cart.items.find(
    (item) =>
      item.product.toString() === product._id.toString() &&
      (item.variantId?.toString() || null) ===
        (variant?._id.toString() || null),
  );
  if (existing) {
    validateQuantity(existing.quantity + quantity);
    if (existing.quantity + quantity > stock)
      throw new ApiError(400, "Requested quantity exceeds available stock");
    existing.quantity += quantity;
  } else {
    cart.items.push({
      product: product._id,
      variantId: variant?._id,
      variantSku: variant?.sku,
      quantity,
    });
  }
  cart.lastActivityAt = new Date();
  await cart.save();
  cart = await loadCartForResponse(req.user._id);
  res.status(201).json({ success: true, data: { cart: serializeCart(cart) } });
};

export const updateCartItem = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    throw new ApiError(400, "Invalid cart item ID");
  const { quantity } = req.body || {};
  validateQuantity(quantity);
  const cart = await findCart(req.user._id);
  if (!cart) throw new ApiError(404, "Cart item not found");
  const item = cart.items.id(req.params.id);
  if (!item) throw new ApiError(404, "Cart item not found");
  const { product, variant } = await findProductSelection(
    item.product,
    item.variantId,
  );
  if (quantity > getStock(product, variant))
    throw new ApiError(400, "Requested quantity exceeds available stock");
  item.quantity = quantity;
  cart.lastActivityAt = new Date();
  await cart.save();
  res.json({
    success: true,
    data: { cart: serializeCart(await loadCartForResponse(req.user._id)) },
  });
};

export const removeCartItem = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    throw new ApiError(400, "Invalid cart item ID");
  const cart = await findCart(req.user._id);
  if (!cart) throw new ApiError(404, "Cart item not found");
  const item = cart.items.id(req.params.id);
  if (!item) throw new ApiError(404, "Cart item not found");
  item.deleteOne();
  cart.lastActivityAt = new Date();
  await cart.save();
  res.json({
    success: true,
    data: { cart: serializeCart(await loadCartForResponse(req.user._id)) },
  });
};
