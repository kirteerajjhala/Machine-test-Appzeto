import Product from "../models/Product.js";
import InventoryReservation from "../models/InventoryReservation.js";
const reservationWindowMs = 15 * 60 * 1000;
export const reserveOrderInventory = async (order, userId) => {
  const reservations = [];
  try {
    for (const item of order.items) {
      const productId = item.product?._id || item.product;
      const result = await Product.updateOne(
        {
          _id: productId,
          stock: { $gte: item.quantity },
          isActive: { $ne: false },
        },
        { $inc: { stock: -item.quantity } },
      );
      if (result.modifiedCount !== 1)
        throw new Error(`Insufficient stock for ${item.name}`);
      reservations.push(
        await InventoryReservation.create({
          order: order._id,
          user: userId,
          product: productId,
          quantity: item.quantity,
          expiresAt: new Date(Date.now() + reservationWindowMs),
        }),
      );
    }
    return reservations;
  } catch (error) {
    await releaseReservations(reservations);
    throw error;
  }
};
export const releaseReservations = async (reservations) => {
  for (const reservation of reservations) {
    const changed = await InventoryReservation.findOneAndUpdate(
      { _id: reservation._id, status: "ACTIVE" },
      { $set: { status: "RELEASED", releasedAt: new Date() } },
      { new: true },
    );
    if (changed)
      await Product.updateOne(
        { _id: reservation.product },
        { $inc: { stock: reservation.quantity } },
      );
  }
};
export const releaseExpiredReservations = async () => {
  const expired = await InventoryReservation.find({
    status: "ACTIVE",
    expiresAt: { $lte: new Date() },
  });
  await releaseReservations(expired);
};
