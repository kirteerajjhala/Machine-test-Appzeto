import { useEffect, useState } from "react";
import "./App.css";
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

const API = "http://localhost:5000/api";
const request = async (path, options = {}) => {
  const token = localStorage.getItem("token");
  const response = await fetch(API + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Request failed");
  return data;
};
const money = (v) => Number(v?.$numberDecimal || v || 0).toFixed(2);

function AdminPanel({ user, setNotice }) {
  const [tab, setTab] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", category: "", price: "", discount: 0, sku: "", stock: 0, images: "", variants: [] });
  const [busy, setBusy] = useState(false);
  const update = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  const load = async () => {
    try {
      const [dashboard, productData, orderData] = await Promise.all([request("/admin/dashboard"), request("/products?limit=100"), request("/admin/orders")]);
      setStats(dashboard.data); setItems(productData.data.products); setOrders(orderData.data.orders);
    } catch (e) { setNotice(e.message); }
  };
  useEffect(() => { if (user?.role === "ADMIN") load(); }, [user]);
  if (user?.role !== "ADMIN") return <section className="empty">Admin access required.</section>;
  const reset = () => { setEditing(null); setForm({ name: "", description: "", category: "", price: "", discount: 0, sku: "", stock: 0, images: "", variants: [] }); };
  const edit = (item) => { setEditing(item._id); setForm({ ...item, price: money(item.price), images: (item.images || []).join(", "), variants: (item.variants || []).map((v) => ({ ...v, price: money(v.price), attributes: Object.entries(v.attributes || {}).map(([key, value]) => `${key}=${value}`).join(", ") })) }); setTab("products"); };
  const save = async (event) => { event.preventDefault(); setBusy(true); try { const body = { ...form, price: Number(form.price), discount: Number(form.discount), stock: Number(form.stock), images: form.images.split(",").map((x) => x.trim()).filter(Boolean), variants: form.variants.map((v) => ({ sku: v.sku, attributes: Object.fromEntries(v.attributes.split(",").map((pair) => pair.trim().split("=")).filter((pair) => pair.length === 2)), price: Number(v.price), discount: Number(v.discount), stock: Number(v.stock), images: (v.images || "").split(",").map((x) => x.trim()).filter(Boolean), isActive: v.isActive !== false })) }; await request(editing ? `/products/${editing}` : "/products", { method: editing ? "PUT" : "POST", body }); setNotice(editing ? "Product updated" : "Product created"); reset(); await load(); } catch (e) { setNotice(e.message); } finally { setBusy(false); } };
  const addVariant = () => update("variants", [...form.variants, { sku: "", attributes: "size=Small, color=Black", price: form.price || 0, discount: 0, stock: 0, images: "", isActive: true }]);
  const patchVariant = (index, key, value) => update("variants", form.variants.map((variant, i) => i === index ? { ...variant, [key]: value } : variant));
  return <section className="admin"><div className="admin-head"><div><span className="kicker">Control center</span><h2>Admin workspace</h2></div><div className="admin-tabs"><button className={tab === "dashboard" ? "active" : ""} onClick={() => setTab("dashboard")}>Dashboard</button><button className={tab === "products" ? "active" : ""} onClick={() => setTab("products")}>Products</button><button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>Orders</button></div></div>{tab === "dashboard" && <div className="metrics">{[["Products", items.length], ["Orders", stats?.totalOrders || 0], ["Pending", stats?.pendingOrders || 0], ["Revenue", `$${money(stats?.revenue)}`], ["Low stock", stats?.lowStockProducts || 0]].map(([label, value]) => <div className="metric" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>}{tab === "products" && <div className="admin-grid"><div className="admin-list"><div className="section-title"><h3>Catalog</h3><button className="primary small" onClick={reset}>New product</button></div>{items.map((item) => <div className="admin-row" key={item._id}><div><b>{item.name}</b><small>{item.sku} · {item.category}</small></div><span>${money(item.price)}</span><button onClick={() => edit(item)}>Edit</button><button onClick={async () => { await request(`/products/${item._id}`, { method: "DELETE" }); setNotice("Product deactivated"); load(); }}>Deactivate</button></div>)}</div><form className="admin-form" onSubmit={save}><h3>{editing ? "Edit product" : "Create product"}</h3>{["name", "description", "category", "sku", "images"].map((key) => <input key={key} required={!["description", "images"].includes(key)} placeholder={key === "images" ? "Image URLs, comma separated" : key[0].toUpperCase() + key.slice(1)} value={form[key] || ""} onChange={(e) => update(key, e.target.value)} />)}<div className="form-grid"><input required type="number" min="0" step="0.01" placeholder="Price" value={form.price} onChange={(e) => update("price", e.target.value)} /><input type="number" min="0" max="100" placeholder="Discount %" value={form.discount} onChange={(e) => update("discount", e.target.value)} /><input required type="number" min="0" placeholder="Stock" value={form.stock} onChange={(e) => update("stock", e.target.value)} /></div><div className="variant-head"><h4>Variants</h4><button type="button" onClick={addVariant}>+ Add variant</button></div>{form.variants.map((variant, index) => <div className="variant-editor" key={index}><input required placeholder="Variant SKU" value={variant.sku} onChange={(e) => patchVariant(index, "sku", e.target.value)} /><input required placeholder="size=Small, color=Black" value={variant.attributes} onChange={(e) => patchVariant(index, "attributes", e.target.value)} /><div className="form-grid"><input type="number" min="0" step=".01" placeholder="Price" value={variant.price} onChange={(e) => patchVariant(index, "price", e.target.value)} /><input type="number" min="0" max="100" placeholder="Discount" value={variant.discount} onChange={(e) => patchVariant(index, "discount", e.target.value)} /><input type="number" min="0" placeholder="Stock" value={variant.stock} onChange={(e) => patchVariant(index, "stock", e.target.value)} /></div><input placeholder="Variant image URLs" value={variant.images || ""} onChange={(e) => patchVariant(index, "images", e.target.value)} /><button type="button" className="link" onClick={() => update("variants", form.variants.filter((_, i) => i !== index))}>Remove variant</button></div>)}<div><button className="primary" disabled={busy}>{busy ? "Saving..." : editing ? "Save changes" : "Create product"}</button>{editing && <button type="button" className="link" onClick={reset}>Cancel</button>}</div></form></div>}{tab === "orders" && <div className="orders">{orders.map((order) => <article className="order" key={order._id}><div><span className="kicker">{order.user?.name || "Customer"}</span><h2>{order.user?.email || ""}</h2></div><span className="status">{order.status}</span><b>${money(order.totals?.finalTotal)}</b></article>)}</div>}</section>;
}

export default function App() {
  const [view, setView] = useState("shop");
  const [products, setProducts] = useState([]),
    [product, setProduct] = useState(null),
    [cart, setCart] = useState(null),
    [addresses, setAddresses] = useState([]),
    [orders, setOrders] = useState([]),
    [user, setUser] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null),
    [authMode, setAuthMode] = useState("login"),
    [form, setForm] = useState({}),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const loggedIn = Boolean(user);
  const loadProducts = async () =>
    setProducts((await request("/products")).data.products);
  const loadCart = async () =>
    loggedIn && setCart((await request("/cart")).data.cart);
  const loadAddresses = async () =>
    setAddresses((await request("/addresses")).data.addresses);
  useEffect(() => {
    loadProducts().catch((e) => setNotice(e.message));
  }, []);
  useEffect(() => {
    if (loggedIn) {
      loadCart().catch((e) => setNotice(e.message));
      loadAddresses().catch(() => {});
    }
  }, [user]);
  const openProduct = async (id) => {
    setBusy(true);
    try {
      setProduct((await request(`/products/${id}`)).data.product);
      setSelectedVariant(null);
      setView("detail");
    } catch (e) {
      setNotice(e.message);
    } finally {
      setBusy(false);
    }
  };
  const submitAuth = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const path = authMode === "login" ? "/auth/login" : "/auth/register";
      const body =
        authMode === "login"
          ? { email: form.email, password: form.password }
          : { name: form.name, email: form.email, password: form.password };
      const data = (await request(path, { method: "POST", body })).data;
      localStorage.setItem("token", data.token);
      setUser(data.user);
      setForm({});
      setNotice("Welcome back");
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy(false);
    }
  };
  const addToCart = async (item = product) => {
    if (!loggedIn) return setNotice("Please sign in to add items");
    const variant = selectedVariant || item?.variants?.[0];
    setBusy(true);
    try {
      const data = await request("/cart/items", {
        method: "POST",
        body: {
          productId: item._id,
          ...(variant ? { variantId: variant._id } : {}),
          quantity: 1,
        },
      });
      setCart(data.data.cart);
      setNotice("Added to cart");
      setView("cart");
    } catch (e) {
      setNotice(e.message);
    } finally {
      setBusy(false);
    }
  };
  const updateItem = async (id, quantity) => {
    try {
      const data = await request(`/cart/items/${id}`, {
        method: "PATCH",
        body: { quantity },
      });
      setCart(data.data.cart);
    } catch (e) {
      setNotice(e.message);
    }
  };
  const removeItem = async (id) => {
    try {
      const data = await request(`/cart/items/${id}`, { method: "DELETE" });
      setCart(data.data.cart);
    } catch (e) {
      setNotice(e.message);
    }
  };
  const checkout = async () => {
    if (!addresses.length) return setNotice("Add an address before checkout");
    setBusy(true);
    try {
      const data = await request("/orders", {
        method: "POST",
        body: {
          addressId: addresses.find((a) => a.isDefault)?.id || addresses[0].id,
        },
      });
      await request("/payments", {
        method: "POST",
        headers: { "Idempotency-Key": `checkout-${data.data.order._id}` },
        body: { orderId: data.data.order._id, outcome: "SUCCESS" },
      });
      setCart({ items: [], totals: { finalTotal: 0 } });
      setNotice("Order placed and payment confirmed");
      setView("orders");
      await loadOrders();
    } catch (e) {
      setNotice(e.message);
    } finally {
      setBusy(false);
    }
  };
  const loadOrders = async () =>
    setOrders((await request("/orders")).data.orders);
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setCart(null);
    setView("shop");
  };
  const set = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  const title =
    view === "shop"
      ? "Everyday objects, made deliberate."
      : view === "detail"
        ? product?.name
        : view === "cart"
          ? "Your cart"
          : view === "checkout"
            ? "Checkout"
            : "Your orders";

  return (
    <div className="app">
      <header className="nav">
        <button className="brand" onClick={() => setView("shop")}>
          NORTH / OBJECTS
        </button>
        <nav>
          <button onClick={() => setView("shop")}>Shop</button>
          <button
            onClick={() => {
              if (!loggedIn) return setNotice("Please sign in");
              setView("orders");
              loadOrders();
            }}
          >
            Orders
          </button>
          <button
            className="cart-button"
            onClick={() => {
              if (!loggedIn) return setNotice("Please sign in");
              setView("cart");
            }}
          >
            <span>Bag</span>
            <b>{cart?.items?.length || 0}</b>
          </button>
        </nav>
        <div className="account">
          {loggedIn ? (
            <button onClick={logout}>{user.name} · Sign out</button>
          ) : (
            <button onClick={() => setView("auth")}>Sign in</button>
          )}
        </div>
      </header>
      {notice && (
        <div className="notice" onClick={() => setNotice("")}>
          {notice}
        </div>
      )}
      <main>
        <section className="hero">
          <span className="kicker">CURATED GOODS / 2026</span>
          <h1>{title}</h1>
          {view === "shop" && (
            <p>Quietly excellent essentials for a considered daily life.</p>
          )}
        </section>
        {view === "shop" && (
          <section className="products">
            {products.length ? (
              products.map((item) => (
                <article
                  className="card"
                  key={item._id}
                  onClick={() => openProduct(item._id)}
                >
                  <div className="visual">
                    <span>{item.category}</span>
                    <strong>{item.name.slice(0, 1)}</strong>
                  </div>
                  <div className="card-copy">
                    <div>
                      <h2>{item.name}</h2>
                      <p>{item.description}</p>
                    </div>
                    <b>${money(item.price)}</b>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty">No products available yet.</div>
            )}
          </section>
        )}
        {view === "detail" && product && (
          <section className="detail">
            <div className="visual large">
              <span>{product.category}</span>
              <strong>{product.name.slice(0, 1)}</strong>
            </div>
            <div className="detail-copy">
              <span className="kicker">{product.sku}</span>
              <h2>{product.name}</h2>
              <p>{product.description}</p>
              <strong className="price">
                ${money(selectedVariant?.price || product.price)}
              </strong>
              {product.variants?.length > 0 && (
                <div className="variants">
                  <label>Choose a variant</label>
                  <div>
                    {product.variants.map((variant) => (
                      <button
                        className={
                          selectedVariant?._id === variant._id ? "selected" : ""
                        }
                        key={variant._id}
                        onClick={() => setSelectedVariant(variant)}
                      >
                        {Object.values(variant.attributes || {}).join(" / ")}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button
                className="primary"
                disabled={busy}
                onClick={() => addToCart(product)}
              >
                Add to bag
              </button>
            </div>
          </section>
        )}
        {view === "cart" && (
          <section className="split">
            <div className="list">
              {cart?.items?.length ? (
                cart.items.map((item) => (
                  <div className="line" key={item.id}>
                    <div>
                      <h3>{item.product?.name}</h3>
                      <small>
                        {item.variant?.attributes &&
                          Object.values(item.variant.attributes).join(
                            " / ",
                          )}{" "}
                        · ${money(item.unitPrice)}
                      </small>
                    </div>
                    <div className="quantity">
                      <button
                        onClick={() =>
                          item.quantity > 1
                            ? updateItem(item.id, item.quantity - 1)
                            : removeItem(item.id)
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
                    <b>${money(item.lineTotal)}</b>
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
                <b>${money(cart?.totals?.subtotal)}</b>
              </div>
              <div>
                <span>Discount</span>
                <b>−${money(cart?.totals?.discount)}</b>
              </div>
              <div className="grand">
                <span>Total</span>
                <b>${money(cart?.totals?.finalTotal)}</b>
              </div>
              <button
                className="primary"
                disabled={!cart?.items?.length}
                onClick={() => {
                  if (!addresses.length) loadAddresses();
                  setView("checkout");
                }}
              >
                Continue to checkout
              </button>
            </aside>
          </section>
        )}
        {view === "checkout" && (
          <section className="split">
            <div className="list">
              <h2>Delivery address</h2>
              {addresses.length ? (
                addresses.map((address) => (
                  <div className="address" key={address.id}>
                    <b>{address.fullName}</b>
                    <span>
                      {address.line1}, {address.city}, {address.state}{" "}
                      {address.postalCode}
                    </span>
                  </div>
                ))
              ) : (
                <p className="empty">
                  No address found. Add one through the API before placing an
                  order.
                </p>
              )}
            </div>
            <aside className="summary">
              <span className="kicker">Final total</span>
              <div className="grand">
                <span>Due today</span>
                <b>${money(cart?.totals?.finalTotal)}</b>
              </div>
              <button
                className="primary"
                disabled={busy || !addresses.length}
                onClick={checkout}
              >
                {busy ? "Placing order..." : "Place order"}
              </button>
            </aside>
          </section>
        )}
        {view === "orders" && (
          <section className="orders">
            {orders.length ? (
              orders.map((order) => (
                <article className="order" key={order._id}>
                  <div>
                    <span className="kicker">Order {order._id.slice(-8)}</span>
                    <h2>
                      {order.items.length} item
                      {order.items.length > 1 ? "s" : ""}
                    </h2>
                  </div>
                  <span className="status">{order.status}</span>
                  <b>${money(order.totals.finalTotal)}</b>
                </article>
              ))
            ) : (
              <div className="empty">No orders yet.</div>
            )}
          </section>
        )}
        {view === "auth" && (
          <section className="auth">
            <span className="kicker">Your account</span>
            <h2>
              {authMode === "login" ? "Welcome back." : "Make an account."}
            </h2>
            <form onSubmit={submitAuth}>
              {authMode === "register" && (
                <input
                  required
                  placeholder="Full name"
                  value={form.name || ""}
                  onChange={(e) => set("name", e.target.value)}
                />
              )}
              <input
                required
                type="email"
                placeholder="Email"
                value={form.email || ""}
                onChange={(e) => set("email", e.target.value)}
              />
              <input
                required
                minLength="8"
                type="password"
                placeholder="Password"
                value={form.password || ""}
                onChange={(e) => set("password", e.target.value)}
              />
              <button className="primary" disabled={busy}>
                {busy
                  ? "Working..."
                  : authMode === "login"
                    ? "Sign in"
                    : "Create account"}
              </button>
            </form>
            <button
              className="link"
              onClick={() =>
                setAuthMode(authMode === "login" ? "register" : "login")
              }
            >
              {authMode === "login"
                ? "Create an account"
                : "I already have an account"}
            </button>
          </section>
        )}
      </main>
      <footer>
        North Objects <span>Designed for the everyday.</span>
      </footer>
    </div>
  );
}
