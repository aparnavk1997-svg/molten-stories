import { useState } from 'react';
import { useWishlist } from '../context/WishlistContext';

/** Heart toggle for saving a candle. `className` positions it (card corner, product page, …). */
export default function HeartButton({ product, className = '' }) {
  const { isSaved, toggle } = useWishlist();
  const [pop, setPop] = useState(false); // true only right after the user saves, never on page load
  const saved = isSaved(product.id);
  const label = saved ? `Remove ${product.name} from favourites` : `Add ${product.name} to favourites`;

  return (
    <button
      type="button"
      className={`heart-btn ${saved ? 'is-saved' : ''} ${pop ? 'pop' : ''} ${className}`}
      onClick={() => {
        setPop(!saved);
        toggle(product.id);
      }}
      onAnimationEnd={() => setPop(false)}
      aria-pressed={saved}
      aria-label={label}
      title={saved ? 'In your favourites' : 'Add to favourites'}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
        <path
          d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
