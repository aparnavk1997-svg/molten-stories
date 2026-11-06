import { useState } from 'react';
import { useProducts } from '../context/ProductsContext';
import { reviewMessage, whatsappUrl } from '../utils/whatsapp';

const TEXT_MAX = 400;

export default function Review() {
  const { products } = useProducts();
  const [form, setForm] = useState({ name: '', city: '', product: '', rating: 0, text: '' });
  const [errors, setErrors] = useState({});
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = 'Please enter your name.';
    if (!form.rating) next.rating = 'Please choose a rating.';
    if (form.text.trim().length < 10) next.text = 'Please write a few words about your experience.';
    setErrors(next);
    if (Object.keys(next).length) return;
    const msg = reviewMessage({
      name: form.name.trim(),
      city: form.city.trim(),
      product: form.product,
      rating: form.rating,
      text: form.text.trim(),
    });
    window.open(whatsappUrl(msg), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="container page narrow">
      <p className="eyebrow">Share your story</p>
      <h1>Write a review</h1>
      <p className="lead">
        Tell us how your candle made your moment. We'll receive it on WhatsApp, and with your
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
        <div className="btn-row">
          <button type="submit" className="btn">Send on WhatsApp</button>
        </div>
      </form>
    </div>
  );
}
