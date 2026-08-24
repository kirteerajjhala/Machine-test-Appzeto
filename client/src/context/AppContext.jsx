import { createContext, useContext, useState } from "react";
/* eslint-disable react-refresh/only-export-components */

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <AppContext.Provider
      value={{
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppState must be used inside AppProvider");
  return context;
}
