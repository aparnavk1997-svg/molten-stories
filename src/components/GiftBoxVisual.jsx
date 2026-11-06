import ProductImage from './ProductImage';

/**
 * Visual illustration of an open gift box with slots where chosen candles settle in.
 */
export default function GiftBoxVisual({
  candles = [],
  maxSlots = 10,
  minSlots = 4,
  onRemoveCandle,
}) {
  // Determine number of visible slots in the box with balanced 2-column rows (at least 4, up to maxSlots)
  const needed = Math.max(minSlots, candles.length + (candles.length < maxSlots ? 1 : 0));
  const totalSlots = Math.min(maxSlots, Math.ceil(needed / 2) * 2);

  const slots = Array.from({ length: totalSlots }).map((_, idx) => candles[idx] || null);

  return (
    <div className="gift-box-visual" aria-label="Gift box illustration preview">
      <div className="box-case">
        {/* Luxury top seal / ribbon header */}
        <div className="box-header-accent">
          <span className="box-seal-icon">✦</span>
          <span className="box-seal-text">
            {candles.length === 0
              ? 'Handcrafted Gift Box'
              : candles.length < minSlots
              ? `Add ${minSlots - candles.length} more candle${minSlots - candles.length > 1 ? 's' : ''} to pack`
              : candles.length >= maxSlots
              ? 'Box is full & snug'
              : `${candles.length} candles nestled inside`}
          </span>
          <span className="box-seal-icon">✦</span>
        </div>

        {/* Box interior with cushioning and nestled candle slots */}
        <div className="box-tray">
          <div className="box-shreds-bg" aria-hidden="true" />
          <div className="box-grid">
            {slots.map((candle, idx) => {
              if (candle) {
                return (
                  <div
                    key={`${candle.id}-${idx}`}
                    className="box-slot filled"
                    title={candle.name}
                  >
                    <div className="slot-candle-wrapper">
                      <div className="slot-candle-glow" aria-hidden="true" />
                      <div className="slot-candle-img">
                        <ProductImage product={candle} />
                      </div>
                      <span className="slot-candle-label">{candle.name}</span>
                      {onRemoveCandle && (
                        <button
                          type="button"
                          className="slot-remove-btn"
                          onClick={() => onRemoveCandle(candle.id)}
                          aria-label={`Remove one ${candle.name} from box`}
                          title="Remove candle"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                );
              }
              return (
                <div key={`empty-${idx}`} className="box-slot empty" aria-hidden="true">
                  <div className="slot-empty-content">
                    <span className="slot-empty-dash">+</span>
                    <span className="slot-empty-hint">Slot {idx + 1}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom trim / golden base indicator */}
        <div className="box-bottom-trim">
          <span className="box-wood-shaving-hint">Nestled in wood-wool &amp; tissue</span>
        </div>
      </div>
    </div>
  );
}
