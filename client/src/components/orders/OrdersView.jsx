import { money } from "../../utils/formatters.js";

export default function OrdersView({ orders }) {
  return (
    <section className="orders">
      {orders.length ? (
        orders.map((order) => (
          <article className="order" key={order._id}>
            <div>
              <span className="kicker">Order #{order._id.slice(-8)}</span>
              <h2>
                {order.items.length} item
                {order.items.length > 1 ? "s" : ""}
              </h2>
            </div>
            <span className="status">{order.status}</span>
            <b>{money(order.totals?.finalTotal)}</b>
          </article>
        ))
      ) : (
        <div className="empty">No orders yet.</div>
      )}
    </section>
  );
}
