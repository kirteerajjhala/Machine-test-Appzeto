import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Address from "../models/Address.js";
import Order from "../models/Order.js";
import { ApiError } from "../middleware/errorHandler.js";

const money = (value) =>
  Math.round(Number(value?.toString?.() ?? value ?? 0) * 100) / 100;
const decimal = (value) => money(value).toFixed(2);

const getAddressSnapshot = (address) => ({
  fullName: address.fullName,
  phone: address.phone,
  line1: address.line1,
  line2: address.line2,
  city: address.city,
  state: address.state,
  postalCode: address.postalCode,
  country: address.country,
});

const loadCheckoutLines = async (cart) => {
  const lines = [];
  for (const cartItem of cart.items) {
    const product = await Product.findOne({
      _id: cartItem.product,
      isActive: true,
    });
    if (!product)
      throw new ApiError(409, "A cart product is no longer available");
    const variant = cartItem.variantId
      ? product.variants.id(cartItem.variantId)
      : null;
    if (product.variants.length > 0 && (!variant || !variant.isActive)) {
      throw new ApiError(409, "A cart variant is no longer available");
    }
    const price = money(variant?.price ?? product.price);
    const discountRate = money(variant?.discount ?? product.discount);
    const lineSubtotal = money(price * cartItem.quantity);
    const lineDiscount = money((lineSubtotal * discountRate) / 100);
    lines.push({
      product,
      variant,
      sku: variant?.sku || product.sku,
      name: product.name,
      attributes: variant?.attributes,
      quantity: cartItem.quantity,
      unitPrice: decimal(price),
      discount: decimal(lineDiscount),
      lineTotal: decimal(lineSubtotal - lineDiscount),
    });
  }
  return lines;
};

export const createOrder = async (req, res) => {
  const { addressId } = req.body || {};
  if (!mongoose.isValidObjectId(addressId))
    throw new ApiError(400, "A valid addressId is required");
  const address = await Address.findOne({ _id: addressId, user: req.user._id });
  if (!address) throw new ApiError(404, "Address not found");

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0)
    throw new ApiError(400, "Cart is empty");
  const lines = await loadCheckoutLines(cart);
  const subtotal = money(
    lines.reduce(
      (total, line) => total + money(line.unitPrice) * line.quantity,
      0,
    ),
  );
  const discount = money(
    lines.reduce((total, line) => total + money(line.discount), 0),
  );
  const taxRate = Number.parseFloat(process.env.TAX_RATE || "0.1");
  const shipping =
    subtotal - discount >=
    Number.parseFloat(process.env.FREE_SHIPPING_THRESHOLD || "100")
      ? 0
      : Number.parseFloat(process.env.SHIPPING_FEE || "10");
  const tax = money((subtotal - discount) * taxRate);
  const finalTotal = money(subtotal - discount + tax + shipping);

  const order = await Order.create({
    user: req.user._id,
    items: lines.map((line) => ({
      product: line.product._id,
      variantId: line.variant?._id,
      sku: line.sku,
      name: line.name,
      attributes: line.attributes
        ? Object.fromEntries(line.attributes)
        : undefined,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      discount: line.discount,
      lineTotal: line.lineTotal,
    })),
    status: "PENDING",
    totals: {
      subtotal: decimal(subtotal),
      discount: decimal(discount),
      tax: decimal(tax),
      shipping: decimal(shipping),
      finalTotal: decimal(finalTotal),
    },
    shippingAddress: getAddressSnapshot(address),
  });

  await Cart.updateOne(
    { _id: cart._id, user: req.user._id },
    { $set: { items: [], lastActivityAt: new Date() } },
  );
  res.status(201).json({ success: true, data: { order } });
};

export const listOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({
    createdAt: -1,
  });
  res.json({ success: true, data: { orders } });
};

export const getOrder = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    throw new ApiError(400, "Invalid order ID");
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new ApiError(404, "Order not found");
  res.json({ success: true, data: { order } });
};

export const cancelOrder = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    throw new ApiError(400, "Invalid order ID");
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new ApiError(404, "Order not found");
  if (!["PENDING", "PAYMENT_FAILED"].includes(order.status))
    throw new ApiError(409, "Order cannot be cancelled in its current state");
  order.status = "CANCELLED";
  order.cancelledAt = new Date();
  await order.save();
  res.json({ success: true, data: { order } });
};
