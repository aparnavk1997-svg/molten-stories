import { useCallback, useEffect, useRef, useState } from 'react';
import ProductCard from './ProductCard';

/** Product cards in a swipeable row. Arrows page through it and only appear when there is more to see. */
export default function ProductCarousel({ products, label }) {
  const track = useRef(null);
  const [edge, setEdge] = useState({ start: true, end: true });

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdge({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return undefined;
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener('scroll', measure);
      ro?.disconnect();
    };
  }, [measure, products.length]);

  const page = (dir) => {
    const el = track.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: reduced ? 'auto' : 'smooth' });
  };

  const scrollable = !(edge.start && edge.end);

  return (
    <div className="pcar" role="region" aria-roledescription="carousel" aria-label={label}>
      {scrollable && (
        <>
          <button type="button" className="pcar-arrow pcar-prev" onClick={() => page(-1)} disabled={edge.start} aria-label="Previous candles">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button type="button" className="pcar-arrow pcar-next" onClick={() => page(1)} disabled={edge.end} aria-label="Next candles">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
      <div className="pcar-track" ref={track}>
        {products.map((p) => (
          <div className="pcar-item" key={p.id}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </div>
  );
}
