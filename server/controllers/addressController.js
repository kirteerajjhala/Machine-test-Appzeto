import mongoose from "mongoose";
import Address from "../models/Address.js";
import { ApiError } from "../middleware/errorHandler.js";
import { serializeAddress } from "../utils/serializers.js";

const addressFields = [
  "label",
  "fullName",
  "phone",
  "line1",
  "line2",
  "city",
  "state",
  "postalCode",
  "country",
  "isDefault",
];
const requiredFields = [
  "fullName",
  "phone",
  "line1",
  "city",
  "state",
  "postalCode",
  "country",
];

const validateAddressInput = (input, partial = false) => {
  const unknownFields = Object.keys(input).filter(
    (field) => !addressFields.includes(field),
  );
  const errors = {};
  if (unknownFields.length) errors.fields = unknownFields;

  for (const field of requiredFields) {
    if (!partial && (typeof input[field] !== "string" || !input[field].trim()))
      errors[field] = "This field is required";
    if (
      partial &&
      input[field] !== undefined &&
      (typeof input[field] !== "string" || !input[field].trim())
    )
      errors[field] = "This field must be a non-empty string";
  }
  for (const field of [
    "label",
    "line2",
    "fullName",
    "phone",
    "line1",
    "city",
    "state",
    "postalCode",
    "country",
  ]) {
    if (input[field] !== undefined && typeof input[field] !== "string")
      errors[field] = "This field must be a string";
  }
  if (input.isDefault !== undefined && typeof input.isDefault !== "boolean")
    errors.isDefault = "isDefault must be boolean";
  if (Object.keys(errors).length)
    throw new ApiError(400, "Invalid address data", errors);
};

const ensureValidId = (id) => {
  if (!mongoose.isValidObjectId(id))
    throw new ApiError(400, "Invalid address ID");
};

const unsetDefault = async (userId) => {
  await Address.updateMany(
    { user: userId, isDefault: true },
    { $set: { isDefault: false } },
  );
};

const setFirstAddressDefault = async (userId, address) => {
  const count = await Address.countDocuments({ user: userId });
  if (count === 1) address.isDefault = true;
};

export const listAddresses = async (req, res) => {
  const addresses = await Address.find({ user: req.user._id }).sort({
    isDefault: -1,
    createdAt: 1,
  });
  res.json({
    success: true,
    data: { addresses: addresses.map(serializeAddress) },
  });
};

export const createAddress = async (req, res) => {
  const input = req.body || {};
  validateAddressInput(input);
  const address = new Address({ ...input, user: req.user._id });
  await setFirstAddressDefault(req.user._id, address);
  if (address.isDefault) await unsetDefault(req.user._id);
  await address.save();
  res
    .status(201)
    .json({ success: true, data: { address: serializeAddress(address) } });
};

export const updateAddress = async (req, res) => {
  ensureValidId(req.params.id);
  const input = req.body || {};
  validateAddressInput(input, true);
  const address = await Address.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!address) throw new ApiError(404, "Address not found");

  Object.assign(address, input);
  if (input.isDefault === true) await unsetDefault(req.user._id);
  await address.save();
  res.json({ success: true, data: { address: serializeAddress(address) } });
};

export const deleteAddress = async (req, res) => {
  ensureValidId(req.params.id);
  const address = await Address.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!address) throw new ApiError(404, "Address not found");
  if (address.isDefault) {
    const replacement = await Address.findOne({ user: req.user._id }).sort({
      createdAt: 1,
    });
    if (replacement) {
      replacement.isDefault = true;
      await replacement.save();
    }
  }
  res.json({ success: true, message: "Address deleted successfully" });
};

export const makeDefaultAddress = async (req, res) => {
  ensureValidId(req.params.id);
  const address = await Address.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!address) throw new ApiError(404, "Address not found");
  await unsetDefault(req.user._id);
  address.isDefault = true;
  await address.save();
  res.json({ success: true, data: { address: serializeAddress(address) } });
};
