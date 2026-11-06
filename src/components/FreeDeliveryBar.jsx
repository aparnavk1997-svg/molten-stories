import { FREE_DELIVERY_MIN, formatINR } from '../utils/pricing';

/** Progress toward free delivery, based on the items subtotal. */
export default function FreeDeliveryBar({ subtotal }) {
  const left = FREE_DELIVERY_MIN - subtotal;
  const done = left <= 0;
  const pct = Math.min(100, Math.round((subtotal / FREE_DELIVERY_MIN) * 100));

  return (
    <div className={`free-delivery ${done ? 'done' : ''}`}>
      <p className="free-delivery-text" role="status">
        {done ? (
          <>You've unlocked <strong>free delivery</strong>.</>
        ) : (
          <>Add <strong>{formatINR(left)}</strong> more for free delivery.</>
        )}
      </p>
      <div
        className="free-delivery-track"
        role="progressbar"
        aria-label="Progress to free delivery"
        aria-valuemin={0}
        aria-valuemax={FREE_DELIVERY_MIN}
        aria-valuenow={Math.min(subtotal, FREE_DELIVERY_MIN)}
        aria-valuetext={`${pct}% of ${formatINR(FREE_DELIVERY_MIN)}`}
      >
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
