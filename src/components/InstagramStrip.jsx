import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from '../utils/whatsapp';
import Reveal from './Reveal';

// Static strip: swap `img` for your own post photos (save them in /public/img/instagram/)
// and set `href` to each post's URL (https://www.instagram.com/p/XXXX/) to deep-link to it.
const POSTS = [
  { img: '/img/gifting1.jpg', alt: 'A gift basket of hand-poured candles' },
  { img: '/img/products/peony-paradise.jpg', alt: 'Peony Paradise candle' },
  { img: '/img/floral.jpeg', alt: 'Floral candle collection' },
  { img: '/img/products/garden-glow.jpg', alt: 'Garden Glow candle' },
  { img: '/img/products/lantern-light.jpg', alt: 'Lantern Light candle' },
  { img: '/img/products/bouquet.jpg', alt: 'Bouquet candle' },
];

export default function InstagramStrip() {
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
        {POSTS.map((p) => (
          <Reveal
            as="a"
            key={p.img}
            href={p.href ?? INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="insta-tile"
            aria-label={`${p.alt} — view on Instagram`}
          >
            <img src={p.img} alt="" loading="lazy" />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
