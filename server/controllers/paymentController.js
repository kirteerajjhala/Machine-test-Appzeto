import crypto from "node:crypto";
import mongoose from "mongoose";
import Payment from "../models/Payment.js";
import Order from "../models/Order.js";
import PaymentWebhook from "../models/PaymentWebhook.js";
import Idempotency from "../models/Idempotency.js";
import { ApiError } from "../middleware/errorHandler.js";

const amountOf = (value) => Number(value?.toString?.() ?? value ?? 0);
const outcomeStatus = {
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  TIMEOUT: "TIMEOUT",
};

export const createPayment = async (req, res) => {
  const key = req.get("Idempotency-Key");
  const { orderId, outcome = "SUCCESS" } = req.body || {};
  if (!key || key.length > 200)
    throw new ApiError(400, "Idempotency-Key header is required");
  if (!mongoose.isValidObjectId(orderId))
    throw new ApiError(400, "Valid orderId is required");
  if (!Object.prototype.hasOwnProperty.call(outcomeStatus, outcome))
    throw new ApiError(400, "Outcome must be SUCCESS, FAILED, or TIMEOUT");
  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) throw new ApiError(404, "Order not found");
  const requestHash = crypto
    .createHash("sha256")
    .update(JSON.stringify({ orderId, outcome }))
    .digest("hex");
  const existingKey = await Idempotency.findOne({
    key,
    scope: "PAYMENT",
    user: req.user._id,
  });
  if (existingKey) {
    if (existingKey.requestHash !== requestHash)
      throw new ApiError(409, "Idempotency key was reused with different data");
    return res
      .status(existingKey.statusCode || 200)
      .json(existingKey.responseBody);
  }
  const result = {
    success: true,
    data: {
      payment: {
        order: order._id,
        status: outcome,
        amount: order.totals.finalTotal,
      },
    },
  };
  const payment = await Payment.findOneAndUpdate(
    { order: order._id },
    {
      $setOnInsert: {
        order: order._id,
        user: req.user._id,
        amount: order.totals.finalTotal,
        currency: "USD",
      },
      $set: {
        status: outcome,
        idempotencyKey: key,
        provider: "MOCK",
        providerPaymentId: `mock_${crypto.randomUUID()}`,
        failureReason:
          outcome === "SUCCESS"
            ? undefined
            : `Mock payment ${outcome.toLowerCase()}`,
      },
    },
    { upsert: true, new: true, runValidators: true },
  );
  payment.status = outcome;
  result.data.payment = payment;
  const statusCode = 200;
  await Idempotency.create({
    key,
    scope: "PAYMENT",
    user: req.user._id,
    requestHash,
    statusCode,
    responseBody: result,
    resourceId: payment._id,
    completedAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  if (outcome === "SUCCESS")
    await Order.updateOne(
      { _id: order._id, status: "PENDING" },
      { $set: { status: "PAID", paidAt: new Date() } },
    );
  if (outcome === "FAILED")
    await Order.updateOne(
      { _id: order._id, status: "PENDING" },
      { $set: { status: "PAYMENT_FAILED" } },
    );
  res.status(statusCode).json(result);
};

export const paymentWebhook = async (req, res) => {
  const { eventId, paymentId, status } = req.body || {};
  if (!eventId || !paymentId || !Object.values(outcomeStatus).includes(status))
    throw new ApiError(400, "eventId, paymentId and valid status are required");
  try {
    const event = await PaymentWebhook.create({
      provider: "MOCK",
      providerEventId: eventId,
      eventType: `payment.${status.toLowerCase()}`,
      payment: paymentId,
      payload: req.body,
      processedAt: new Date(),
    });
    const payment = await Payment.findById(paymentId);
    if (payment) {
      payment.status = status;
      await payment.save();
      await Order.updateOne(
        {
          _id: payment.order,
          status: { $in: ["PENDING", "PAYMENT_PROCESSING"] },
        },
        {
          $set: {
            status: status === "SUCCESS" ? "PAID" : "PAYMENT_FAILED",
            ...(status === "SUCCESS" ? { paidAt: new Date() } : {}),
          },
        },
      );
    }
    return res
      .status(200)
      .json({
        success: true,
        data: { received: true, eventId: event.providerEventId },
      });
  } catch (error) {
    if (error?.code === 11000)
      return res
        .status(200)
        .json({
          success: true,
          data: { received: true, duplicate: true, eventId },
        });
    throw error;
  }
};
