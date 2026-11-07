import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductImage from '../components/ProductImage';
import GiftBoxVisual from '../components/GiftBoxVisual';
import { categories, categoriesOf } from '../data/products';
import { useProducts } from '../context/ProductsContext';
import { useCart } from '../context/CartContext';
import { FREE_DELIVERY_MIN, GIFT_BOX_PRICE, formatINR } from '../utils/pricing';

const GIFT_MIN = 2;
const GIFT_MAX = 10; // total candles in the box, counting repeats

export default function GiftBox() {
  const { products } = useProducts();
  const [searchParams] = useSearchParams();
  const editingHamperId = searchParams.get('hamperId');

  const { hampers, addHamper, updateHamper } = useCart();

  const editingHamper = useMemo(() => {
    if (editingHamperId && Array.isArray(hampers)) {
      return hampers.find((h) => h.id === editingHamperId);
    }
    return null;
  }, [editingHamperId, hampers]);

  const initialQtys = useMemo(() => {
    if (editingHamper && editingHamper.items?.length > 0) {
      const q = {};
      editingHamper.items.forEach((item) => {
        if (item?.id) q[item.id] = item.qty;
      });
      return q;
    }
    return {};
  }, [editingHamper]);

  const [qtys, setQtys] = useState(initialQtys);
  const [filter, setFilter] = useState('All');
  const [note, setNote] = useState(() => (editingHamper ? editingHamper.note || '' : ''));
  const [added, setAdded] = useState(false);

  const items = products
    .filter((p) => qtys[p.id] > 0)
    .map((p) => ({ ...p, qty: qtys[p.id] }));
  const count = items.reduce((s, i) => s + i.qty, 0);
  const candlesTotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const total = candlesTotal + (count > 0 ? GIFT_BOX_PRICE : 0);
  const full = count >= GIFT_MAX;
  const ready = count >= GIFT_MIN;

  const visible = useMemo(
    () => (filter === 'All' ? products : products.filter((p) => categoriesOf(p).includes(filter))),
    [products, filter]
  );

  // Flattened array for the box illustration slots
  const flatCandles = useMemo(() => {
    const list = [];
    items.forEach((item) => {
      for (let i = 0; i < item.qty; i++) {
        list.push(item);
      }
    });
    return list;
  }, [items]);

  const change = (id, delta) =>
    setQtys((q) => {
      const current = q[id] || 0;
      const used = Object.values(q).reduce((s, n) => s + n, 0);
      if (delta > 0 && used >= GIFT_MAX) return q;
      const next = Math.max(0, current + delta);
      const rest = { ...q };
      delete rest[id];
      return next > 0 ? { ...rest, [id]: next } : rest;
    });

  const scrollToSummary = () => {
    const el = document.getElementById('gift-box-summary');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleAddOrUpdate = () => {
    if (!ready) return;
    if (editingHamperId) {
      updateHamper(editingHamperId, { items, note: note.trim() });
    } else {
      addHamper({ items, note: note.trim() });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  return (
    <div className="container page has-floating-bar">
      <p className="eyebrow">Bespoke Hampers</p>
      <h1 className="h1-small">Build Your Gift Box</h1>
      {/* Quick summary & progress banner right above the product selector */}
      <div className="gift-top-banner">
        <div className="gift-top-info">
          <span className="gift-progress-pill">
            🎁 {count} of {GIFT_MAX} candles
          </span>
          <div className="gift-progress-track" aria-hidden="true">
            <div
              className="gift-progress-fill"
              style={{ width: `${Math.min(100, (count / GIFT_MAX) * 100)}%` }}
            />
          </div>
          <span className="gift-top-total">
            {count > 0 ? formatINR(total) : 'Box is empty'}
          </span>
          <span className="muted small">
            {!ready
              ? `(Add ${GIFT_MIN - count} more)`
              : full
              ? '(Box is full)'
              : '(Ready to pack)'}
          </span>
        </div>
        <button
          type="button"
          className="btn btn-outline btn-small gift-top-view"
          onClick={scrollToSummary}
          aria-label="View gift box summary"
        >
          {count > 0 ? `View Box (${count}) ↓` : 'View Box ↓'}
        </button>
      </div>

      <div className="cart-layout">
        <div>
          <div className="chips" role="group" aria-label="Filter candles by collection">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                className={`chip ${filter === c ? 'active' : ''}`}
                aria-pressed={filter === c}
                onClick={() => setFilter(c)}
              >
                {c}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="muted gift-empty">No candles in this collection yet.</p>
          ) : (
            <div className="pick-grid">
              {visible.map((p) => {
                const qty = qtys[p.id] || 0;
                return (
                  <div key={p.id} className={`pick ${qty > 0 ? 'selected' : ''}`}>
                    <span className="pick-media"><ProductImage product={p} /></span>
                    <span className="pick-name">{p.name}</span>
                    <span className="muted small">{formatINR(p.price)}</span>
                    {qty === 0 ? (
                      <button
                        type="button"
                        className="btn btn-outline btn-small pick-add"
                        disabled={full}
                        onClick={() => change(p.id, 1)}
                        aria-label={`Add ${p.name} to gift box`}
                      >
                        {full ? 'Box is full' : '+ Add'}
                      </button>
                    ) : (
                      <div className="qty pick-qty" role="group" aria-label={`${p.name} quantity`}>
                        <button type="button" onClick={() => change(p.id, -1)} aria-label={`Decrease ${p.name}`}>−</button>
                        <span aria-live="polite">{qty}</span>
                        <button
                          type="button"
                          onClick={() => change(p.id, 1)}
                          disabled={full}
                          aria-label={`Increase ${p.name}`}
                        >+</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <aside id="gift-box-summary" className="summary">
          <GiftBoxVisual
            candles={flatCandles}
            maxSlots={GIFT_MAX}
            minSlots={4}
            onRemoveCandle={(id) => change(id, -1)}
          />

          <div className="summary-header-row">
            <h3 className="summary-title" style={{ margin: 0 }}>Your gift box</h3>
            <button
              type="button"
              className="link-btn small gift-back-btn"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              ↑ Back to candles
            </button>
          </div>
          <p className="muted small" aria-live="polite">
            {count} of {GIFT_MAX} candles
            {!ready && ` · add ${GIFT_MIN - count} more to continue`}
            {full && ' · your box is full'}
          </p>

          {items.length > 0 && (
            <ul className="plain gift-list">
              {items.map((i) => (
                <li key={i.id}>
                  <span>{i.name}{i.qty > 1 && ` × ${i.qty}`}</span>
                  <span>{formatINR(i.price * i.qty)}</span>
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => change(i.id, -i.qty)}
                    aria-label={`Remove ${i.name}`}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          {count > 0 && (
            <>
              <div className="row">
                <span>Candles</span>
                <span>{formatINR(candlesTotal)}</span>
              </div>
              <div className="row">
                <span>Gift box</span>
                <span>{formatINR(GIFT_BOX_PRICE)}</span>
              </div>
            </>
          )}
          <div className="row total">
            <span>Total</span>
            <span>{formatINR(total)}</span>
          </div>

          <div className="field">
            <label htmlFor="gift-note">Gift message (optional)</label>
            <textarea
              id="gift-note"
              rows={3}
              maxLength={200}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Happy birthday! …"
            />
          </div>

          <p className="muted small">
            {candlesTotal >= FREE_DELIVERY_MIN
              ? 'Delivery is free. Payment details will be confirmed with you on WhatsApp.'
              : `Free delivery on candles worth ${formatINR(FREE_DELIVERY_MIN)} or more.`}
          </p>
          <div className="gift-actions">
            <button
              type="button"
              className="btn btn-block"
              disabled={!ready}
              onClick={handleAddOrUpdate}
            >
              {added
                ? (editingHamperId ? '✓ Updated in bag!' : '✓ Added to bag!')
                : (editingHamperId ? 'Update gift box in bag' : 'Add gift box to bag')}
            </button>
          </div>
        </aside>
      </div>

      {/* Floating quick summary & action bar for mobile / small screens */}
      <div className="gift-floating-bar" role="region" aria-label="Gift box quick bar">
        <div className="gift-floating-info">
          <div className="gift-floating-title">
            <span>🎁 {count}/{GIFT_MAX} candles</span>
          </div>
          <span className="gift-floating-sub">
            {!ready
              ? `Add ${GIFT_MIN - count} more to pack`
              : full
              ? 'Box is full & ready'
              : 'Ready to pack into gift box'}
          </span>
        </div>
        <div className="gift-floating-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={scrollToSummary}
          >
            View Box ↓
          </button>
          <button
            type="button"
            className="btn"
            disabled={!ready}
            onClick={handleAddOrUpdate}
          >
            {added
              ? (editingHamperId ? '✓ Updated!' : '✓ Added!')
              : (editingHamperId ? 'Update bag' : 'Add to bag')}
          </button>
        </div>
      </div>
    </div>
  );
}
