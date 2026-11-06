import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { INSTAGRAM_URL, STORY_MESSAGE, whatsappUrl } from '../utils/whatsapp';
import { supabase, supabaseEnabled } from '../lib/supabase';
import { useProducts } from '../context/ProductsContext';

// Placeholder reviews, shown only until at least one real review has been enabled in /admin.
const PLACEHOLDER_REVIEWS = [
  { id: 'p1', quote: 'The scent filled the whole room without being overpowering. It now sits on my desk every evening.', name: 'Anjali', place: 'Kochi', rating: 5 },
  { id: 'p2', quote: 'I ordered a gift box for my sister and she loved every detail, right down to the little card.', name: 'Meera', place: 'Bengaluru', rating: 5 },
  { id: 'p3', quote: 'Burns evenly and looks beautiful even when unlit. Easily the prettiest thing on my shelf.', name: 'Riya', place: 'Chennai', rating: 5 },
  { id: 'p4', quote: 'Packed with so much care. It felt like opening a present, and the candle smells divine.', name: 'Sneha', place: 'Thrissur', rating: 5 },
];

const INTERVAL = 6000;
const STAR_PATH = 'M12 2.8l2.8 5.7 6.3.9-4.6 4.4 1.1 6.2L12 17l-5.6 3 1.1-6.2L2.9 9.4l6.3-.9L12 2.8z';

function Stars({ value }) {
  return (
    <span className="rv-stars" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className={n <= value ? 'on' : ''}>
          <path d={STAR_PATH} />
        </svg>
      ))}
    </span>
  );
}

export default function Testimonials() {
  const { products } = useProducts();
  const [reviews, setReviews] = useState(PLACEHOLDER_REVIEWS);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Enabled reviews from the database, in the order set in /admin (position 1, 2, 3 ...).
  useEffect(() => {
    if (!supabaseEnabled) return undefined;
    let cancelled = false;
    supabase
      .from('reviews')
      .select('id, name, city, body, rating, product_id, product_name, images, sort_order, created_at')
      .eq('status', 'approved')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(12)
      .then(({ data }) => {
        if (cancelled || !data?.length) return;
        setReviews(
          data.map((r) => ({
            id: r.id, quote: r.body, name: r.name, place: r.city, rating: r.rating || 5,
            product: r.product_name, productId: r.product_id, images: r.images || [],
          }))
        );
        setIndex(0);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (paused) return undefined;
    const t = setTimeout(() => setIndex((i) => (i + 1) % reviews.length), INTERVAL);
    return () => clearTimeout(t);
  }, [index, paused, reviews.length]);

  const go = (n) => setIndex((n + reviews.length) % reviews.length);
  const r = reviews[index];
  const hasMore = Boolean(r.images?.length);
  const reviewed = r.product
    ? products.find((p) => (r.productId && p.id === r.productId) || p.name === r.product)
    : null;

  // Pause only while a mouse is over the review or keyboard focus is inside it.
  // Plain `focus` would also fire after clicking an arrow or dot and freeze the carousel.
  const onPointerEnter = (e) => e.pointerType === 'mouse' && setPaused(true);
  const onPointerLeave = (e) => e.pointerType === 'mouse' && setPaused(false);
  const onFocus = (e) => e.target.matches(':focus-visible') && setPaused(true);

  return (
    <section
      className="container section testimonials"
      aria-roledescription="carousel"
      aria-label="Customer reviews"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onFocus={onFocus}
      onBlur={() => setPaused(false)}
    >
      <p className="eyebrow">Kind words</p>
      <h2>Stories from our customers</h2>

      <figure className="review" key={r.id} aria-live={paused ? 'polite' : 'off'} tabIndex={hasMore ? 0 : undefined}>
        <Stars value={r.rating} />
        <blockquote>“{r.quote}”</blockquote>
        <figcaption>
          {r.name}{r.place && <> · <span className="muted">{r.place}</span></>}
        </figcaption>
        {r.product && (
          <p className="review-product">
            Reviewed:{' '}
            {reviewed ? (
              <Link className="link" to={`/product/${reviewed.id}`}><strong>{r.product}</strong></Link>
            ) : (
              <strong>{r.product}</strong>
            )}
          </p>
        )}

        {/* Photos float in beside the quote on hover or keyboard focus. Shown inline on touch and narrow screens. */}
        {r.images?.length > 0 && (
          <div className="review-more">
            <div className="review-photos">
              {r.images.slice(0, 4).map((src) => (
                <img key={src} src={src} alt={`Photo from ${r.name}`} loading="lazy" />
              ))}
            </div>
          </div>
        )}
      </figure>

      <div className="review-nav">
        <button type="button" className="review-arrow" onClick={() => go(index - 1)} aria-label="Previous review">‹</button>
        <div className="review-dots">
          {reviews.map((x, i) => (
            <button
              key={x.id}
              type="button"
              className={i === index ? 'on' : ''}
              onClick={() => setIndex(i)}
              aria-label={`Review ${i + 1} of ${reviews.length}`}
              aria-current={i === index}
            />
          ))}
        </div>
        <button type="button" className="review-arrow" onClick={() => go(index + 1)} aria-label="Next review">›</button>
      </div>

      <p className="review-share">
        Burnt one of our candles?{' '}
        <Link className="link" to="/review">Write a review</Link>
        {' '}or share your story on{' '}
        <a className="link" href={whatsappUrl(STORY_MESSAGE)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
        {' '}or{' '}
        <a className="link" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">Instagram</a>.
      </p>
    </section>
  );
}
