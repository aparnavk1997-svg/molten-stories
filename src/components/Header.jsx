import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const { count } = useCart();
  const { count: savedCount } = useWishlist();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/" className="logo" aria-label="Molten Stories – home" onClick={close}>
          <span className="logo-full" aria-hidden="true" />
        </Link>

        <nav className={`nav ${open ? 'open' : ''}`}>
          <NavLink to="/" end onClick={close}>Home</NavLink>
          <NavLink to="/shop" onClick={close}>Shop</NavLink>
          <NavLink to="/about" onClick={close}>Our Story</NavLink>
          <NavLink to="/contact" onClick={close}>Contact</NavLink>
          <NavLink
            to="/saved"
            onClick={close}
            aria-label={`Favourites, ${savedCount} ${savedCount === 1 ? 'candle' : 'candles'}`}
          >
            Favourites
            {savedCount > 0 && <span className="badge">{savedCount}</span>}
          </NavLink>
          <NavLink to="/account" onClick={close}>
            {profile?.username ? `@${profile.username}` : 'Account'}
          </NavLink>
          <NavLink
            to="/bag"
            data-bag-target
            onClick={close}
            aria-label={`Bag, ${count} ${count === 1 ? 'item' : 'items'}`}
          >
            Bag
            {count > 0 && <span className="badge">{count}</span>}
          </NavLink>
        </nav>

        <div className="header-actions">
          <ThemeToggle />
          <button
            className="menu-toggle"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>
    </header>
  );
}
