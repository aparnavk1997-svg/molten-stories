import { useRef, useState } from 'react';
import ProductImage, { getImages } from './ProductImage';

const SWIPE_MIN = 40; // px of horizontal travel that counts as a swipe

/**
 * Large photo with a thumbnail strip when the product has more than one photo.
 * Mouse: hover to zoom, following the pointer. Touch: swipe left/right to change photo.
 */
export default function ProductGallery({ product }) {
  const images = getImages(product);
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const touchStart = useRef(null);
  const current = Math.min(index, Math.max(images.length - 1, 0));
  const hasPhoto = images.length > 0;

  const go = (n) => setIndex(Math.min(Math.max(n, 0), images.length - 1));

  const onMove = (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--zx', `${((e.clientX - r.left) / r.width) * 100}%`);
    e.currentTarget.style.setProperty('--zy', `${((e.clientY - r.top) / r.height) * 100}%`);
    setZoom(true);
  };

  const onDown = (e) => {
    if (e.pointerType === 'mouse') return;
    touchStart.current = { x: e.clientX, y: e.clientY };
  };

  const onUp = (e) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || images.length < 2) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > Math.abs(dy)) go(current + (dx < 0 ? 1 : -1));
  };

  return (
    <div className="gallery">
      <div className="detail-media">
        <div
          className={`zoom-frame ${hasPhoto ? 'has-photo' : ''} ${zoom ? 'zoomed' : ''}`}
          onPointerMove={hasPhoto ? onMove : undefined}
          onPointerLeave={hasPhoto ? () => setZoom(false) : undefined}
          onPointerDown={hasPhoto ? onDown : undefined}
          onPointerUp={hasPhoto ? onUp : undefined}
          onPointerCancel={() => (touchStart.current = null)}
        >
          <div key={current} className="zoom-slide">
            <ProductImage product={product} index={current} />
          </div>
        </div>
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
