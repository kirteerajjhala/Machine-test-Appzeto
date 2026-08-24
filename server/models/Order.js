import mongoose from "mongoose";

export const ORDER_STATUSES = [
  "PENDING",
  "PAYMENT_PROCESSING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "PAYMENT_FAILED",
  "CANCELLED",
  "REFUNDED",
];

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variantId: { type: mongoose.Schema.Types.ObjectId },
    sku: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    attributes: { type: Map, of: String },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: Number.isInteger,
    },
    unitPrice: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      min: 0,
    },
    discount: { type: mongoose.Schema.Types.Decimal128, default: 0, min: 0 },
    lineTotal: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: (value) => value.length > 0,
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "PENDING",
      index: true,
    },
    totals: {
      subtotal: {
        type: mongoose.Schema.Types.Decimal128,
        required: true,
        min: 0,
      },
      discount: {
        type: mongoose.Schema.Types.Decimal128,
        required: true,
        min: 0,
      },
      tax: { type: mongoose.Schema.Types.Decimal128, required: true, min: 0 },
      shipping: {
        type: mongoose.Schema.Types.Decimal128,
        required: true,
        min: 0,
      },
      finalTotal: {
        type: mongoose.Schema.Types.Decimal128,
        required: true,
        min: 0,
      },
    },
    shippingAddress: { type: mongoose.Schema.Types.Mixed, required: true },
    idempotencyKey: { type: String, trim: true },
    cancelledAt: Date,
    paidAt: Date,
    deliveredAt: Date,
  },
  { timestamps: true, versionKey: false },
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index(
  { user: 1, idempotencyKey: 1 },
  { unique: true, sparse: true },
);

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;
