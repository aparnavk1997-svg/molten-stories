import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { EmptySavedIllustration } from '../components/EmptyIllustrations';
import { useWishlist } from '../context/WishlistContext';

export default function Saved() {
  const { items } = useWishlist();

  if (items.length === 0) {
    return (
      <div className="container page center-text empty-cart">
        <EmptySavedIllustration />
        <h2>No favourites yet.</h2>
        <p className="muted">Tap the heart on any candle to keep it here for later.</p>
        <Link to="/shop" className="btn">Shop candles</Link>
      </div>
    );
  }

  return (
    <div className="container page">
      <p className="eyebrow">Kept for later</p>
      <h1 className="h1-small">Your favourites ({items.length})</h1>
      <div className="grid saved-grid">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
