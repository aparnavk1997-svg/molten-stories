import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { INSTAGRAM_URL, STORY_MESSAGE, whatsappUrl } from '../utils/whatsapp';

// Placeholder reviews: replace with real customer words (and names) before launch.
const REVIEWS = [
  { quote: 'The scent filled the whole room without being overpowering. It now sits on my desk every evening.', name: 'Anjali', place: 'Kochi' },
  { quote: 'I ordered a gift box for my sister and she loved every detail, right down to the little card.', name: 'Meera', place: 'Bengaluru' },
  { quote: 'Burns evenly and looks beautiful even when unlit. Easily the prettiest thing on my shelf.', name: 'Riya', place: 'Chennai' },
  { quote: 'Packed with so much care. It felt like opening a present, and the candle smells divine.', name: 'Sneha', place: 'Thrissur' },
];

const INTERVAL = 6000;

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    if (paused || reduced) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % REVIEWS.length), INTERVAL);
    return () => clearTimeout(t);
  }, [index, paused, reduced]);

  const go = (n) => setIndex((n + REVIEWS.length) % REVIEWS.length);
  const r = REVIEWS[index];

  return (
    <section
      className="container section testimonials"
      aria-roledescription="carousel"
      aria-label="Customer reviews"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <p className="eyebrow">Kind words</p>
      <h2>Stories from our customers</h2>

      <figure className="review" key={index} aria-live={paused ? 'polite' : 'off'}>
        <blockquote>“{r.quote}”</blockquote>
        <figcaption>
          {r.name} · <span className="muted">{r.place}</span>
        </figcaption>
      </figure>

      <div className="review-nav">
        <button type="button" className="review-arrow" onClick={() => go(index - 1)} aria-label="Previous review">‹</button>
        <div className="review-dots">
          {REVIEWS.map((_, i) => (
            <button
              key={i}
              type="button"
              className={i === index ? 'on' : ''}
              onClick={() => setIndex(i)}
              aria-label={`Review ${i + 1} of ${REVIEWS.length}`}
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
