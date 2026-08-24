import Order from "../models/Order.js";
import Product from "../models/Product.js";

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
