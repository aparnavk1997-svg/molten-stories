import { Link } from 'react-router-dom';
import ProductImage from './ProductImage';
import { PriceTag } from './PriceBits';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';

/** Horizontal row of candles the visitor looked at lately. `excludeIds` hides ones already on screen. */
export default function RecentlyViewed({ excludeIds = [] }) {
  const { items } = useRecentlyViewed();
  const shown = items.filter((p) => !excludeIds.includes(p.id));
  if (shown.length === 0) return null;

  return (
    <section className="recent" aria-labelledby="recent-title">
      <h2 id="recent-title" className="recent-title">Recently viewed</h2>
      <ul className="plain recent-row">
        {shown.map((p) => (
          <li key={p.id} className="recent-item">
            <Link to={`/product/${p.id}`} className="recent-link">
              <span className="recent-media">
                <ProductImage product={p} />
              </span>
              <span className="recent-name">{p.name}</span>
            </Link>
            <PriceTag product={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}
