import { useEffect, useState } from "react";
import { request } from "../../api/api.js";
import { money, numericMoney, imageUrl } from "../../utils/formatters.js";

export default function AdminPanel({ user, setNotice, confirmAction }) {
  const [tab, setTab] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    discount: 0,
    stock: 0,
    image: "",
  });

  const update = (key, value) => setForm((old) => ({ ...old, [key]: value }));

  const load = async () => {
    try {
      const [dashboard, productData, orderData] = await Promise.all([
        request("/admin/dashboard"),
        request("/products?limit=100"),
        request("/admin/orders"),
      ]);
      setStats(dashboard.data);
      setItems(productData.data.products);
      setOrders(orderData.data.orders);
    } catch (e) {
      setNotice(e.message);
    }
  };

  useEffect(() => {
    if (user?.role === "ADMIN") load();
  }, [user]);

  if (user?.role !== "ADMIN")
    return <section className="empty">Admin access required.</section>;

  const reset = () => {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      price: "",
      discount: 0,
      stock: 0,
      image: "",
    });
  };

  const edit = (item) => {
    setEditing(item._id);
    setForm({
      ...item,
      price: numericMoney(item.price),
      discount: item.discount || 0,
      stock: item.stock || 0,
      image: item.image || "",
    });
    setTab("products");
  };

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const productBody = {
        name: form.name,
        description: form.description || "",
        price: Number(form.price),
        discount: Number(form.discount || 0),
        stock: Number(form.stock || 0),
        image: form.image || "",
      };
      await request(editing ? `/products/${editing}` : "/products", {
        method: editing ? "PUT" : "POST",
        body: productBody,
      });
      setNotice(
        editing
          ? "Product updated successfully"
          : "Product created successfully",
      );
      reset();
      await load();
    } catch (e) {
      setNotice(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="admin">
      <div className="admin-head">
        <div>
          <span className="kicker">Control center</span>
          <h2>Admin workspace</h2>
        </div>
        <div className="admin-tabs">
          <button
            className={tab === "dashboard" ? "active" : ""}
            onClick={() => setTab("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={tab === "products" ? "active" : ""}
            onClick={() => setTab("products")}
          >
            Products
          </button>
          <button
            className={tab === "orders" ? "active" : ""}
            onClick={() => setTab("orders")}
          >
            Orders
          </button>
        </div>
      </div>

      {tab === "dashboard" && (
        <div className="metrics">
          {[
            ["Products", items.length],
            ["Orders", stats?.totalOrders || 0],
            ["Pending", stats?.pendingOrders || 0],
            ["Revenue", money(stats?.revenue)],
            ["Low stock", stats?.lowStockProducts || 0],
          ].map(([label, value]) => (
            <div className="metric" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      )}

      {tab === "products" && (
        <div className="admin-grid">
          <div className="admin-list">
            <div className="section-title">
              <h3>Catalog</h3>
              <button className="primary small" onClick={reset}>
                New product
              </button>
            </div>
            {items.map((item) => (
              <div className="admin-row" key={item._id}>
                <div>
                  <b>{item.name}</b>
                  <small>
                    Stock: {item.stock} · {item.discount > 0 ? `${item.discount}% OFF` : "No discount"}
                  </small>
                </div>
                <span>{money(item.price)}</span>
                <button onClick={() => edit(item)}>Edit</button>
                <button
                  onClick={() =>
                    confirmAction(
                      "Deactivate product?",
                      `Deactivate ${item.name}? It will be removed from the storefront.`,
                      "Deactivate",
                      async () => {
                        await request(`/products/${item._id}`, {
                          method: "DELETE",
                        });
                        setNotice("Product deactivated successfully");
                        await load();
                      },
                    )
                  }
                >
                  Deactivate
                </button>
              </div>
            ))}
          </div>

          <form className="admin-form" onSubmit={save}>
            <h3>{editing ? "Edit product" : "Create product"}</h3>
            <input
              required
              placeholder="Product Name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
            <textarea
              placeholder="Product Description"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows="3"
              style={{
                padding: "0.75rem",
                borderRadius: "8px",
                border: "1px solid var(--line, #e2e8f0)",
                background: "inherit",
                color: "inherit",
                resize: "vertical",
              }}
            />
            <input
              placeholder="Image URL (e.g. https://images.unsplash.com/...)"
              value={form.image}
              onChange={(e) => update("image", e.target.value)}
            />
            {form.image && (
              <img
                className="upload-preview"
                src={imageUrl(form.image)}
                alt="Product preview"
              />
            )}
            <div className="form-grid">
              <input
                required
                type="number"
                min="0"
                step="0.01"
                placeholder="Price"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
              />
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Discount %"
                value={form.discount}
                onChange={(e) => update("discount", e.target.value)}
              />
              <input
                required
                type="number"
                min="0"
                placeholder="Stock"
                value={form.stock}
                onChange={(e) => update("stock", e.target.value)}
              />
            </div>
            <div>
              <button className="primary" disabled={busy}>
                {busy
                  ? "Saving..."
                  : editing
                    ? "Save changes"
                    : "Create product"}
              </button>
              {editing && (
                <button type="button" className="link" onClick={reset}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {tab === "orders" && (
        <div className="orders">
          {orders.map((order) => (
            <article className="order" key={order._id}>
              <div>
                <span className="kicker">{order.user?.name || "Customer"}</span>
                <h2>{order.user?.email || ""}</h2>
              </div>
              <span className="status">{order.status}</span>
              <b>{money(order.totals?.finalTotal)}</b>
              <select
                value={order.status}
                onChange={async (event) => {
                  try {
                    await request(`/admin/orders/${order._id}/status`, {
                      method: "PATCH",
                      body: { status: event.target.value },
                    });
                    setNotice("Order status updated");
                    await load();
                  } catch (e) {
                    setNotice(e.message);
                  }
                }}
              >
                <option value={order.status}>{order.status}</option>
                <option value="PAYMENT_PROCESSING">PAYMENT_PROCESSING</option>
                <option value="PAID">PAID</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="SHIPPED">SHIPPED</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="REFUNDED">REFUNDED</option>
              </select>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
