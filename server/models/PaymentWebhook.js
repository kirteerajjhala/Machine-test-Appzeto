import mongoose from "mongoose";

const paymentWebhookSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true, enum: ["MOCK"] },
    providerEventId: { type: String, required: true, trim: true },
    eventType: { type: String, required: true, trim: true },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      index: true,
    },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    processedAt: Date,
    processingError: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true, versionKey: false },
);

paymentWebhookSchema.index(
  { provider: 1, providerEventId: 1 },
  { unique: true },
);

const PaymentWebhook =
  mongoose.models.PaymentWebhook ||
  mongoose.model("PaymentWebhook", paymentWebhookSchema);
export default PaymentWebhook;
