import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../context/ProductsContext';
import { useAuth } from '../context/AuthContext';
import { supabase, supabaseEnabled } from '../lib/supabase';
import { reviewMessage, whatsappUrl } from '../utils/whatsapp';
import { MAX_REVIEW_PHOTOS, uploadReviewPhoto } from '../utils/reviewImages';

const TEXT_MAX = 400;

export default function Review() {
  const { products } = useProducts();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ name: '', city: '', product: '', rating: 0, text: '' });
  const [errors, setErrors] = useState({});
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onPhotos = async (e) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    e.target.value = '';
    if (!files.length) return;
    const room = MAX_REVIEW_PHOTOS - photos.length;
    setErrors((x) => ({ ...x, photos: files.length > room ? `You can add up to ${MAX_REVIEW_PHOTOS} photos.` : undefined }));
    setUploading(true);
    const added = [];
    for (const file of files.slice(0, Math.max(room, 0))) {
      try {
        added.push(await uploadReviewPhoto(file));
      } catch (err) {
        setErrors((x) => ({ ...x, photos: err.message }));
      }
    }
    setUploading(false);
    if (added.length) setPhotos((list) => [...list, ...added]);
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = 'Please enter your name.';
    if (!form.rating) next.rating = 'Please choose a rating.';
    if (form.text.trim().length < 10) next.text = 'Please write a few words about your experience.';
    setErrors(next);
    if (Object.keys(next).length) return;
    const review = {
      name: form.name.trim(),
      city: form.city.trim(),
      product: form.product,
      rating: form.rating,
      text: form.text.trim(),
    };

    // Save it for the admin to approve. If that isn't possible, fall back to sending it on WhatsApp.
    if (supabaseEnabled) {
      setBusy(true);
      const picked = products.find((p) => p.name === review.product);
      const { error } = await supabase.from('reviews').insert({
        user_id: user?.id ?? null,
        name: review.name,
        city: review.city,
        product_id: picked?.id ?? null,
        product_name: review.product,
        rating: review.rating,
        body: review.text,
        images: photos,
      });
      setBusy(false);
      if (!error) {
        setSent(true);
        return;
      }
    }
    window.open(whatsappUrl(reviewMessage(review)), '_blank', 'noopener,noreferrer');
  };

  if (sent) {
    return (
      <div className="container page narrow">
        <p className="eyebrow">Thank you</p>
        <h1>Your review is in</h1>
        <p className="lead">
          Thank you for sharing your story. Your review will appear on our website.
        </p>
        <div className="btn-row">
          <Link to="/shop" className="btn">Back to the shop</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page narrow">
      <p className="eyebrow">Share your story</p>
      <h1>Write a review</h1>
      <p className="lead">
        Tell us how your candle made your moment. We read every review, and with your
        permission may feature it on our website.
      </p>

      <form className="form review-form" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="rv-name">Your name</label>
          <input id="rv-name" value={form.name} onChange={set('name')} maxLength={60} aria-invalid={!!errors.name} autoComplete="given-name" />
          {errors.name && <span className="error" role="alert">{errors.name}</span>}
        </div>
        <div className="field">
          <label htmlFor="rv-city">City (optional)</label>
          <input id="rv-city" value={form.city} onChange={set('city')} maxLength={60} autoComplete="address-level2" />
        </div>
        <div className="field">
          <label htmlFor="rv-product">Which candle? (optional)</label>
          <select id="rv-product" value={form.product} onChange={set('product')}>
            <option value="">Select a candle</option>
            {products.map((p) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <span id="rv-rating-label">Rating</span>
          <div className="stars" role="radiogroup" aria-labelledby="rv-rating-label">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={form.rating === n}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
                className={n <= form.rating ? 'on' : ''}
                onClick={() => setForm((f) => ({ ...f, rating: n }))}
              >
                ★
              </button>
            ))}
          </div>
          {errors.rating && <span className="error" role="alert">{errors.rating}</span>}
        </div>
        <div className="field">
          <label htmlFor="rv-text">Your review</label>
          <textarea id="rv-text" rows={5} maxLength={TEXT_MAX} value={form.text} onChange={set('text')} aria-invalid={!!errors.text} />
          <span className="muted small">{form.text.length}/{TEXT_MAX}</span>
          {errors.text && <span className="error" role="alert">{errors.text}</span>}
        </div>
        {supabaseEnabled && (
          <div className="field">
            <label htmlFor="rv-photos">Add photos (optional, up to {MAX_REVIEW_PHOTOS})</label>
            <input
              id="rv-photos" type="file" accept="image/*" multiple onChange={onPhotos}
              disabled={uploading || photos.length >= MAX_REVIEW_PHOTOS}
            />
            {uploading && <span className="muted small">Uploading…</span>}
            {errors.photos && <span className="error" role="alert">{errors.photos}</span>}
            {photos.length > 0 && (
              <ul className="admin-photos" aria-label="Your photos">
                {photos.map((src, i) => (
                  <li key={src} className="admin-photo">
                    <img src={src} alt={`Your photo ${i + 1}`} />
                    <button type="button" onClick={() => setPhotos((l) => l.filter((x) => x !== src))}>Remove</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="btn-row">
          <button type="submit" className="btn" disabled={busy || uploading}>{busy ? 'Sending…' : 'Submit review'}</button>
        </div>
      </form>
    </div>
  );
}
