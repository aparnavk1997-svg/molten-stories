import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import ProductGallery from '../components/ProductGallery';
import ProductCard from '../components/ProductCard';
import { PriceTag } from '../components/PriceBits';
import HeartButton from '../components/HeartButton';
import RecentlyViewed from '../components/RecentlyViewed';
import { useProducts } from '../context/ProductsContext';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';
import { useCart } from '../context/CartContext';
import { placeOrderOnWhatsApp, productCode } from '../utils/whatsapp';
import { isAddressValid } from '../utils/pricing';
import { categoriesOf } from '../data/products';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, getProduct } = useProducts();
  const product = getProduct(id);
  const { add, address, placeOrder } = useCart();
  const { record } = useRecentlyViewed();
  const [copied, setCopied] = useState(false);
  const productId = product?.id;

  useEffect(() => {
    if (productId !== undefined) record(productId);
  }, [productId, record]);

  const share = async () => {
    const url = window.location.href;
    const data = { title: product.name, text: `Check out ${product.name} from Molten Stories`, url };
    if (navigator.share) {
      try {
        await navigator.share(data);
      } catch {
        /* user dismissed the share sheet */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link', url);
    }
  };

  if (!product) {
    return (
      <div className="container page center-text">
        <h1>Candle not found</h1>
        <Link to="/shop" className="btn">Back to shop</Link>
      </div>
    );
  }

  const related = products
    .filter((p) => p.id !== product.id && categoriesOf(p).some((c) => categoriesOf(product).includes(c)))
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
          <p className="eyebrow">{categoriesOf(product).join(' · ')}</p>
          <div className="detail-head">
            <h1 className="detail-title">{product.name}</h1>
            <HeartButton product={product} className="detail-heart" />
            <button
              type="button"
              className="share-btn"
              onClick={share}
              aria-label={`Share ${product.name}`}
              title="Share"
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
                <polyline points="16 7 12 3 8 7" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </button>
            <span className="small muted" role="status">{copied ? 'Link copied' : ''}</span>
          </div>
          <div className="detail-price"><PriceTag product={product} large /></div>
          <p className="lead">{product.desc}</p>

          <dl className="specs">
            <div><dt>Product ID</dt><dd>{productCode(product.id)}</dd></div>
            <div><dt>Collection</dt><dd>{categoriesOf(product).join(', ')}</dd></div>
            <div><dt>Wax</dt><dd>Premium soy wax</dd></div>
            <div><dt>Made</dt><dd>Handmade, small-batch</dd></div>
            <div><dt>Ordering</dt><dd>Confirmed on WhatsApp</dd></div>
          </dl>

          <div className="detail-cta">
            <button
              className="btn btn-cart"
              onClick={(e) => add(product.id, e.currentTarget.closest('.detail')?.querySelector('.detail-media img, .detail-media svg'))}
            >
              Add to bag
            </button>
            <button
              className="btn btn-buy"
              onClick={() => {
                if (isAddressValid(address)) {
                  placeOrder([{ ...product, qty: 1 }]);
                } else {
                  add(product.id);
                  navigate('/bag');
                }
              }}
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

      <RecentlyViewed excludeIds={[product.id]} />
    </div>
  );
}
