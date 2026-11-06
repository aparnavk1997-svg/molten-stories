import { useEffect, useId, useRef } from 'react';
import { Link } from 'react-router-dom';
import ProductGallery from './ProductGallery';
import { PriceTag } from './PriceBits';
import { useCart } from '../context/CartContext';
import { categoriesOf } from '../data/products';

/** Modal preview of a product: photos, price, description and Add to bag. */
export default function QuickView({ product, onClose }) {
  const ref = useRef(null);
  const titleId = useId();
  const { add } = useCart();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog.open) dialog.showModal();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // `add` copies the photo straight away (so it can fly to the bag), then the modal closes.
  // The bag drawer opens later, after the modal is gone, so it never opens behind it.
  const addToBag = () => {
    add(product.id, ref.current.querySelector('.detail-media img, .detail-media svg'));
    ref.current.close();
  };

  return (
    <dialog
      ref={ref}
      className="quickview"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current.close()}
    >
      <button
        type="button"
        className="drawer-close quickview-close"
        onClick={() => ref.current.close()}
        aria-label="Close quick look"
      >
        ×
      </button>
      <div className="quickview-body">
        <ProductGallery key={product.id} product={product} />
        <div className="quickview-info">
          <p className="eyebrow">{categoriesOf(product).join(' · ')}</p>
          <h2 id={titleId} className="detail-title">{product.name}</h2>
          <div className="detail-price"><PriceTag product={product} large /></div>
          <p className="lead">{product.desc}</p>
          <button type="button" className="btn btn-block" onClick={addToBag}>Add to bag</button>
          <Link
            to={`/product/${product.id}`}
            className="btn btn-outline btn-block"
            onClick={() => ref.current.close()}
          >
            View full details
          </Link>
        </div>
      </div>
    </dialog>
  );
}
