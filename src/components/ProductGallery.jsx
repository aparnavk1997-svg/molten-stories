import { useState } from 'react';
import ProductImage, { getImages } from './ProductImage';

/** Large photo with a thumbnail strip when the product has more than one photo. */
export default function ProductGallery({ product }) {
  const images = getImages(product);
  const [index, setIndex] = useState(0);
  const current = Math.min(index, Math.max(images.length - 1, 0));

  return (
    <div className="gallery">
      <div className="detail-media">
        <ProductImage product={product} index={current} />
      </div>
      {images.length > 1 && (
        <div className="gallery-thumbs" role="group" aria-label={`${product.name} photos`}>
          {images.map((src, i) => (
            <button
              key={src.slice(-40) + i}
              type="button"
              className={`gallery-thumb ${i === current ? 'active' : ''}`}
              onClick={() => setIndex(i)}
              aria-label={`Show photo ${i + 1} of ${images.length}`}
              aria-current={i === current}
            >
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
