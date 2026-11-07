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
          <NavLink to="/saved" className="nav-saved" onClick={close}>
            Favourites{savedCount > 0 ? ` (${savedCount})` : ''}
          </NavLink>
        </nav>

        <div className="header-actions">
          <NavLink
            to="/saved"
            className="icon-link icon-saved"
            title="Favourites"
            aria-label={`Favourites, ${savedCount} ${savedCount === 1 ? 'candle' : 'candles'}`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M12 20.5s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.9a4.3 4.3 0 0 1 7.5 2.6c0 5.4-7.5 10-7.5 10z" />
            </svg>
            {savedCount > 0 && <span className="badge">{savedCount}</span>}
          </NavLink>
          <NavLink
            to="/account"
            className="icon-link"
            title={profile?.username ? `@${profile.username}` : 'Account'}
            aria-label={profile?.username ? `Account, @${profile.username}` : 'Account'}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <circle cx="12" cy="8" r="3.8" />
              <path d="M4.5 20.5c.6-4 3.7-6 7.5-6s6.9 2 7.5 6" />
            </svg>
          </NavLink>
          <NavLink
            to="/bag"
            className="icon-link"
            data-bag-target
            title="Bag"
            aria-label={`Bag, ${count} ${count === 1 ? 'item' : 'items'}`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M5 8h14l-1 12H6L5 8z" />
              <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
            </svg>
            {count > 0 && <span className="badge">{count}</span>}
          </NavLink>
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
