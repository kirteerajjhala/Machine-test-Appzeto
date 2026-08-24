import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000/api";
const api = async (path, options = {}) => {
  const token = localStorage.getItem("token");
  const response = await fetch(API + path, { ...options, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: options.body ? JSON.stringify(options.body) : undefined });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Request failed");
  return data;
};

export default function App() {
  const [products, setProducts] = useState([]), [cart, setCart] = useState(null), [user, setUser] = useState(null), [email, setEmail] = useState(""), [password, setPassword] = useState(""), [error, setError] = useState("");
  const load = async () => { try { setProducts((await api("/products")).data.products); if (localStorage.getItem("token")) { setUser((await api("/auth/profile")).data.user); setCart((await api("/cart")).data.cart); } } catch (e) { setError(e.message); } };
  useEffect(() => { load(); }, []);
  const login = async (event) => { event.preventDefault(); try { const data = await api("/auth/login", { method: "POST", body: { email, password } }); localStorage.setItem("token", data.data.token); setUser(data.data.user); setError(""); load(); } catch (e) { setError(e.message); } };
  const add = async (product) => { if (!user) return setError("Log in to add items"); try { const variant = product.variants?.[0]; const data = await api("/cart/items", { method: "POST", body: { productId: product._id, ...(variant ? { variantId: variant._id } : {}), quantity: 1 } }); setCart(data.data.cart); } catch (e) { setError(e.message); } };
  return <main><header><div><span className="eyebrow">FIELD GOODS / 2026</span><h1>Objects with a point of view.</h1></div><div className="account">{user ? <><span>{user.name}</span><button onClick={() => { localStorage.removeItem("token"); setUser(null); setCart(null); }}>Log out</button></> : <form onSubmit={login}><input placeholder="email" value={email} onChange={e => setEmail(e.target.value)} /><input type="password" placeholder="password" value={password} onChange={e => setPassword(e.target.value)} /><button>Log in</button></form>}</div></header><section className="intro"><p>Small-batch essentials, considered materials, no excess.</p><span>{products.length} pieces available</span></section>{error && <div className="error">{error}</div>}<section className="layout"><div className="grid">{products.map(product => <article className="product" key={product._id}><div className="product-image"><span>{product.category}</span><strong>{product.name.slice(0, 1)}</strong></div><div className="product-info"><div><h2>{product.name}</h2><p>{product.description}</p></div><button className="add" onClick={() => add(product)}>Add · ${Number(product.price?.$numberDecimal || product.price).toFixed(2)}</button></div></article>)}</div><aside><div className="aside-head"><span>Your selection</span><b>{cart?.items?.length || 0}</b></div>{cart?.items?.length ? cart.items.map(item => <div className="cart-line" key={item.id}><span>{item.product?.name}<small>{item.quantity} × ${item.unitPrice}</small></span><b>${item.lineTotal.toFixed(2)}</b></div>) : <p className="empty">Your cart is waiting for something good.</p>}<div className="total"><span>Total</span><strong>${cart?.totals?.finalTotal?.toFixed(2) || "0.00"}</strong></div></aside></section></main>;
+}
