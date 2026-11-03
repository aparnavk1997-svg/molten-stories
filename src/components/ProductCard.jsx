import { Link } from 'react-router-dom';
import ProductImage from './ProductImage';
import { PriceTag } from './PriceBits';
import { useCart } from '../context/CartContext';
import { MAX_QTY } from '../utils/pricing';

export default function ProductCard({ product }) {
  const { add, items, setQty } = useCart();
  const qty = items.find((i) => i.id === product.id)?.qty ?? 0;

  return (
    <article className="card">
      <Link to={`/product/${product.id}`} className="card-media">
        <ProductImage product={product} />
      </Link>
      <div className="card-body">
        <p className="eyebrow">{product.category}</p>
        <h3>
          <Link to={`/product/${product.id}`}>{product.name}</Link>
        </h3>
        <p className="muted small">{product.desc}</p>
        <PriceTag product={product} />
        <div className="card-footer">
          {qty === 0 ? (
            <button className="btn btn-small btn-block" onClick={() => add(product.id)}>
              Add to bag
            </button>
          ) : (
            <div className="qty qty-card" role="group" aria-label={`${product.name} quantity`}>
              <button
                onClick={() => setQty(product.id, qty - 1)}
                aria-label={`Decrease ${product.name}`}
              >
                −
              </button>
              <span aria-live="polite">{qty}</span>
              <button
                onClick={() => setQty(product.id, qty + 1)}
                disabled={qty >= MAX_QTY}
                aria-label={`Increase ${product.name}`}
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
