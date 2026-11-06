import { useId } from 'react';
import { useCart } from '../context/CartContext';
import { GIFT_NOTE_MAX, GIFT_WRAP_PRICE, formatINR } from '../utils/pricing';

/** Standard gift wrap + message card option for individual candles in the bag. */
export default function GiftOptions() {
  const { items, giftWrap, giftNote, setGiftWrap, setGiftNote } = useCart();
  const uid = useId();
  const noteId = `${uid}-note`;

  if (items.length === 0) return null;

  return (
    <div className="gift-options">
      <label className="check gift-wrap">
        <input type="checkbox" checked={giftWrap} onChange={(e) => setGiftWrap(e.target.checked)} />
        <span>
          Gift wrap candles <span className="muted">· {formatINR(GIFT_WRAP_PRICE)}</span>
        </span>
      </label>

      {giftWrap && (
        <div className="field gift-note-field">
          <label htmlFor={noteId}>Gift message card (optional)</label>
          <textarea
            id={noteId}
            rows={2}
            maxLength={GIFT_NOTE_MAX}
            value={giftNote}
            onChange={(e) => setGiftNote(e.target.value)}
            placeholder="Happy birthday! Wishing you warmth and joy…"
          />
          <span className="muted small">{giftNote.length}/{GIFT_NOTE_MAX}</span>
        </div>
      )}
    </div>
  );
}
