import { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ProductImage from './ProductImage';
import { EmptyBagIllustration } from './EmptyIllustrations';
import GiftOptions from './GiftOptions';
import FreeDeliveryBar from './FreeDeliveryBar';
import DeliveryChecker from './DeliveryChecker';
import { useCart } from '../context/CartContext';
import { FREE_DELIVERY_MIN, GIFT_BOX_PRICE, MAX_QTY, formatINR, isAddressValid } from '../utils/pricing';
import { placeOrderOnWhatsApp } from '../utils/whatsapp';

/** Slide-in bag panel: opens when a candle is added; shows count, line prices and total. */
export default function BagDrawer() {
  const {
    drawerOpen,
    closeDrawer,
    items,
    hampers,
    count,
    subtotal,
    hamperPackagingFee,
    giftWrap,
    giftWrapFee,
    total,
    pin,
    setPin,
    delivery,
    address,
    giftOptions,
    setQty,
    remove,
    removeHamper,
    placeOrder,
  } = useCart();

  const { pathname } = useLocation();
  const navigate = useNavigate();
  const closeRef = useRef(null);
  const addressValid = isAddressValid(address);
  const isEmpty = items.length === 0 && hampers.length === 0;

  const handlePlaceOrder = () => {
    if (!addressValid) {
      closeDrawer();
      navigate('/bag');
      return;
    }
    placeOrder(items, giftOptions);
  };

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
          {isEmpty ? (
            <div className="drawer-empty-state">
              <EmptyBagIllustration className="empty-art drawer-empty-art" />
              <p className="empty-note">Your bag is waiting for a little glow.</p>
              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.8rem' }}>
                <Link to="/shop" className="btn btn-small" onClick={closeDrawer}>Shop candles</Link>
                <Link to="/gift-box" className="btn btn-outline btn-small" onClick={closeDrawer}>Gift box</Link>
              </div>
            </div>
          ) : (
            <>
              {/* Custom Gift Hampers */}
              {hampers.map((h, idx) => (
                <div key={h.id} className="drawer-hamper-bundle">
                  <div className="drawer-hamper-header">
                    <span className="badge gift-badge">
                      🎁 Hamper {hampers.length > 1 ? `#${idx + 1}` : ''}
                    </span>
                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                      <span className="muted small">+{formatINR(GIFT_BOX_PRICE)} box</span>
                      <button
                        type="button"
                        className="link-btn small"
                        onClick={() => removeHamper(h.id)}
                        aria-label={`Remove hamper ${idx + 1}`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="drawer-hamper-list">
                    {h.items.map((i) => (
                      <div key={i.id} className="drawer-row">
                        <Link to={`/product/${i.id}`} className="cart-thumb" aria-label={`View ${i.name}`} onClick={closeDrawer}>
                          <ProductImage product={i} />
                        </Link>
                        <div className="drawer-info">
                          <Link to={`/product/${i.id}`} onClick={closeDrawer}><strong>{i.name}</strong></Link>
                          <span className="muted small">{formatINR(i.price)} × {i.qty}</span>
                        </div>
                        <div className="drawer-price">
                          <strong>{formatINR(i.price * i.qty)}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                  {h.note && (
                    <p className="muted small" style={{ margin: '0.4rem 0.85rem 0.6rem', fontStyle: 'italic' }}>
                      Note: "{h.note}"
                    </p>
                  )}
                </div>
              ))}

              {/* Individual Candles */}
              {items.map((i) => (
                <div key={i.id} className="drawer-row">
                  <Link to={`/product/${i.id}`} className="cart-thumb" aria-label={`View ${i.name}`} onClick={closeDrawer}>
                    <ProductImage product={i} />
                  </Link>
                  <div className="drawer-info">
                    <Link to={`/product/${i.id}`} onClick={closeDrawer}><strong>{i.name}</strong></Link>
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
              ))}
            </>
          )}
        </div>

        {!isEmpty && (
          <div className="drawer-foot">
            <FreeDeliveryBar subtotal={subtotal} />
            <DeliveryChecker pin={pin} onChange={setPin} subtotal={subtotal} />
            {address?.name && (
              <p className="drawer-address-hint muted small" style={{ margin: '-0.4rem 0 0.8rem' }}>
                Deliver to: <strong>{address.name}</strong>{address.city ? ` · ${address.city}` : ''} ({pin || address.pin})
              </p>
            )}
            <GiftOptions />
            <div className="drawer-summary-lines" style={{ marginTop: '0.6rem' }}>
              <div className="row">
                <span>Candles ({count})</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              {hampers.length > 0 && (
                <div className="row">
                  <span>Gift box packaging ({hampers.length})</span>
                  <span>{formatINR(hamperPackagingFee)}</span>
                </div>
              )}
              {giftWrap && items.length > 0 && (
                <div className="row">
                  <span>Gift wrap (candles)</span>
                  <span>{formatINR(giftWrapFee)}</span>
                </div>
              )}
              {delivery && (
                <div className="row">
                  <span>Delivery</span>
                  <span>{delivery.free ? 'Free' : formatINR(delivery.fee)}</span>
                </div>
              )}
            </div>
            <div className="row total">
              <span>Total</span>
              <span>{formatINR(total)}</span>
            </div>
            <p className="muted small">
              {delivery || subtotal >= FREE_DELIVERY_MIN
                ? 'Payment details will be confirmed on WhatsApp.'
                : 'Enter your pincode to see the delivery charge. Payment details will be confirmed on WhatsApp.'}
            </p>
            <button className="btn btn-block" onClick={handlePlaceOrder}>
              {addressValid ? 'Place order on WhatsApp' : 'Add delivery address & order'}
            </button>
            <Link to="/bag" className="btn btn-outline btn-block" onClick={closeDrawer}>View bag</Link>
            <button className="link-btn drawer-continue" onClick={closeDrawer}>Continue shopping</button>
          </div>
        )}
      </aside>
    </>
  );
}
