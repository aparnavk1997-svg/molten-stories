import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useProducts } from '../context/ProductsContext';
import { useAuth } from '../context/AuthContext';
import { deliveryInfo, formatINR, isAddressValid, isPin } from '../utils/pricing';
import { fetchAddressFromPincode } from '../utils/pincode';
import { ORDER_STATUSES, formatDate, shareOrderOnWhatsApp, statusLabel } from '../utils/orders';

const EMPTY_CUSTOMER = { name: '', phone: '', street: '', city: '', state: '', pin: '' };

export default function AdminOrders() {
  const { allProducts } = useProducts();
  const { session } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [mailNotice, setMailNotice] = useState('');   // result of the "order confirmed" email

  // Create-order form state.
  const [username, setUsername] = useState('');
  const [mode, setMode] = useState(null); // null = not looked up yet, 'user' or 'guest'
  const [userId, setUserId] = useState(null);
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER);
  const [items, setItems] = useState([]);
  const [pickId, setPickId] = useState('');
  const [pickQty, setPickQty] = useState(1);
  const [feeOverride, setFeeOverride] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pinLookup, setPinLookup] = useState({ loading: false, error: null, location: null });

  const load = useCallback(async () => {
    const { data, error: err } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (err) setLoadError(err.message);
    else {
      setOrders(data);
      setLoadError('');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.qty, 0), [items]);
  const autoFee = deliveryInfo(customer.pin, subtotal)?.fee ?? 0;
  const fee = feeOverride === '' ? autoFee : Number(feeOverride);
  const total = subtotal + (Number.isFinite(fee) ? fee : 0);

  const setField = (k) => async (e) => {
    let val = e.target.value;
    if (k === 'phone') val = val.replace(/\D/g, '').slice(0, 10);
    if (k === 'pin') {
      val = val.replace(/\D/g, '').slice(0, 6);
      if (val.length === 6) {
        if (!isPin(val)) {
          setPinLookup({ loading: false, error: 'Enter a valid 6-digit PIN code.', location: null });
        } else {
          setPinLookup({ loading: true, error: null, location: null });
          const res = await fetchAddressFromPincode(val);
          if (res.success) {
            setPinLookup({ loading: false, error: null, location: `${res.city}, ${res.state}` });
            setCustomer((prev) => ({
              ...prev,
              pin: val,
              city: res.city || prev.city,
              state: res.state || prev.state,
            }));
            return;
          } else if (res.valid === false) {
            setPinLookup({ loading: false, error: res.error || 'Invalid PIN code. Location not found.', location: null });
          } else {
            setPinLookup({ loading: false, error: null, location: null });
          }
        }
      } else {
        setPinLookup({ loading: false, error: null, location: null });
      }
    }
    setCustomer((c) => ({ ...c, [k]: val }));
  };

  const resetForm = () => {
    setPinLookup({ loading: false, error: null, location: null });
    setUsername('');
    setMode(null);
    setUserId(null);
    setCustomer(EMPTY_CUSTOMER);
    setItems([]);
    setPickId('');
    setPickQty(1);
    setFeeOverride('');
    setNotes('');
    setError('');
  };

  const lookUp = async () => {
    setError('');
    const name = username.trim().toLowerCase();
    if (!name) return setError('Enter a username, or GUEST for a customer without an account.');
    if (name === 'guest') {
      setMode('guest');
      setUserId(null);
      setCustomer(EMPTY_CUSTOMER);
      return;
    }
    setBusy(true);
    const { data, error: err } = await supabase.from('profiles').select('*').eq('username', name).maybeSingle();
    setBusy(false);
    if (err) return setError(err.message);
    if (!data) return setError(`No customer with the username "${name}". Check the spelling, or use GUEST.`);
    setMode('user');
    setUserId(data.id);
    setCustomer({
      name: data.full_name || '', phone: data.phone || '', street: data.street || '',
      city: data.city || '', state: data.state || '', pin: data.pin || '',
    });
  };

  const addItem = () => {
    const p = allProducts.find((x) => x.id === Number(pickId));
    const qty = Math.max(1, Math.min(20, Number(pickQty) || 1));
    if (!p) return;
    setItems((list) => {
      const existing = list.find((i) => i.id === p.id);
      if (existing) return list.map((i) => (i.id === p.id ? { ...i, qty: Math.min(20, i.qty + qty) } : i));
      return [...list, { id: p.id, name: p.name, price: p.price, qty }];
    });
    setPickId('');
    setPickQty(1);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const clean = Object.fromEntries(Object.entries(customer).map(([k, v]) => [k, v.trim()]));
    if (!isAddressValid(clean)) {
      return setError('Check the customer details: name, a 10-digit phone, street, city, state and a 6-digit PIN are all required.');
    }
    if (items.length === 0) return setError('Add at least one item.');
    if (!Number.isFinite(fee) || fee < 0) return setError('Delivery charge must be 0 or more.');

    setBusy(true);
    const { data, error: err } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        username: mode === 'guest' ? 'GUEST' : username.trim().toLowerCase(),
        customer_name: clean.name, phone: clean.phone, street: clean.street,
        city: clean.city, state: clean.state, pin: clean.pin,
        items, subtotal, delivery_fee: fee, total, notes: notes.trim(),
      })
      .select()
      .single();
    setBusy(false);
    if (err) return setError(err.message);
    setCreated(data);
    setOrders((list) => [data, ...list]);
    resetForm();
  };

  /** Emails the customer when an order moves from Placed to Confirmed. Never blocks the status change. */
  const sendConfirmedEmail = async (order) => {
    try {
      const res = await fetch('/.netlify/functions/order-confirmed-email', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ code: order.code }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return setMailNotice(`${order.code} is confirmed, but the confirmation email was not sent: ${body.error || 'unknown error'}.`);
      if (body.sent) return setMailNotice(`${order.code} is confirmed. A confirmation email was sent to the customer.`);
      if (body.reason === 'guest') return setMailNotice(`${order.code} is confirmed. This is a guest order, so there is no email address to write to. Send the WhatsApp message instead.`);
      if (body.reason === 'no-email') return setMailNotice(`${order.code} is confirmed, but no email address was found for the customer.`);
    } catch {
      setMailNotice(`${order.code} is confirmed, but the confirmation email could not be sent. Check your connection and the email setup.`);
    }
  };

  const changeStatus = async (order, status) => {
    setMailNotice('');
    const { data, error: err } = await supabase
      .from('orders').update({ status }).eq('id', order.id).select().single();
    if (err) return setLoadError(err.message);
    setOrders((list) => list.map((o) => (o.id === order.id ? data : o)));
    if (order.status === 'placed' && status === 'confirmed') sendConfirmedEmail(data);
  };

  return (
    <div className="admin-layout">
      <form className="panel panel-pad form admin-form" onSubmit={submit} noValidate>
        <h3 className="panel-title">Create an order</h3>

        <div className="field">
          <label htmlFor="order-username">Customer username</label>
          <div className="btn-row">
            <input
              id="order-username"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setMode(null); }}
              placeholder="username, or GUEST"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); lookUp(); } }}
            />
            <button type="button" className="btn btn-outline btn-small" onClick={lookUp} disabled={busy}>Look up</button>
          </div>
          {mode === 'user' && <span className="admin-notice">Found @{username.trim().toLowerCase()} — saved address filled in.</span>}
          {mode === 'guest' && <span className="muted small">Guest order: enter the customer's details below.</span>}
        </div>

        {mode && (
          <>
            <label className="field">
              Customer name
              <input value={customer.name} onChange={setField('name')} autoComplete="off" />
            </label>
            <label className="field">
              Phone (10 digits, used for WhatsApp)
              <input inputMode="numeric" maxLength={10} value={customer.phone} onChange={setField('phone')} />
            </label>
            <label className="field">
              Street address
              <input value={customer.street} onChange={setField('street')} />
            </label>
            <div className="two-col">
              <label className="field">
                City
                <input value={customer.city} onChange={setField('city')} />
              </label>
              <label className="field">
                State
                <input value={customer.state} onChange={setField('state')} />
              </label>
            </div>
            <label className="field">
              PIN code
              <input inputMode="numeric" maxLength={6} value={customer.pin} onChange={setField('pin')} />
              {pinLookup.loading && <span className="pin-status loading">Looking up pincode…</span>}
              {pinLookup.location && <span className="pin-status success">✓ {pinLookup.location}</span>}
              {pinLookup.error && <span className="small error">{pinLookup.error}</span>}
            </label>

            <div className="field">
              <label htmlFor="order-product">Items</label>
              <div className="btn-row">
                <select id="order-product" value={pickId} onChange={(e) => setPickId(e.target.value)}>
                  <option value="">Choose a candle…</option>
                  {allProducts.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — {formatINR(p.price)}</option>
                  ))}
                </select>
                <input
                  type="number" min="1" max="20" value={pickQty} aria-label="Quantity"
                  onChange={(e) => setPickQty(e.target.value)} style={{ width: '4.5rem' }}
                />
                <button type="button" className="btn btn-outline btn-small" onClick={addItem} disabled={!pickId}>Add</button>
              </div>
            </div>
            {items.length > 0 && (
              <ul className="plain">
                {items.map((i) => (
                  <li key={i.id} className="admin-row">
                    <div className="cart-info">
                      <strong>{i.name}</strong>
                      <span className="muted small">{formatINR(i.price)} × {i.qty} = {formatINR(i.price * i.qty)}</span>
                    </div>
                    <button type="button" className="btn btn-outline btn-small"
                      onClick={() => setItems((l) => l.filter((x) => x.id !== i.id))}>Remove</button>
                  </li>
                ))}
              </ul>
            )}

            <label className="field">
              Delivery charge (₹) — leave blank for the automatic rate ({formatINR(autoFee)})
              <input type="number" min="0" step="1" value={feeOverride} onChange={(e) => setFeeOverride(e.target.value)} />
            </label>
            <label className="field">
              Notes (optional, only you see this)
              <input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>

            <p><strong>Total: {formatINR(total)}</strong> <span className="muted small">(items {formatINR(subtotal)} + delivery {formatINR(Number.isFinite(fee) ? fee : 0)})</span></p>
          </>
        )}

        {error && <span className="error" role="alert">{error}</span>}
        <div className="btn-row">
          <button className="btn" type="submit" disabled={busy || !mode}>{busy ? 'Working…' : 'Generate order ID'}</button>
          {mode && <button className="btn btn-outline" type="button" onClick={resetForm}>Cancel</button>}
        </div>

        {created && (
          <div className="admin-notice" role="status">
            <p>Order created. Order ID: <strong>{created.code}</strong></p>
            <button type="button" className="btn btn-small" onClick={() => shareOrderOnWhatsApp(created)}>
              Share on WhatsApp
            </button>
          </div>
        )}
      </form>

      <div className="panel">
        <h3 className="panel-title">Orders ({orders.length})</h3>
        {loadError && <p className="error panel-pad" role="alert">{loadError}</p>}
        {mailNotice && <p className="admin-notice" role="status" style={{ margin: '0 1rem 0.5rem' }}>{mailNotice}</p>}
        {orders.length === 0 && !loadError && <p className="panel-pad muted">No orders yet.</p>}
        <ul className="plain">
          {orders.map((o) => (
            <li key={o.id} className="admin-row">
              <div className="cart-info">
                <strong>{o.code}</strong>
                {o.source === 'customer' && o.status === 'placed' && <span className="admin-hidden">New — please confirm</span>}
                <span className="muted small">
                  {o.username === 'GUEST' ? 'Guest' : `@${o.username}`} · {o.customer_name} · {formatDate(o.created_at)}
                </span>
                <span className="muted small">
                  {[...o.items.map((i) => `${i.name} ×${i.qty}`), ...(o.hampers || []).map(() => 'Gift box')].join(', ')} · {formatINR(o.total)}
                </span>
              </div>
              <div className="btn-row">
                <select
                  value={o.status}
                  onChange={(e) => changeStatus(o, e.target.value)}
                  aria-label={`Status for ${o.code} (currently ${statusLabel(o.status)})`}
                >
                  {ORDER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <button className="btn btn-outline btn-small" onClick={() => shareOrderOnWhatsApp(o)}>WhatsApp</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
