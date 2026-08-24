import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { ApiError } from "../middleware/errorHandler.js";

const transitions = {
  PENDING: ["PAYMENT_PROCESSING", "CANCELLED"],
  PAYMENT_PROCESSING: ["PAID", "PAYMENT_FAILED", "CANCELLED"],
  PAID: ["PROCESSING", "REFUNDED"],
  PROCESSING: ["SHIPPED", "REFUNDED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  PAYMENT_FAILED: ["PAYMENT_PROCESSING", "CANCELLED"],
  CANCELLED: [],
  REFUNDED: [],
};

export const dashboard = async (req, res) => {
  const [
    totalOrders,
    pendingOrders,
    failedPayments,
    lowStockProducts,
    revenue,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({
      status: { $in: ["PENDING", "PAYMENT_PROCESSING"] },
    }),
    Order.countDocuments({ status: "PAYMENT_FAILED" }),
    Product.countDocuments({ isActive: true, stock: { $lte: 5 } }),
    Order.aggregate([
      { $match: { status: { $nin: ["CANCELLED", "PAYMENT_FAILED"] } } },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: "$totals.finalTotal" } },
        },
      },
    ]),
  ]);
  res.json({
    success: true,
    data: {
      totalOrders,
      pendingOrders,
      failedPayments,
      lowStockProducts,
      revenue: revenue[0]?.total || 0,
    },
  });
};

export const adminOrders = async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const orders = await Order.find(filter)
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .limit(100);
  res.json({ success: true, data: { orders } });
};

export const updateOrderStatus = async (req, res) => {
  const { status } = req.body || {};
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found");
  if (!transitions[order.status]?.includes(status)) throw new ApiError(409, `Invalid transition from ${order.status} to ${status}`);
  order.status = status;
  await order.save();
  res.json({ success: true, data: { order } });
};
