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
      enum: ["USER", "CUSTOMER", "ADMIN"],
      default: "USER",
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, versionKey: false },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
