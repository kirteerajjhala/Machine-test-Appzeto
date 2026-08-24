import { money, imageUrl } from "../../utils/formatters.js";

export default function ProductDetail({ product, onAddToCart, busy }) {
  if (!product) return null;

  const finalPrice =
    Number(product.price) * (1 - (Number(product.discount) || 0) / 100);

  return (
    <section className="detail">
      <div className="visual large">
        {(product.image || product.images?.[0]) && (
          <img
            src={imageUrl(product.image || product.images[0])}
            alt={product.name}
          />
        )}
        <span>
          {product.stock > 0 ? `Stock: ${product.stock}` : "Out of stock"}
        </span>
        <strong>{product.name.slice(0, 1)}</strong>
      </div>
      <div className="detail-copy">
        <span className="kicker">
          {Number(product.discount) > 0
            ? `${product.discount}% Special Discount`
            : "Standard"}
        </span>
        <h2>{product.name}</h2>
        <p>{product.description}</p>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            margin: "0.5rem 0 1rem",
          }}
        >
          <strong className="price">{money(finalPrice)}</strong>
          {Number(product.discount) > 0 && (
            <>
              <span
                style={{
                  textDecoration: "line-through",
                  opacity: 0.6,
                  fontSize: "1.1rem",
                  marginLeft: "0.75rem",
                }}
              >
                {money(product.price)}
              </span>
              <span
                style={{
                  color: "#16a34a",
                  fontWeight: "600",
                  fontSize: "0.95rem",
                  marginLeft: "0.5rem",
                }}
              >
                ({product.discount}% OFF)
              </span>
            </>
          )}
        </div>
        <button
          className="primary"
          disabled={busy || product.stock <= 0}
          onClick={() => onAddToCart(product)}
        >
          {product.stock > 0 ? "Add to bag" : "Out of stock"}
        </button>
      </div>
    </section>
  );
}
