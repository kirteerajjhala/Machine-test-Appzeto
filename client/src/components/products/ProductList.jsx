import ProductCard from "./ProductCard.jsx";

export default function ProductList({ products, onOpenProduct }) {
  return (
    <section className="products">
      {products.length ? (
        products.map((item) => (
          <ProductCard
            key={item._id}
            item={item}
            onClick={() => onOpenProduct(item._id)}
          />
        ))
      ) : (
        <div className="empty">No products available yet.</div>
      )}
    </section>
  );
}
