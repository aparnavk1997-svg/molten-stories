import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { INSTAGRAM_URL, STORY_MESSAGE, whatsappUrl } from '../utils/whatsapp';
import { supabase, supabaseEnabled } from '../lib/supabase';

// Placeholder reviews, shown only until at least one real review has been enabled in /admin.
const PLACEHOLDER_REVIEWS = [
  { id: 'p1', quote: 'The scent filled the whole room without being overpowering. It now sits on my desk every evening.', name: 'Anjali', place: 'Kochi', rating: 5 },
  { id: 'p2', quote: 'I ordered a gift box for my sister and she loved every detail, right down to the little card.', name: 'Meera', place: 'Bengaluru', rating: 5 },
  { id: 'p3', quote: 'Burns evenly and looks beautiful even when unlit. Easily the prettiest thing on my shelf.', name: 'Riya', place: 'Chennai', rating: 5 },
  { id: 'p4', quote: 'Packed with so much care. It felt like opening a present, and the candle smells divine.', name: 'Sneha', place: 'Thrissur', rating: 5 },
];

const STAR_PATH = 'M12 2.8l2.8 5.7 6.3.9-4.6 4.4 1.1 6.2L12 17l-5.6 3 1.1-6.2L2.9 9.4l6.3-.9L12 2.8z';

function Stars({ value, size = 16 }) {
  return (
    <span className="rv-stars" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={n <= Math.round(value) ? 'on' : ''}>
          <path d={STAR_PATH} />
        </svg>
      ))}
    </span>
  );
}

export default function Testimonials() {
  const [reviews, setReviews] = useState(PLACEHOLDER_REVIEWS);
  const [isReal, setIsReal] = useState(false);
  const [edge, setEdge] = useState({ start: true, end: false, scrollable: false });
  const track = useRef(null);

  // Enabled reviews from the database, in the order set in /admin (position 1, 2, 3 ...).
  useEffect(() => {
    if (!supabaseEnabled) return undefined;
    let cancelled = false;
    supabase
      .from('reviews')
      .select('id, name, city, body, rating, product_name, images, sort_order, created_at')
      .eq('status', 'approved')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(12)
      .then(({ data }) => {
        if (cancelled || !data?.length) return;
        setReviews(
          data.map((r) => ({
            id: r.id, quote: r.body, name: r.name, place: r.city, rating: r.rating || 5,
            product: r.product_name, images: r.images || [],
          }))
        );
        setIsReal(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdge({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
      scrollable: el.scrollWidth > el.clientWidth + 4,
    });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure, reviews]);

  const scrollBy = (dir) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector('.rv-card');
    const step = (card?.offsetWidth || 320) + 16;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <section className="container section testimonials" aria-label="Customer reviews">
      <div className="rv-head">
        <div>
          <p className="eyebrow">Kind words</p>
          <h2>Stories from our customers</h2>
        </div>
        <div className="rv-side">
          {isReal && (
            <p className="rv-summary">
              <strong className="rv-score">{average.toFixed(1)}</strong>
              <span>
                <Stars value={average} size={18} />
                <span className="muted">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</span>
              </span>
            </p>
          )}
          <div className="rv-controls">
            <Link className="btn btn-outline btn-small" to="/review">Write a review</Link>
            {edge.scrollable && (
              <>
                <button type="button" className="rv-arrow" onClick={() => scrollBy(-1)} disabled={edge.start} aria-label="Previous reviews">‹</button>
                <button type="button" className="rv-arrow" onClick={() => scrollBy(1)} disabled={edge.end} aria-label="Next reviews">›</button>
              </>
            )}
          </div>
        </div>
      </div>

      <ul className="plain rv-track" ref={track} onScroll={measure} tabIndex={0} aria-label="Scroll to read more reviews">
        {reviews.map((r) => (
          <li key={r.id} className="rv-card">
            {r.images?.length > 0 ? (
              <img className="rv-photo" src={r.images[0]} alt={`Photo from ${r.name}`} loading="lazy" />
            ) : (
              <div className="rv-photo rv-photo-empty" aria-hidden="true">“</div>
            )}
            <div className="rv-body">
              <Stars value={r.rating} />
              <blockquote>{r.quote}</blockquote>
              <footer className="rv-who">
                <span className="rv-avatar" aria-hidden="true">{r.name.trim().charAt(0).toUpperCase()}</span>
                <span className="rv-meta">
                  <span className="rv-name">
                    <strong>{r.name}</strong>
                    {r.place ? ` · ${r.place}` : ''}
                  </span>
                  {r.product && <span className="rv-product">on {r.product}</span>}
                </span>
              </footer>
            </div>
          </li>
        ))}
      </ul>

      <p className="review-share">
        Burnt one of our candles? Share your story on{' '}
        <a className="link" href={whatsappUrl(STORY_MESSAGE)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
        {' '}or{' '}
        <a className="link" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">Instagram</a>.
      </p>
    </section>
  );
}
