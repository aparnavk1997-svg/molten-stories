import { Link, useParams } from 'react-router-dom';
import ProductGallery from '../components/ProductGallery';
import ProductCard from '../components/ProductCard';
import { PriceTag } from '../components/PriceBits';
import { useProducts } from '../context/ProductsContext';
import { useCart } from '../context/CartContext';
import { placeOrderOnWhatsApp } from '../utils/whatsapp';

export default function ProductDetail() {
  const { id } = useParams();
  const { products, getProduct } = useProducts();
  const product = getProduct(id);
  const { add } = useCart();

  if (!product) {
    return (
      <div className="container page center-text">
        <h1>Candle not found</h1>
        <Link to="/shop" className="btn">Back to shop</Link>
      </div>
    );
  }

  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  return (
    <div className="container page">
      <p className="small">
        <Link to="/" className="link">Home</Link> › <Link to="/shop" className="link">Shop</Link> ›{' '}
        {product.name}
      </p>
      <div className="detail">
        <ProductGallery key={product.id} product={product} />

        <div>
          <p className="eyebrow">{product.category}</p>
          <h1 className="detail-title">{product.name}</h1>
          <div className="detail-price"><PriceTag product={product} large /></div>
          <p className="lead">{product.desc}</p>

          <dl className="specs">
            <div><dt>Collection</dt><dd>{product.category}</dd></div>
            <div><dt>Made</dt><dd>Handmade, small-batch</dd></div>
            <div><dt>Ordering</dt><dd>Confirmed on WhatsApp</dd></div>
          </dl>

          <div className="detail-cta">
            <button className="btn btn-cart" onClick={() => add(product.id)}>Add to bag</button>
            <button
              className="btn btn-buy"
              onClick={() => placeOrderOnWhatsApp([{ ...product, qty: 1 }])}
            >
              Place order
            </button>
          </div>
          <p className="muted small">
            Place order opens WhatsApp with this candle in your message. We'll confirm availability,
            delivery charges and payment details.
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <section className="section">
          <h2>You may also like</h2>
          <div className="grid">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
