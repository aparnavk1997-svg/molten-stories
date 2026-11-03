import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="container page narrow">
      <p className="eyebrow">A little about us</p>
      <h1>Stories made by hand.</h1>
      <p className="lead">
        Molten Stories is a small candle brand inspired by the beauty of thoughtful details and
        meaningful moments.
      </p>
      <p>
        From delicate floral shapes to traditional cherath-inspired designs, every creation is made
        to add warmth to your space and joy to someone's day.
      </p>
      <p>
        Whether it's a gift, a celebration or a treat for yourself, there's a little story waiting
        to glow.
      </p>
      <Link to="/shop" className="btn">Explore the collection</Link>
    </div>
  );
}
