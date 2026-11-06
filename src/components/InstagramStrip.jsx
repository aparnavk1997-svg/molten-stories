import { useEffect, useState } from 'react';
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from '../utils/whatsapp';
import Reveal from './Reveal';

// Live posts come from a JSON feed (e.g. Behold) set in VITE_INSTAGRAM_FEED_URL. See README → Instagram feed.
// Without it, or if it can't be reached, these static photos are shown instead.
const FEED_URL = import.meta.env.VITE_INSTAGRAM_FEED_URL;
const LIMIT = 6;

const FALLBACK_POSTS = [
  { id: 'f1', img: '/img/gifting1.jpg', alt: 'A gift basket of hand-poured candles' },
  { id: 'f2', img: '/img/products/peony-paradise.jpg', alt: 'Peony Paradise candle' },
  { id: 'f3', img: '/img/floral.jpeg', alt: 'Floral candle collection' },
  { id: 'f4', img: '/img/products/garden-glow.jpg', alt: 'Garden Glow candle' },
  { id: 'f5', img: '/img/products/lantern-light.jpg', alt: 'Lantern Light candle' },
  { id: 'f6', img: '/img/products/bouquet.jpg', alt: 'Bouquet candle' },
];

const CACHE_KEY = 'ig-feed-v2';
const CACHE_MS = 30 * 60 * 1000;

function readCache() {
  try {
    const c = JSON.parse(sessionStorage.getItem(CACHE_KEY));
    if (c && Date.now() - c.at < CACHE_MS && Array.isArray(c.posts) && c.posts.length) return c.posts;
  } catch {
    /* ignore corrupt cache */
  }
  return null;
}

/**
 * Turns a Behold-style feed ({ posts: [...] }) into tiles. Picks a still image for each post:
 * videos use their thumbnail, and sized variants are preferred over the full-size file.
 */
function parseFeed(json) {
  const list = Array.isArray(json) ? json : json?.posts;
  if (!Array.isArray(list)) return [];
  return list
    .map((p, n) => {
      const img =
        p.sizes?.medium?.mediaUrl ||
        p.sizes?.large?.mediaUrl ||
        p.thumbnailUrl ||
        (p.mediaType === 'VIDEO' ? null : p.mediaUrl) ||
        null;
      return {
        id: String(p.id ?? n),
        img,
        href: p.permalink || INSTAGRAM_URL,
        alt: String(p.caption || p.prunedCaption || 'Instagram post').replace(/\s+/g, ' ').trim().slice(0, 100),
      };
    })
    .filter((p) => p.img)
    .slice(0, LIMIT);
}

export default function InstagramStrip() {
  const [posts, setPosts] = useState(() => (FEED_URL ? readCache() : null));
  const [failed, setFailed] = useState(!FEED_URL);

  useEffect(() => {
    if (posts || !FEED_URL) return undefined;
    const ctrl = new AbortController();
    fetch(FEED_URL, { signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`Feed responded ${r.status}`);
        return r.json();
      })
      .then((json) => {
        const parsed = parseFeed(json);
        if (!parsed.length) return setFailed(true);
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), posts: parsed }));
        setPosts(parsed);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setFailed(true);
      });
    return () => ctrl.abort();
  }, [posts]);

  const shown = posts || (failed ? FALLBACK_POSTS : null);

  return (
    <section className="container section insta">
      <Reveal className="section-head">
        <div>
          <p className="eyebrow">On Instagram</p>
          <h2>Follow our little moments</h2>
        </div>
        <a className="link" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
          {INSTAGRAM_HANDLE} →
        </a>
      </Reveal>
      <div className="insta-grid">
        {shown
          ? shown.map((p) => (
              <Reveal
                as="a"
                key={p.id}
                href={p.href ?? INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="insta-tile"
                aria-label={`${p.alt} — view on Instagram`}
              >
                <img src={p.img} alt="" loading="lazy" referrerPolicy="no-referrer" />
              </Reveal>
            ))
          : FALLBACK_POSTS.map((p) => <span key={p.id} className="insta-tile insta-skeleton" aria-hidden="true" />)}
      </div>
    </section>
  );
}
