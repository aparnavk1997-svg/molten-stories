import { formatINR } from '../utils/pricing';

export function PriceTag({ product, large = false }) {
  return (
    <span className={`price-tag ${large ? 'large' : ''}`}>
      <strong>{formatINR(product.price)}</strong>
      {product.old > product.price && <s className="muted">{formatINR(product.old)}</s>}
    </span>
  );
}
