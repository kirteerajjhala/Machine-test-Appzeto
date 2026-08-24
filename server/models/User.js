import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["CUSTOMER", "ADMIN"],
      default: "CUSTOMER",
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, versionKey: false },
);

userSchema.index({ email: 1 }, { unique: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
