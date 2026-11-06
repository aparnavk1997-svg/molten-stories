import { useState } from 'react';
import { Link } from 'react-router-dom';
import ProductImage from './ProductImage';
import QuickView from './QuickView';
import HeartButton from './HeartButton';
import { AdminEditLink } from './AdminLinks';
import { useReveal } from './Reveal';
import { PriceTag } from './PriceBits';
import { useCart } from '../context/CartContext';
import { MAX_QTY } from '../utils/pricing';
import { categoriesOf } from '../data/products';

export default function ProductCard({ product }) {
  const { add, items, setQty } = useCart();
  const qty = items.find((i) => i.id === product.id)?.qty ?? 0;
  const [quickOpen, setQuickOpen] = useState(false);
  const revealRef = useReveal();

  return (
    <article className="card" ref={revealRef}>
      <div className="card-media-wrap">
        <Link to={`/product/${product.id}`} className="card-media">
          <ProductImage product={product} />
        </Link>
        <button
          type="button"
          className="quick-btn"
          onClick={(e) => {
            e.currentTarget.blur();
            setQuickOpen(true);
          }}
          aria-label={`Quick look at ${product.name}`}
          title="Quick look"
        >
          <svg
            className="quick-eye-icon"
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span className="quick-btn-text">Quick look</span>
        </button>
        <HeartButton product={product} className="card-heart" />
        <AdminEditLink product={product} />
      </div>
      {quickOpen && <QuickView product={product} onClose={() => setQuickOpen(false)} />}
      <div className="card-body">
        <p className="eyebrow">{categoriesOf(product).join(' · ')}</p>
        <h3>
          <Link to={`/product/${product.id}`}>{product.name}</Link>
        </h3>
        <p className="card-desc muted small">{product.desc}</p>
        <PriceTag product={product} />
        <div className="card-footer">
          {qty === 0 ? (
            <button
              className="btn btn-small btn-block"
              onClick={(e) => add(product.id, e.currentTarget.closest('.card')?.querySelector('.card-media img, .card-media svg'))}
            >
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
