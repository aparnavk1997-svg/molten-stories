import { useState } from 'react';
import { Link } from 'react-router-dom';
import ProductImage from '../components/ProductImage';
import { EmptyBagIllustration } from '../components/EmptyIllustrations';
import GiftOptions from '../components/GiftOptions';
import ConfirmDialog from '../components/ConfirmDialog';
import FreeDeliveryBar from '../components/FreeDeliveryBar';
import DeliveryChecker from '../components/DeliveryChecker';
import DeliveryAddress from '../components/DeliveryAddress';
import { PriceTag } from '../components/PriceBits';
import { useCart } from '../context/CartContext';
import { FREE_DELIVERY_MIN, MAX_QTY, formatINR, isAddressValid } from '../utils/pricing';

export default function Cart() {
  const {
    items,
    hampers,
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
    unpackHamper,
    placeOrder,
    clear,
  } = useCart();

  const [attempted, setAttempted] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const addressValid = isAddressValid(address);
  const isEmpty = items.length === 0 && hampers.length === 0;

  const handlePlaceOrder = () => {
    if (!addressValid) {
      setAttempted(true);
      const el = document.getElementById('del-name') || document.querySelector('.delivery-panel');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.focus();
      return;
    }
    placeOrder(items, giftOptions);
  };

  const handleClear = () => {
    clear();
    setConfirmClear(false);
  };

  if (isEmpty) {
    return (
      <div className="container page center-text empty-cart">
        <EmptyBagIllustration />
        <h2>Your bag is waiting for a little glow.</h2>
        <p className="muted">Pick a candle you love and it will appear here.</p>
        <div className="btn-row center" style={{ marginTop: '1.2rem' }}>
          <Link to="/shop" className="btn">Shop candles</Link>
          <Link to="/gift-box" className="btn btn-outline">Build a gift box</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page">
      <h1 className="h1-small">Your bag</h1>
      <div className="cart-layout">
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.8rem' }}>
            <button type="button" className="link-btn strong" onClick={() => setConfirmClear(true)}>CLEAR BAG</button>
          </div>

          {/* Custom Gift Box Hampers */}
          {hampers.length > 0 && (
            <div className="hampers-group" style={{ marginBottom: items.length > 0 ? '1.5rem' : '0' }}>
              <div className="group-header" style={{ marginBottom: '0.8rem' }}>
                <span className="eyebrow" style={{ margin: 0 }}>Gift Collections</span>
                <h3 style={{ margin: '0.2rem 0 0', color: 'var(--gold-light)' }}>
                  Gift Box Hampers ({hampers.length})
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {hampers.map((h, idx) => (
                  <div key={h.id} className="panel cart-hamper-bundle">
                    <div className="cart-hamper-header">
                      <div>
                        <span className="badge gift-badge">
                          🎁 Custom Gift Box Hamper {hampers.length > 1 ? `#${idx + 1}` : ''}
                        </span>
                        <p className="muted small" style={{ margin: '0.35rem 0 0' }}>
                          Packaged in a rigid kraft keepsake box with botanical wrap & ribbon (+₹100)
                        </p>
                      </div>
                      <div className="cart-hamper-actions">
                        <Link to={`/gift-box?hamperId=${h.id}`} className="link-btn small">
                          Edit in builder
                        </Link>
                        <button
                          type="button"
                          className="link-btn small"
                          onClick={() => unpackHamper(h.id)}
                          title="Convert box items into individual candles"
                        >
                          Unpack
                        </button>
                        <button
                          type="button"
                          className="link-btn small"
                          onClick={() => removeHamper(h.id)}
                          title="Remove this hamper"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <ul className="plain cart-hamper-items">
                      {h.items.map((i) => (
                        <li key={i.id} className="cart-row">
                          <div className="cart-item no-delivery">
                            <Link to={`/product/${i.id}`} className="cart-thumb" aria-label={`View ${i.name}`}>
                              <ProductImage product={i} />
                            </Link>
                            <div className="cart-info">
                              <Link to={`/product/${i.id}`}><strong>{i.name}</strong></Link>
                              <PriceTag product={i} />
                              <span className="muted small">
                                {formatINR(i.price)} × {i.qty}
                              </span>
                            </div>
                            <strong>{formatINR(i.price * i.qty)}</strong>
                          </div>
                        </li>
                      ))}
                    </ul>
                    {h.note && (
                      <div className="cart-hamper-card-preview">
                        <div className="card-preview-header">
                          <span className="small muted">Enclosed gift card message:</span>
                        </div>
                        <blockquote className="card-preview-text">"{h.note}"</blockquote>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Individual Candles */}
          {items.length > 0 && (
            <div className="panel" style={{ marginBottom: '1.2rem' }}>
              <h3 className="panel-title">Individual Candles ({items.length})</h3>
              <ul className="plain">
                {items.map((i) => (
                  <li key={i.id} className="cart-row">
                    <div className="cart-item no-delivery">
                      <Link to={`/product/${i.id}`} className="cart-thumb" aria-label={`View ${i.name}`}>
                        <ProductImage product={i} />
                      </Link>
                      <div className="cart-info">
                        <Link to={`/product/${i.id}`}><strong>{i.name}</strong></Link>
                        <PriceTag product={i} />
                        <span className="muted small">{formatINR(i.price)} each</span>
                      </div>
                      <strong>{formatINR(i.price * i.qty)}</strong>
                    </div>
                    <div className="cart-actions">
                      <div className="qty">
                        <button onClick={() => setQty(i.id, i.qty - 1)} aria-label={`Decrease ${i.name}`}>−</button>
                        <span>{i.qty}</span>
                        <button
                          onClick={() => setQty(i.id, i.qty + 1)}
                          disabled={i.qty >= MAX_QTY}
                          aria-label={`Increase ${i.name}`}
                        >+</button>
                      </div>
                      <button className="link-btn strong" onClick={() => remove(i.id)}>REMOVE</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <DeliveryAddress attempted={attempted} />
        </div>

        <aside className="summary">
          <h3 className="summary-title">Order summary</h3>
          <FreeDeliveryBar subtotal={subtotal} />
          <DeliveryChecker pin={pin} onChange={setPin} subtotal={subtotal} />
          <GiftOptions />
          <div className="summary-breakdown" style={{ marginTop: '0.8rem' }}>
            <div className="row">
              <span>Candles</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            {hampers.length > 0 && (
              <div className="row">
                <span>Gift box packaging ({hampers.length} {hampers.length === 1 ? 'box' : 'boxes'})</span>
                <span>{formatINR(hamperPackagingFee)}</span>
              </div>
            )}
            {giftWrap && items.length > 0 && (
              <div className="row">
                <span>Gift wrap (individual candles)</span>
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
              ? 'Payment details will be confirmed with you on WhatsApp.'
              : 'Enter your pincode to see the delivery charge. Payment details will be confirmed with you on WhatsApp.'}
          </p>
          <button className="btn btn-block" onClick={handlePlaceOrder}>
            Place order on WhatsApp
          </button>
          {!addressValid && attempted && (
            <p className="small error" style={{ textAlign: 'center', marginTop: '0.6rem' }}>
              Please enter your delivery address above to place your order.
            </p>
          )}
        </aside>
      </div>
      {confirmClear && (
        <ConfirmDialog
          title="Clear your bag?"
          message="This removes all candles and gift boxes from your bag."
          confirmLabel="Clear bag"
          onConfirm={handleClear}
          onCancel={() => setConfirmClear(false)}
        />
      )}
    </div>
  );
}
