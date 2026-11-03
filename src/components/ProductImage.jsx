import CandleImage from './CandleImage';

/** Photos for a product: `images` list, or the legacy single `image`. */
export const getImages = (product) =>
  product.images?.length ? product.images : product.image ? [product.image] : [];

/** First uploaded photo when the product has one, otherwise the illustrated candle. */
export default function ProductImage({ product, index = 0 }) {
  const src = getImages(product)[index];
  if (src) {
    return <img src={src} alt={product.name} className="candle-img product-photo" />;
  }
  return <CandleImage color={product.color} label={product.name} />;
}
