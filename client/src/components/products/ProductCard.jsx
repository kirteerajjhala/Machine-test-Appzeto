import { money, imageUrl } from "../../utils/formatters.js";

export default function ProductCard({ item, onClick }) {
  const finalPrice =
    Number(item.price) * (1 - (Number(item.discount) || 0) / 100);

  return (
    <article className="card" onClick={onClick}>
      <div className="visual">
        {(item.image || item.images?.[0]) && (
          <img
            src={imageUrl(item.image || item.images[0])}
            alt={item.name}
          />
        )}
        <span>{item.stock > 0 ? `In Stock (${item.stock})` : "Out of stock"}</span>
        <strong>{item.name.slice(0, 1)}</strong>
      </div>
      <div className="card-copy">
        <div>
          <h2>{item.name}</h2>
          <p>{item.description}</p>
        </div>
        <div>
          <b>{money(finalPrice)}</b>
          {Number(item.discount) > 0 && (
            <span
              style={{
                textDecoration: "line-through",
                opacity: 0.6,
                fontSize: "0.85em",
                marginLeft: "0.4rem",
              }}
            >
              {money(item.price)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
