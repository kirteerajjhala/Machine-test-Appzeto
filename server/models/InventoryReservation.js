import mongoose from "mongoose";

const inventoryReservationSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: Number.isInteger,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "RELEASED", "CONSUMED", "EXPIRED"],
      default: "ACTIVE",
      index: true,
    },
    expiresAt: { type: Date, required: true, index: true },
    releasedAt: Date,
    consumedAt: Date,
  },
  { timestamps: true, versionKey: false },
);

inventoryReservationSchema.index({ status: 1, expiresAt: 1 });

const InventoryReservation =
  mongoose.models.InventoryReservation ||
  mongoose.model("InventoryReservation", inventoryReservationSchema);
export default InventoryReservation;
