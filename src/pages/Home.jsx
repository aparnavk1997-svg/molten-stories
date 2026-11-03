import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useProducts } from '../context/ProductsContext';
import { GIFT_ENQUIRY, whatsappUrl } from '../utils/whatsapp';

const collections = [
  { name: 'Floral Collection', category: 'Floral', img: '/img/floral.jpeg', pos: 'center 45%', zoom: 1 },
  { name: 'Decorative Candles', category: 'Decorative', img: '/img/decorative.jpeg', pos: 'center 68%', zoom: 1 },
  { name: 'Everyday Glow', category: 'Everyday', img: '/img/everyday.jpeg', pos: 'center 62%', zoom: 1 },
  { name: 'Gifting & Hampers', category: 'Gifting', img: '/img/hampers.jpeg', pos: 'center 50%', zoom: 1 },
];

export default function Home() {
  const { products } = useProducts();
  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <p className="eyebrow">Handpoured with love · Made for meaningful moments</p>
            <h1>Light up your <em>little moments.</em></h1>
            <p className="lead">
              Thoughtfully crafted candles that bring a little warmth, beauty and magic into your
              everyday moments.
            </p>
            <div className="hero-actions">
              <Link to="/shop" className="btn">Explore the collection</Link>
              <Link to="/about" className="btn btn-outline">Our story</Link>
            </div>
          </div>
          <img
            src="/img/hero.jpeg"
            alt="A lit candle in a glass jar glowing in warm window light beside dried flowers"
            className="hero-photo"
            fetchpriority="high"
          />
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Find your favourite</p>
            <h2>Made to make you smile</h2>
          </div>
          <Link to="/shop" className="link">View all →</Link>
        </div>
        <div className="collections">
          {collections.map((c) => (
            <Link key={c.category} to={`/shop?c=${c.category}`} className="collection">
              <img src={c.img} alt="" loading="lazy" style={{ objectPosition: c.pos, '--z': c.zoom, transformOrigin: c.pos }} />
              <span>{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <div>
            <p className="eyebrow">The candle edit</p>
            <h2>Shop our collection</h2>
          </div>
          <Link to="/shop" className="link">View all →</Link>
        </div>
        <div className="grid">
          {products.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="band">
        <div className="container gifting">
          <img
            src="/img/gifting.jpg"
            alt="A cream gift basket of hand-poured peony and ranunculus candles tied with a pink ribbon"
            className="gifting-photo"
            loading="lazy"
          />
          <div className="gifting-copy">
            <p className="eyebrow">Made for your moments</p>
            <h2>Gifting something special?</h2>
            <p className="muted">
              Let's create a thoughtful candle gift or customised hamper for your occasion.
            </p>
            <a
              className="btn"
              href={whatsappUrl(GIFT_ENQUIRY)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Enquire on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
