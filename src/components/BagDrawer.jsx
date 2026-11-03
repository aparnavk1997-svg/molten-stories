import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ProductImage from './ProductImage';
import { useCart } from '../context/CartContext';
import { MAX_QTY, formatINR } from '../utils/pricing';
import { placeOrderOnWhatsApp } from '../utils/whatsapp';

/** Slide-in bag panel: opens when a candle is added; shows count, line prices and total. */
export default function BagDrawer() {
  const { drawerOpen, closeDrawer, items, count, subtotal, setQty, remove } = useCart();
  const { pathname } = useLocation();
  const closeRef = useRef(null);

  // Close on navigation
  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

  // Esc to close, lock page scroll, move focus into the panel
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && closeDrawer();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [drawerOpen, closeDrawer]);

  return (
    <>
      <div className={`overlay ${drawerOpen ? 'show' : ''}`} onClick={closeDrawer} aria-hidden="true" />
      <aside
        className={`drawer ${drawerOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Your bag"
        aria-hidden={!drawerOpen}
        inert={!drawerOpen ? '' : undefined}
      >
        <div className="drawer-head">
          <h2>
            Your bag <span className="drawer-count" data-testid="drawer-count">{count}</span>
          </h2>
          <button ref={closeRef} className="drawer-close" onClick={closeDrawer} aria-label="Close bag">
            ×
          </button>
        </div>

        <div className="drawer-items">
          {items.length === 0 ? (
            <p className="empty-note">Your bag is waiting for a little glow.</p>
          ) : (
            items.map((i) => (
              <div key={i.id} className="drawer-row">
                <div className="cart-thumb"><ProductImage product={i} /></div>
                <div className="drawer-info">
                  <strong>{i.name}</strong>
                  <span className="muted small">{formatINR(i.price)} each</span>
                  <div className="qty">
                    <button onClick={() => setQty(i.id, i.qty - 1)} aria-label={`Decrease ${i.name}`}>−</button>
                    <span>{i.qty}</span>
                    <button
                      onClick={() => setQty(i.id, i.qty + 1)}
                      disabled={i.qty >= MAX_QTY}
                      aria-label={`Increase ${i.name}`}
                    >+</button>
                  </div>
                </div>
                <div className="drawer-price">
                  <strong>{formatINR(i.price * i.qty)}</strong>
                  <button className="link-btn" onClick={() => remove(i.id)} aria-label={`Remove ${i.name}`}>
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="drawer-foot">
            <div className="row total">
              <span>Total ({count} {count === 1 ? 'item' : 'items'})</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            <p className="muted small">
              Delivery charges and payment details will be confirmed on WhatsApp.
            </p>
            <button className="btn btn-block" onClick={() => placeOrderOnWhatsApp(items)}>
              Place order on WhatsApp
            </button>
            <Link to="/bag" className="btn btn-outline btn-block">View bag</Link>
            <button className="link-btn drawer-continue" onClick={closeDrawer}>Continue shopping</button>
          </div>
        )}
      </aside>
    </>
  );
}
