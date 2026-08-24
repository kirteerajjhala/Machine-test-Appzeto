import { money, imageUrl } from "../../utils/formatters.js";

export default function CartView({
  cart,
  updateItem,
  removeItem,
  confirmAction,
  onContinueCheckout,
}) {
  return (
    <section className="split">
      <div className="list">
        {cart?.items?.length ? (
          cart.items.map((item) => (
            <div className="line" key={item.id}>
              {(item.product?.image || item.product?.images?.[0]) && (
                <img
                  className="thumb"
                  src={imageUrl(item.product.image || item.product.images[0])}
                  alt=""
                />
              )}
              <div>
                <h3>{item.product?.name}</h3>
                <small>
                  {item.discount > 0 ? (
                    <>
                      <span
                        style={{
                          textDecoration: "line-through",
                          opacity: 0.6,
                          marginRight: "0.4rem",
                        }}
                      >
                        {money(item.unitPrice)}
                      </span>
                      <b>
                        {money(
                          Number(item.unitPrice) * (1 - item.discount / 100),
                        )}
                      </b>
                      <span
                        style={{
                          color: "#16a34a",
                          marginLeft: "0.4rem",
                          fontWeight: "600",
                        }}
                      >
                        ({item.discount}% off)
                      </span>
                    </>
                  ) : (
                    money(item.unitPrice)
                  )}
                </small>
              </div>
              <div className="quantity">
                <button
                  onClick={() =>
                    item.quantity > 1
                      ? updateItem(item.id, item.quantity - 1)
                      : confirmAction(
                          "Remove item?",
                          `Remove ${item.product?.name || "this item"} from your cart?`,
                          "Remove",
                          () => removeItem(item.id),
                        )
                  }
                >
                  −
                </button>
                <span>{item.quantity}</span>
                <button
                  onClick={() => updateItem(item.id, item.quantity + 1)}
                >
                  +
                </button>
              </div>
              <b>{money(item.lineTotal)}</b>
              <button
                className="cart-remove-btn"
                title="Remove item from cart"
                onClick={() =>
                  confirmAction(
                    "Remove item?",
                    `Are you sure you want to remove "${item.product?.name || "this item"}" from your bag?`,
                    "Remove",
                    () => removeItem(item.id),
                  )
                }
              >
                ✕ Remove
              </button>
            </div>
          ))
        ) : (
          <div className="empty">
            Your bag is empty. Start with something useful.
          </div>
        )}
      </div>
      <aside className="summary">
        <span className="kicker">Order summary</span>
        <div>
          <span>Subtotal</span>
          <b>{money(cart?.totals?.subtotal)}</b>
        </div>
        <div>
          <span>Discount</span>
          <b>−{money(cart?.totals?.discount)}</b>
        </div>
        <div className="grand">
          <span>Total</span>
          <b>{money(cart?.totals?.finalTotal)}</b>
        </div>
        <button
          className="primary"
          disabled={!cart?.items?.length}
          onClick={onContinueCheckout}
        >
          Continue to checkout
        </button>
      </aside>
    </section>
  );
}
