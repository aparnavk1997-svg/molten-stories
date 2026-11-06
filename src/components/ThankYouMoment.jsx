import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { formatINR } from '../utils/pricing';

/**
 * A warm, glowing "Thank you, your candle is on its way" celebration moment
 * shown after the customer places an order via WhatsApp.
 */
export default function ThankYouMoment({ order, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!order) return;
    const dialog = ref.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [order]);

  if (!order) return null;

  const count = order.items?.reduce((s, i) => s + (i.qty || 1), 0) || 1;
  const isSingle = count === 1;

  const handleClose = () => {
    ref.current?.close();
    onClose();
  };

  return (
    <dialog
      ref={ref}
      className="thankyou-modal"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && handleClose()}
      aria-labelledby="thankyou-title"
    >
      <div className="thankyou-content">
        <button
          type="button"
          className="drawer-close thankyou-close"
          onClick={handleClose}
          aria-label="Close thank you note"
        >
          ×
        </button>

        {/* Ambient Warm Candle Flame Animation */}
        <div className="thankyou-glow-wrap" aria-hidden="true">
          <div className="thankyou-glow-aura" />
          <svg className="thankyou-flame-svg" viewBox="0 0 120 140" fill="none">
            <defs>
              <radialGradient id="warm-aura" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffd899" stopOpacity="0.9" />
                <stop offset="45%" stopColor="var(--gold)" stopOpacity="0.45" />
                <stop offset="100%" stopColor="var(--gold-dark)" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="flame-body" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fffdf6" />
                <stop offset="35%" stopColor="#f5b867" />
                <stop offset="100%" stopColor="var(--gold-dark)" />
              </linearGradient>
            </defs>
            {/* Halo light */}
            <circle cx="60" cy="52" r="48" fill="url(#warm-aura)" opacity="0.75" />
            {/* Outer flame */}
            <path
              className="flame-outer"
              d="M60 16 C73 36 75 52 60 68 C45 52 47 36 60 16 Z"
              fill="url(#flame-body)"
            />
            {/* Inner flame */}
            <path
              className="flame-inner"
              d="M60 32 C65 43 65 54 60 62 C55 54 55 43 60 32 Z"
              fill="#ffffff"
              opacity="0.9"
            />
            {/* Wick */}
            <rect x="58.5" y="65" width="3" height="13" rx="1.5" fill="var(--wick)" />
            {/* Candle Jar Base */}
            <ellipse cx="60" cy="76" rx="26" ry="5" fill="var(--gold-light)" opacity="0.4" />
            <path
              d="M34 76 L34 114 C34 120 45 125 60 125 C75 125 86 120 86 114 L86 76 Z"
              fill="var(--jar)"
              stroke="var(--gold-dark)"
              strokeWidth="1.5"
            />
            <ellipse cx="60" cy="114" rx="26" ry="5" fill="var(--gold-dark)" opacity="0.3" />
          </svg>
        </div>

        <p className="eyebrow thankyou-eyebrow">Order Sent to WhatsApp</p>
        <h2 id="thankyou-title" className="thankyou-heading">
          {isSingle ? 'Thank you, your candle is on its way.' : 'Thank you, your candles are on their way.'}
        </h2>
        <p className="thankyou-text">
          We’ve opened WhatsApp with your order. Our studio will confirm availability, hand-pour and pack each piece with care, and keep you updated as it journeys to you.
        </p>

        {order.items?.length > 0 && (
          <div className="thankyou-pill-summary">
            <span className="thankyou-dot" />
            <span>{count} {isSingle ? 'candle' : 'candles'}</span>
            <span className="muted">·</span>
            <span>{formatINR(order.total || order.items.reduce((s, i) => s + i.price * (i.qty || 1), 0))}</span>
          </div>
        )}

        {order.code && (
          <p className="small" style={{ textAlign: 'center', margin: '0.6rem 0' }}>
            Your order ID: <strong>{order.code}</strong>
            <br />
            <Link to={`/track?code=${order.code}`} onClick={handleClose}>Track this order</Link>
          </p>
        )}

        {order.address?.name && (
          <p className="thankyou-dest small muted" style={{ margin: '0.6rem 0 1.2rem', textAlign: 'center' }}>
            Delivering to <strong>{order.address.name}</strong>{order.address.city ? ` · ${order.address.city}` : ''}{order.address.pin ? ` (${order.address.pin})` : ''}
          </p>
        )}

        <div className="thankyou-actions">
          <Link to="/shop" className="btn btn-block" onClick={handleClose}>
            Continue Exploring
          </Link>
          <button type="button" className="btn btn-outline btn-block" onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
}
