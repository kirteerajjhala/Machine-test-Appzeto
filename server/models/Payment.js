import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    provider: { type: String, default: "MOCK", enum: ["MOCK"] },
    providerPaymentId: { type: String, trim: true, sparse: true, unique: true },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "TIMEOUT", "REFUNDED"],
      default: "PENDING",
      index: true,
    },
    amount: { type: mongoose.Schema.Types.Decimal128, required: true, min: 0 },
    currency: {
      type: String,
      default: "USD",
      uppercase: true,
      trim: true,
      maxlength: 3,
    },
    idempotencyKey: { type: String, trim: true },
    failureReason: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true, versionKey: false },
);

paymentSchema.index(
  { user: 1, idempotencyKey: 1 },
  { unique: true, sparse: true },
);

const Payment =
  mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
export default Payment;
