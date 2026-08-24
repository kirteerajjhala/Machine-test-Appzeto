# Backend foundation

## Inventory consistency

Inventory reservation logic will update stock with a conditional atomic operation, for example:

```js
Product.updateOne(
  { _id: productId, stock: { $gte: quantity } },
  { $inc: { stock: -quantity } },
);
```

Only a result with `modifiedCount: 1` reserves stock. MongoDB serializes concurrent writes to the same document, so requests that arrive after stock reaches zero fail instead of producing a negative value. For variants, the same rule applies to the matching `variants` element using a filtered positional update.

Order creation, reservation creation, and cart clearing should later run in a MongoDB transaction. `InventoryReservation` stores the order, SKU, quantity, status, and `expiresAt`; a background job can find active expired reservations, atomically mark them released, and increment the matching stock. Reservation release and consumption must use conditional status filters so either operation is applied once.

## Idempotency

Order and payment requests use a unique `(user, scope, key)` record with a request hash and stored response. A repeated key with the same hash returns the stored response; reuse with a different hash is rejected.

Payment webhook deliveries use a unique `(provider, providerEventId)` index. The webhook record is created before its effect is applied, allowing duplicate deliveries to be recognized and ignored by the later webhook service.
