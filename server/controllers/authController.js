import bcrypt from "bcryptjs";
import { signAccessToken } from "../config/auth.js";
import User from "../models/User.js";
import { ApiError } from "../middleware/errorHandler.js";
import { serializeUser } from "../utils/serializers.js";

const normalizeEmail = (email) => email.trim().toLowerCase();

const validateEmail = (email) =>
  typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validatePassword = (password) =>
  typeof password === "string" &&
  password.length >= 8 &&
  password.length <= 128;

const validateName = (name) =>
  typeof name === "string" &&
  name.trim().length >= 2 &&
  name.trim().length <= 120;

export const register = async (req, res) => {
  const { name, email, password } = req.body || {};
  const errors = {};

  if (!validateName(name)) errors.name = "Name must be 2 to 120 characters";
  if (!validateEmail(email)) errors.email = "A valid email is required";
  if (!validatePassword(password))
    errors.password = "Password must be 8 to 128 characters";
  if (Object.keys(errors).length)
    throw new ApiError(400, "Invalid registration data", errors);

  const normalizedEmail = normalizeEmail(email);
  const existingUser = await User.findOne({ email: normalizedEmail }).select(
    "_id",
  );
  if (existingUser)
    throw new ApiError(409, "Email is already registered", {
      code: "EMAIL_EXISTS",
    });

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });
    const token = signAccessToken(user);
    res
      .status(201)
      .json({ success: true, data: { user: serializeUser(user), token } });
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, "Email is already registered", {
        code: "EMAIL_EXISTS",
      });
    }
    throw error;
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body || {};
  if (!validateEmail(email) || typeof password !== "string") {
    throw new ApiError(401, "Invalid email or password");
  }

  const user = await User.findOne({ email: normalizeEmail(email) }).select(
    "+passwordHash",
  );
  const passwordMatches =
    user && (await bcrypt.compare(password, user.passwordHash));
  if (!passwordMatches || !user.isActive)
    throw new ApiError(401, "Invalid email or password");

  const token = signAccessToken(user);
  res.json({ success: true, data: { user: serializeUser(user), token } });
};

export const logout = async (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
};

export const getProfile = async (req, res) => {
  res.json({ success: true, data: { user: serializeUser(req.user) } });
};

export const updateProfile = async (req, res) => {
  const allowedFields = ["name", "email"];
  const input = req.body || {};
  const unknownFields = Object.keys(input).filter(
    (field) => !allowedFields.includes(field),
  );
  if (unknownFields.length) {
    throw new ApiError(400, "Protected or unsupported profile fields", {
      fields: unknownFields,
    });
  }

  const updates = {};
  if (input.name !== undefined) {
    if (!validateName(input.name))
      throw new ApiError(400, "Name must be 2 to 120 characters");
    updates.name = input.name.trim();
  }
  if (input.email !== undefined) {
    if (!validateEmail(input.email))
      throw new ApiError(400, "A valid email is required");
    updates.email = normalizeEmail(input.email);
  }
  if (!Object.keys(updates).length)
    throw new ApiError(400, "No profile fields provided");

  try {
    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });
    if (!user) throw new ApiError(404, "User not found");
    res.json({ success: true, data: { user: serializeUser(user) } });
  } catch (error) {
    if (error?.code === 11000)
      throw new ApiError(409, "Email is already registered", {
        code: "EMAIL_EXISTS",
      });
    throw error;
  }
};
