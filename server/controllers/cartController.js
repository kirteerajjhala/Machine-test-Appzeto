import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { ApiError } from "../middleware/errorHandler.js";

const number = (value) => Number(value?.toString?.() ?? value ?? 0);
const quantity = (value) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 999)
    throw new ApiError(400, "Quantity must be an integer between 1 and 999");
};
const productForCart = async (id) => {
  if (!mongoose.isValidObjectId(id))
    throw new ApiError(400, "Invalid product ID");
  const product = await Product.findOne({ _id: id, isActive: true });
  if (!product) throw new ApiError(404, "Product not found");
  return product;
};
const render = (cart) => {
  let subtotal = 0;
  let discount = 0;
  const items = (cart?.items || [])
    .filter((item) => item?.product && typeof item.product === "object")
    .map((item) => {
      const product = item.product;
      const price = number(product.price);
      const rate = number(product.discount);
      const lineSubtotal = price * (item.quantity || 1);
      const lineDiscount = (lineSubtotal * rate) / 100;
      subtotal += lineSubtotal;
      discount += lineDiscount;
      return {
        id: item._id?.toString() || "",
        product: {
          id: product._id?.toString() || "",
          name: product.name || "",
          image: product.image || "",
          isActive: product.isActive !== false,
        },
        quantity: item.quantity || 1,
        unitPrice: price,
        discount: rate,
        lineSubtotal,
        lineTotal: lineSubtotal - lineDiscount,
        availableStock: product.stock || 0,
      };
    });
  return {
    id: cart?._id?.toString() || "",
    items,
    totals: { subtotal, discount, finalTotal: subtotal - discount },
    lastActivityAt: cart?.lastActivityAt || new Date(),
  };
};
const load = (user) => Cart.findOne({ user }).populate("items.product");

export const getCart = async (req, res) => {
  let cart = await load(req.user._id);
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }
  res.json({
    success: true,
    data: { cart: render(cart) },
  });
};

export const addCartItem = async (req, res) => {
  const { productId, quantity: rawCount = 1 } = req.body || {};
  const count = Number(rawCount || 1);
  quantity(count);
  const product = await productForCart(productId);
  if (count > product.stock)
    throw new ApiError(400, "Requested quantity exceeds available stock");

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = new Cart({ user: req.user._id, items: [] });

  const existingIndex = cart.items.findIndex(
    (entry) =>
      entry.product && entry.product.toString() === product._id.toString(),
  );

  if (existingIndex > -1) {
    const newQty = cart.items[existingIndex].quantity + count;
    quantity(newQty);
    if (newQty > product.stock)
      throw new ApiError(400, "Requested quantity exceeds available stock");
    cart.items[existingIndex].quantity = newQty;
  } else {
    cart.items.push({ product: product._id, quantity: count });
  }

  cart.lastActivityAt = new Date();
  await cart.save();

  const populated = await load(req.user._id);
  res
    .status(201)
    .json({ success: true, data: { cart: render(populated) } });
};

export const updateCartItem = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    throw new ApiError(400, "Invalid cart item ID");
  const { quantity: rawCount } = req.body || {};
  const count = Number(rawCount);
  quantity(count);

  const cart = await Cart.findOne({ user: req.user._id });
  const item = cart?.items.id(req.params.id);
  if (!item) throw new ApiError(404, "Cart item not found");

  const product = await productForCart(item.product);
  if (count > product.stock)
    throw new ApiError(400, "Requested quantity exceeds available stock");

  item.quantity = count;
  cart.lastActivityAt = new Date();
  await cart.save();

  const populated = await load(req.user._id);
  res.json({ success: true, data: { cart: render(populated) } });
};

export const removeCartItem = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    throw new ApiError(400, "Invalid cart item ID");
  const cart = await Cart.findOne({ user: req.user._id });
  const item = cart?.items.id(req.params.id);
  if (!item) throw new ApiError(404, "Cart item not found");

  cart.items.pull(req.params.id);
  cart.lastActivityAt = new Date();
  await cart.save();

  const populated = await load(req.user._id);
  res.json({ success: true, data: { cart: render(populated) } });
};
