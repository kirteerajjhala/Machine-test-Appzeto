import Product from "../models/Product.js";
import InventoryReservation from "../models/InventoryReservation.js";

const reservationWindowMs = 15 * 60 * 1000;

export const reserveOrderInventory = async (order, userId) => {
  const reservations = [];
  try {
    for (const item of order.items) {
      const filter = item.variantId
        ? {
            _id: item.product,
            variants: {
              $elemMatch: {
                _id: item.variantId,
                stock: { $gte: item.quantity },
                isActive: true,
              },
            },
          }
        : {
            _id: item.product,
            stock: { $gte: item.quantity },
            variants: { $size: 0 },
          };
      const update = item.variantId
        ? { $inc: { "variants.$[variant].stock": -item.quantity } }
        : { $inc: { stock: -item.quantity } };
      const options = item.variantId
        ? {
            arrayFilters: [
              {
                "variant._id": item.variantId,
                "variant.stock": { $gte: item.quantity },
                "variant.isActive": true,
              },
            ],
          }
        : {};
      const result = await Product.updateOne(filter, update, options);
      if (result.modifiedCount !== 1)
        throw new Error(`Insufficient stock for ${item.sku}`);
      reservations.push(
        await InventoryReservation.create({
          order: order._id,
          user: userId,
          product: item.product,
          variantId: item.variantId,
          sku: item.sku,
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
    if (!changed) continue;
    const update = reservation.variantId
      ? { $inc: { "variants.$[variant].stock": reservation.quantity } }
      : { $inc: { stock: reservation.quantity } };
    const options = reservation.variantId
      ? { arrayFilters: [{ "variant._id": reservation.variantId }] }
      : {};
    await Product.updateOne({ _id: reservation.product }, update, options);
  }
};

export const releaseExpiredReservations = async () => {
  const expired = await InventoryReservation.find({
    status: "ACTIVE",
    expiresAt: { $lte: new Date() },
  });
  await releaseReservations(expired);
  if (expired.length)
    console.log(`Released ${expired.length} expired inventory reservation(s)`);
};
