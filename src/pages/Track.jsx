import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase, supabaseEnabled } from '../lib/supabase';
import { formatINR } from '../utils/pricing';
import { ORDER_STATUSES, formatDateTime, statusLabel } from '../utils/orders';

const STEPS = ORDER_STATUSES.filter((s) => s.value !== 'cancelled');

export function OrderProgress({ order }) {
  const reached = new Map((order.status_log || []).map((e) => [e.status, e.at]));
  if (order.status === 'cancelled') {
    return <p className="error">This order was cancelled{reached.get('cancelled') ? ` on ${formatDateTime(reached.get('cancelled'))}` : ''}.</p>;
  }
  return (
    <ol className="plain">
      {STEPS.map((s) => (
        <li key={s.value} className={reached.has(s.value) ? '' : 'muted'}>
          {reached.has(s.value) ? '✓' : '○'} <strong>{s.label}</strong>
          {reached.has(s.value) && <span className="muted small"> · {formatDateTime(reached.get(s.value))}</span>}
        </li>
      ))}
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
