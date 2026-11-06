import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase, supabaseEnabled } from '../lib/supabase';
import { formatINR } from '../utils/pricing';
import { ORDER_STATUSES, formatDateTime, statusLabel } from '../utils/orders';

const STEPS = ORDER_STATUSES.filter((s) => s.value !== 'cancelled');

const STEP_ICONS = {
  placed: (
    <>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  confirmed: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.2 12.3l2.6 2.6 5-5.4" />
    </>
  ),
  shipped: (
    <>
      <path d="M2.5 7h11v9h-11zM13.5 10h4l3 3v3h-7" />
      <circle cx="7" cy="17.5" r="1.7" />
      <circle cx="17" cy="17.5" r="1.7" />
    </>
  ),
  delivered: (
    <>
      <rect x="4" y="9" width="16" height="11" rx="1" />
      <path d="M3 9h18v3H3zM12 9v11" />
      <path d="M12 9c-1-3-4.5-3.5-4.5-1.3C7.5 9 12 9 12 9zM12 9c1-3 4.5-3.5 4.5-1.3C16.5 9 12 9 12 9z" />
    </>
  ),
};

export function OrderProgress({ order }) {
  const reached = new Map((order.status_log || []).map((e) => [e.status, e.at]));
  if (order.status === 'cancelled') {
    return <p className="error">This order was cancelled{reached.get('cancelled') ? ` on ${formatDateTime(reached.get('cancelled'))}` : ''}.</p>;
  }
  const current = STEPS.findIndex((s) => s.value === order.status);
  return (
    <ol className="steps-track" aria-label="Order progress">
      {STEPS.map((s, n) => {
        const done = n <= current || reached.has(s.value);
        return (
          <li
            key={s.value}
            className={done ? 'reached' : ''}
            aria-current={n === current ? 'step' : undefined}
          >
            <span className="track-dot" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">{STEP_ICONS[s.value]}</svg>
            </span>
            <span className="track-label">{s.label}</span>
            {reached.has(s.value) && <span className="muted small">{formatDateTime(reached.get(s.value))}</span>}
          </li>
        );
      })}
    </ol>
  );
}

export default function Track() {
  const [params, setParams] = useSearchParams();
  const [code, setCode] = useState(params.get('code') || '');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const lookup = async (value) => {
    const wanted = value.trim();
    if (!wanted) return;
    setBusy(true);
    setError('');
    setOrder(null);
    const { data, error: err } = await supabase.rpc('track_order', { p_code: wanted });
    setBusy(false);
    if (err) return setError('Could not look up that order right now. Please try again.');
    if (!data) return setError('We could not find an order with that ID. Check it and try again.');
    setOrder(data);
  };

  // Open straight to the result when arriving from a WhatsApp link (/track?code=...).
  useEffect(() => {
    const fromLink = params.get('code');
    if (fromLink && supabaseEnabled) lookup(fromLink);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = (e) => {
    e.preventDefault();
    setParams(code.trim() ? { code: code.trim() } : {});
    lookup(code);
  };

  if (!supabaseEnabled) {
    return (
      <div className="container page narrow">
        <h1>Order tracking unavailable</h1>
        <p className="muted">Tracking isn't available right now. Please message us on WhatsApp.</p>
      </div>
    );
  }

  return (
    <div className="container page narrow">
      <p className="eyebrow">Track</p>
      <h1>Track your order</h1>
      <form className="form narrow-form" onSubmit={submit}>
        <label className="field">
          Order ID
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ORD-XXXXX-XXXXX" autoCapitalize="characters" />
        </label>
        {error && <span className="error" role="alert">{error}</span>}
        <button className="btn" type="submit" disabled={busy || !code.trim()}>{busy ? 'Checking…' : 'Track order'}</button>
      </form>

      {order && (
        <div className="panel panel-pad" role="status">
          <h3 className="panel-title">{order.code}</h3>
          <p>Status: <strong>{statusLabel(order.status)}</strong></p>
          <OrderProgress order={order} />
          <ul className="plain">
            {order.items.map((i, n) => <li key={n}>{i.name} × {i.qty}</li>)}
          </ul>
          <p><strong>Total: {formatINR(order.total)}</strong></p>
        </div>
      )}
    </div>
  );
}
