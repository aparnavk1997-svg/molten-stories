import { Link } from 'react-router-dom';
import ProductImage from '../components/ProductImage';
import { PriceTag } from '../components/PriceBits';
import { useCart } from '../context/CartContext';
import { MAX_QTY, formatINR } from '../utils/pricing';
import { placeOrderOnWhatsApp } from '../utils/whatsapp';

export default function Cart() {
  const { items, subtotal, setQty, remove } = useCart();

  if (items.length === 0) {
    return (
      <div className="container page center-text empty-cart">
        <h2>Your bag is waiting for a little glow.</h2>
        <p className="muted">Pick a candle you love and it will appear here.</p>
        <Link to="/shop" className="btn">Shop candles</Link>
      </div>
    );
  }

  return (
    <div className="container page">
      <h1 className="h1-small">Your bag</h1>
      <div className="cart-layout">
        <div className="panel">
          <h3 className="panel-title">Items ({items.length})</h3>
          <ul className="plain">
            {items.map((i) => (
              <li key={i.id} className="cart-row">
                <div className="cart-item no-delivery">
                  <div className="cart-thumb">
                    <ProductImage product={i} />
                  </div>
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

        <aside className="summary">
          <h3 className="summary-title">Order summary</h3>
          <div className="row total">
            <span>Total</span>
            <span>{formatINR(subtotal)}</span>
          </div>
          <p className="muted small">
            Delivery charges and payment details will be confirmed with you on WhatsApp.
          </p>
          <button className="btn btn-block" onClick={() => placeOrderOnWhatsApp(items)}>
            Place order on WhatsApp
          </button>
        </aside>
      </div>
    </div>
  );
}
