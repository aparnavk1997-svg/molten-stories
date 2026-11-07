import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

/** Fired by the admin screens after an order is created or its status changes, so the bell updates straight away. */
export const ORDERS_CHANGED = 'molten-orders-changed';

const POLL_MS = 30000;

/** Header bell for admins: shows how many customer orders are waiting to be confirmed ("Placed"). */
export default function AdminOrderBell() {
  const { isAdmin } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    const { count: n, error } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'placed');
    if (!error) setCount(n || 0);
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setCount(0);
      return undefined;
    }
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    window.addEventListener('focus', refresh);
    window.addEventListener(ORDERS_CHANGED, refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
      window.removeEventListener(ORDERS_CHANGED, refresh);
    };
  }, [isAdmin, refresh]);

  if (!isAdmin) return null;

  const label = count === 0 ? 'Orders, none waiting' : `Orders, ${count} new ${count === 1 ? 'order' : 'orders'} waiting to be confirmed`;

  return (
    <Link to="/admin?tab=orders" className="icon-link" title={label} aria-label={label}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15L6 16.5z" />
        <path d="M10 20.5a2 2 0 0 0 4 0" />
      </svg>
      {count > 0 && <span className="badge">{count > 99 ? '99+' : count}</span>}
    </Link>
  );
}
