export default function Navbar({
  user,
  cart,
  view,
  setView,
  loggedIn,
  requireLogin,
  loadOrders,
  confirmAction,
  logout,
}) {
  return (
    <header className="nav">
      <button
        className="brand"
        onClick={() => setView(user?.role === "ADMIN" ? "admin" : "shop")}
      >
        <img
          className="brand-logo"
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfwXj3yAyNz5HOhcFy1ognHEtMcXZHdGyAfTIzsFneYg&s=10"
          alt="North Objects"
        />
      </button>
      <nav>
        {user?.role !== "ADMIN" && (
          <button
            className={view === "shop" ? "active" : ""}
            onClick={() => setView("shop")}
          >
            Shop
          </button>
        )}
        {user?.role !== "ADMIN" && (
          <button
            className={view === "orders" ? "active" : ""}
            onClick={() => {
              if (!loggedIn) return requireLogin();
              setView("orders");
              loadOrders();
            }}
          >
            Orders
          </button>
        )}
        {user?.role !== "ADMIN" && (
          <button
            className={`cart-button ${view === "cart" ? "active" : ""}`}
            onClick={() => {
              if (!loggedIn) return requireLogin();
              setView("cart");
            }}
          >
            <span>Bag</span>
            <b>{cart?.items?.length || 0}</b>
          </button>
        )}
        {user?.role === "ADMIN" && (
          <button
            className={view === "admin" ? "active" : ""}
            onClick={() => setView("admin")}
          >
            Admin
          </button>
        )}
      </nav>
      <div className="account">
        {loggedIn ? (
          <button
            className="logout-button"
            onClick={() =>
              confirmAction(
                "Logout?",
                "Are you sure you want to logout?",
                "Logout",
                logout,
              )
            }
          >
            {user.name} · Logout
          </button>
        ) : (
          <button className="login-button" onClick={() => setView("auth")}>
            Login
          </button>
        )}
      </div>
    </header>
  );
}
