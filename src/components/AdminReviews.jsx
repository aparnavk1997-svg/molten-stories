import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatDate } from '../utils/orders';

const UNSET = 999;
const STATUS_LABEL = { pending: 'New — waiting', approved: 'Shown on site', rejected: 'Hidden' };

const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    const { data, error: err } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
    if (err) setError(err.message);
    else {
      setReviews(data);
      setError('');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Shown reviews first in their site order (1, 2, 3 ...), then new ones, then hidden ones.
  const sorted = useMemo(() => {
    const rank = { approved: 0, pending: 1, rejected: 2 };
    return [...reviews].sort(
      (a, b) =>
        rank[a.status] - rank[b.status] ||
        (a.status === 'approved' ? a.sort_order - b.sort_order : 0) ||
        new Date(b.created_at) - new Date(a.created_at)
    );
  }, [reviews]);

  const update = async (review, patch, message) => {
    setNotice('');
    const { data, error: err } = await supabase.from('reviews').update(patch).eq('id', review.id).select().single();
    if (err) return setError(err.message);
    setError('');
    setReviews((list) => list.map((r) => (r.id === review.id ? data : r)));
    if (message) setNotice(message);
  };

  const toggle = (r) =>
    r.status === 'approved'
      ? update(r, { status: 'rejected' }, `Hid ${r.name}'s review.`)
      : update(r, { status: 'approved' }, `${r.name}'s review is now shown on the site.`);

  const setPosition = (r, value) => {
    const n = value === '' ? UNSET : Math.max(1, Math.min(998, Math.round(Number(value))));
    if (!Number.isFinite(n) || n === r.sort_order) return;
    update(r, { sort_order: n }, n === UNSET ? 'Position cleared.' : `Moved to position ${n}.`);
  };

  const remove = async (r) => {
    if (!window.confirm(`Delete ${r.name}'s review permanently?`)) return;
    const { error: err } = await supabase.from('reviews').delete().eq('id', r.id);
    if (err) return setError(err.message);
    setReviews((list) => list.filter((x) => x.id !== r.id));
    setNotice('Review deleted.');
  };

  const newCount = reviews.filter((r) => r.status === 'pending').length;

  return (
    <div className="panel">
      <h3 className="panel-title">
        Reviews ({reviews.length})
        {newCount > 0 && <span className="muted small"> · {newCount} new</span>}
      </h3>
      <p className="muted small panel-pad">
        New reviews are shown on the homepage straight away and get the next position (1, 2, 3…) automatically. Change a position to reorder, or Disable a review to hide it.
      </p>
      {notice && <p className="admin-notice panel-pad" role="status">{notice}</p>}
      {error && <p className="error panel-pad" role="alert">{error}</p>}
      {reviews.length === 0 && !error && <p className="panel-pad muted">No reviews yet.</p>}
      <ul className="plain">
        {sorted.map((r) => (
          <li key={r.id} className={`admin-row ${r.status === 'rejected' ? 'is-disabled' : ''}`}>
            <div className="cart-info">
              <strong>{r.name}{r.city ? ` · ${r.city}` : ''}</strong>
              <span className="muted small">
                <span aria-label={`${r.rating} out of 5 stars`}>{stars(r.rating)}</span>
                {r.product_name ? ` · ${r.product_name}` : ''} · {formatDate(r.created_at)}
              </span>
              <span>“{r.body}”</span>
              {r.images?.length > 0 && (
                <span className="review-photos">
                  {r.images.map((src) => (
                    <a key={src} href={src} target="_blank" rel="noopener noreferrer"><img src={src} alt={`Photo from ${r.name}`} /></a>
                  ))}
                </span>
              )}
              <span className={r.status === 'pending' ? 'admin-notice' : 'muted small'}>{STATUS_LABEL[r.status]}</span>
            </div>
            <div className="btn-row">
              <label className="muted small">
                Position{' '}
                <input
                  type="number" min="1" max="998" style={{ width: '4.5rem' }}
                  key={`${r.id}-${r.sort_order}`}
                  defaultValue={r.sort_order === UNSET ? '' : r.sort_order}
                  onBlur={(e) => setPosition(r, e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                  disabled={r.status !== 'approved'}
                  title={r.status === 'approved' ? 'Order on the site (1 = first)' : 'Enable the review to set its position'}
                />
              </label>
              <button className="btn btn-outline btn-small" onClick={() => toggle(r)}>
                {r.status === 'approved' ? 'Disable' : 'Enable'}
              </button>
              <button className="btn btn-outline btn-small" onClick={() => remove(r)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
