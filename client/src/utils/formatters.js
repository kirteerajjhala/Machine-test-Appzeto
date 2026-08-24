export const API_URL = "http://localhost:5000/api";

export const money = (v) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    Number(v?.$numberDecimal || v || 0),
  );

export const numericMoney = (v) => Number(v?.$numberDecimal || v || 0).toFixed(2);

export const imageUrl = (value) =>
  value?.startsWith("http")
    ? value
    : value
      ? `http://localhost:5000${value}`
      : "";
