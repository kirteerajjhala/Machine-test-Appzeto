import { useEffect, useState } from "react";
import "./App.css";
import { useAppState } from "./context/AppContext.jsx";
import { request } from "./api/api.js";

// Common Components
import Toast from "./components/common/Toast.jsx";
import ConfirmModal from "./components/common/ConfirmModal.jsx";
import Navbar from "./components/common/Navbar.jsx";
import Footer from "./components/common/Footer.jsx";

// Feature Components
import AdminPanel from "./components/admin/AdminPanel.jsx";
import ProductList from "./components/products/ProductList.jsx";
import ProductDetail from "./components/products/ProductDetail.jsx";
import CartView from "./components/cart/CartView.jsx";
import CheckoutView from "./components/checkout/CheckoutView.jsx";
import OrdersView from "./components/orders/OrdersView.jsx";
import AuthView from "./components/auth/AuthView.jsx";

/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

export default function App() {
  const {
    user,
    setUser,
    products,
    setProducts,
    cart,
    setCart,
    addresses,
    setAddresses,
    orders,
    setOrders,
    notice,
    setNotice,
    busy,
    setBusy,
  } = useAppState();

  const [view, setView] = useState("shop");
  const [product, setProduct] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [form, setForm] = useState({});
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({});
  const [modal, setModal] = useState(null);

  const loggedIn = Boolean(user);

  const loadProducts = async () =>
    setProducts((await request("/products")).data.products);

  const loadCart = async () =>
    loggedIn && setCart((await request("/cart")).data.cart);

  const loadAddresses = async () => {
    try {
      const list = (await request("/addresses")).data.addresses;
      setAddresses(list);
      if (list?.length && !selectedAddressId) {
        const def =
          list.find((a) => a.isDefault)?.id ||
          list.find((a) => a.isDefault)?._id ||
          list[0]?.id ||
          list[0]?._id;
        setSelectedAddressId(def);
      }
      return list;
    } catch {
      return [];
    }
  };

  const loadOrders = async () =>
    setOrders((await request("/orders")).data.orders);

  useEffect(() => {
    loadProducts().catch((e) => setNotice(e.message));
  }, []);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      request("/auth/profile")
        .then((data) => setUser(data.data.user))
        .catch(() => localStorage.removeItem("token"));
    }
  }, []);

  useEffect(() => {
    if (loggedIn) {
      loadCart().catch((e) => setNotice(e.message));
      loadAddresses().catch(() => {});
    }
  }, [loggedIn]);

  const openProduct = async (id) => {
    setBusy(true);
    try {
      setProduct((await request(`/products/${id}`)).data.product);
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
      setView(data.user.role === "ADMIN" ? "admin" : "shop");
      setNotice(
        data.user.role === "ADMIN" ? "Admin dashboard" : "Welcome back",
      );
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy(false);
    }
  };

  const addToCart = async (item = product) => {
    if (!loggedIn) return requireLogin();
    setBusy(true);
    try {
      const data = await request("/cart/items", {
        method: "POST",
        body: {
          productId: item._id,
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

  const confirmAction = (title, message, confirmText, action) =>
    setModal({
      title,
      message,
      confirmText,
      loading: false,
      onConfirm: async () => {
        setModal((current) => ({ ...current, loading: true }));
        try {
          await action();
        } catch (e) {
          setNotice(e.message);
        } finally {
          setModal(null);
        }
      },
    });

  const requireLogin = () =>
    setModal({
      title: "Login Required",
      message: "Please login to continue.",
      confirmText: "Login",
      cancelText: "Cancel",
      loading: false,
      onConfirm: () => {
        setModal(null);
        setView("auth");
      },
    });

  const checkout = async () => {
    let currentAddressId = selectedAddressId;
    if (!currentAddressId) {
      currentAddressId =
        addresses.find((a) => a.isDefault)?.id ||
        addresses.find((a) => a.isDefault)?._id ||
        addresses[0]?.id ||
        addresses[0]?._id;
    }
    if (!currentAddressId)
      return setNotice("Add or select a delivery address before checkout");

    setBusy(true);
    try {
      const data = await request("/orders", {
        method: "POST",
        body: { addressId: currentAddressId },
      });
      await request("/payments", {
        method: "POST",
        headers: {
          "Idempotency-Key": `checkout-${data.data.order._id}-${Date.now()}`,
        },
        body: { orderId: data.data.order._id, outcome: "SUCCESS" },
      });
      setCart({ items: [], totals: { finalTotal: 0 } });
      setNotice("Order placed and payment confirmed successfully");
      setView("orders");
      await loadOrders();
    } catch (e) {
      setNotice(e.message);
    } finally {
      setBusy(false);
    }
  };

  const createAddress = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await request("/addresses", { method: "POST", body: addressForm });
      setAddressForm({});
      await loadAddresses();
      setNotice("Address saved");
    } catch (e) {
      setNotice(e.message);
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    try {
      if (localStorage.getItem("token"))
        await request("/auth/logout", { method: "POST" });
    } catch {
      // Clear local authentication even if the server is unavailable.
    }
    localStorage.removeItem("token");
    setUser(null);
    setCart(null);
    setView("shop");
    setNotice("Logged out successfully");
  };

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
      <Navbar
        user={user}
        cart={cart}
        view={view}
        setView={setView}
        loggedIn={loggedIn}
        requireLogin={requireLogin}
        loadOrders={loadOrders}
        confirmAction={confirmAction}
        logout={logout}
      />

      <main>
        {view === "admin" && (
          <AdminPanel
            user={user}
            setNotice={setNotice}
            confirmAction={confirmAction}
          />
        )}

        {view !== "admin" && (
          <>
            <section className="hero">
              <span className="kicker">CURATED GOODS / 2026</span>
              <h1>{title}</h1>
              {view === "shop" && (
                <p>Quietly excellent essentials for a considered daily life.</p>
              )}
            </section>

            {view === "shop" && (
              <ProductList
                products={products}
                onOpenProduct={openProduct}
              />
            )}

            {view === "detail" && product && (
              <ProductDetail
                product={product}
                onAddToCart={addToCart}
                busy={busy}
              />
            )}

            {view === "cart" && (
              <CartView
                cart={cart}
                updateItem={updateItem}
                removeItem={removeItem}
                confirmAction={confirmAction}
                onContinueCheckout={() => {
                  if (!addresses.length) loadAddresses();
                  setView("checkout");
                }}
              />
            )}

            {view === "checkout" && (
              <CheckoutView
                addresses={addresses}
                selectedAddressId={selectedAddressId}
                setSelectedAddressId={setSelectedAddressId}
                addressForm={addressForm}
                setAddressForm={setAddressForm}
                createAddress={createAddress}
                cart={cart}
                checkout={checkout}
                busy={busy}
              />
            )}

            {view === "orders" && (
              <OrdersView orders={orders} />
            )}

            {view === "auth" && (
              <AuthView
                authMode={authMode}
                setAuthMode={setAuthMode}
                form={form}
                setForm={setForm}
                submitAuth={submitAuth}
                busy={busy}
              />
            )}
          </>
        )}
      </main>

      <Footer />
      <Toast message={notice} onClose={() => setNotice("")} />
      <ConfirmModal modal={modal} onCancel={() => setModal(null)} />
    </div>
  );
}
