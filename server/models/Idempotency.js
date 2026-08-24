import mongoose from "mongoose";

const idempotencySchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    scope: { type: String, required: true, enum: ["ORDER", "PAYMENT"] },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    requestHash: { type: String, required: true },
    statusCode: { type: Number },
    responseBody: { type: mongoose.Schema.Types.Mixed },
    resourceId: { type: mongoose.Schema.Types.ObjectId },
    completedAt: Date,
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, versionKey: false },
);

idempotencySchema.index({ key: 1, scope: 1, user: 1 }, { unique: true });
idempotencySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Idempotency =
  mongoose.models.Idempotency ||
  mongoose.model("Idempotency", idempotencySchema);
export default Idempotency;
