import { useState } from 'react';
import { Link } from 'react-router-dom';
import ProductImage, { getImages } from '../components/ProductImage';
import { categories } from '../data/products';
import { useProducts } from '../context/ProductsContext';
import { formatINR } from '../utils/pricing';

// Client-side gate only: this keeps casual visitors out but is NOT real security.
// Override at build time with VITE_ADMIN_PASSCODE.
const PASSCODE = import.meta.env.VITE_ADMIN_PASSCODE || 'molten-admin';
const AUTH_KEY = 'molten-stories-admin';
const CATEGORY_OPTIONS = categories.filter((c) => c !== 'All');
const MAX_IMAGE_SIDE = 900;
const EMPTY = { name: '', category: CATEGORY_OPTIONS[0], price: '', old: '', color: '#c9a95c', desc: '', images: [] };

/** Downscale an uploaded image to a JPEG data URL so it fits in browser storage. */
function readImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That file could not be read as an image.'));
    };
    img.src = url;
  });
}

function Login({ onSuccess }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (code === PASSCODE) {
      sessionStorage.setItem(AUTH_KEY, '1');
      onSuccess();
    } else {
      setError('Incorrect passcode.');
    }
  };

  return (
    <div className="container page narrow">
      <p className="eyebrow">Admin</p>
      <h1>Sign in</h1>
      <form className="form narrow-form" onSubmit={submit}>
        <label className="field">
          Passcode
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-invalid={!!error}
            autoFocus
          />
        </label>
        {error && <span className="error" role="alert">{error}</span>}
        <button className="btn" type="submit">Sign in</button>
      </form>
    </div>
  );
}

export default function Admin() {
  const { products, saveError, addProduct, updateProduct, deleteProduct, resetProducts } = useProducts();
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === '1');
  const [editingId, setEditingId] = useState(null); // null = adding a new product
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');

  if (!authed) return <Login onSuccess={() => setAuthed(true)} />;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const startEdit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name, category: p.category, price: String(p.price), old: p.old ? String(p.old) : '',
      color: p.color || '#c9a95c', desc: p.desc, images: getImages(p),
    });
    setErrors({});
    setNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const reset = () => {
    setEditingId(null);
    setForm(EMPTY);
    setErrors({});
  };

  const onFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    const bad = files.filter((f) => !f.type.startsWith('image/'));
    const good = files.filter((f) => f.type.startsWith('image/'));
    const added = [];
    let failed = bad.length;
    for (const file of good) {
      try {
        added.push(await readImage(file));
      } catch {
        failed += 1;
      }
    }
    if (added.length) setForm((f) => ({ ...f, images: [...f.images, ...added] }));
    setErrors((x) => ({
      ...x,
      image: failed ? `${failed} file${failed === 1 ? ' was' : 's were'} skipped: not a readable image.` : undefined,
    }));
  };

  const removeImage = (i) =>
    setForm((f) => ({ ...f, images: f.images.filter((_, n) => n !== i) }));

  const makeMain = (i) =>
    setForm((f) => ({ ...f, images: [f.images[i], ...f.images.filter((_, n) => n !== i)] }));

  const submit = (e) => {
    e.preventDefault();
    const price = Number(form.price);
    const old = form.old === '' ? 0 : Number(form.old);
    const next = {};
    if (!form.name.trim()) next.name = 'Enter a name.';
    if (!form.price || !(price > 0)) next.price = 'Enter a price above 0.';
    if (form.old !== '' && !(old >= 0)) next.old = 'Enter a valid original price.';
    if (!form.desc.trim()) next.desc = 'Enter a short description.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const data = {
      name: form.name.trim(),
      category: form.category,
      price,
      old: old > price ? old : price,
      color: form.color,
      desc: form.desc.trim(),
      ...(form.images.length ? { images: form.images } : {}),
    };
    if (editingId == null) {
      addProduct(data);
      setNotice(`Added "${data.name}".`);
    } else {
      updateProduct(editingId, data);
      setNotice(`Saved "${data.name}".`);
    }
    reset();
  };

  const remove = (p) => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    deleteProduct(p.id);
    if (editingId === p.id) reset();
    setNotice(`Deleted "${p.name}".`);
  };

  const restoreDefaults = () => {
    if (!window.confirm('Replace all products with the original catalogue? Your changes will be lost.')) return;
    resetProducts();
    reset();
    setNotice('Restored the original catalogue.');
  };

  const signOut = () => {
    sessionStorage.removeItem(AUTH_KEY);
    setAuthed(false);
  };

  return (
    <div className="container page">
      <div className="section-head">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="h1-small">Manage products</h1>
        </div>
        <button className="btn btn-outline btn-small" onClick={signOut}>Sign out</button>
      </div>
      <p className="muted small">
        Changes are saved in this browser only, so they won't appear for other visitors or devices.
      </p>
      {notice && <p className="admin-notice" role="status">{notice}</p>}
      {saveError && <p className="error" role="alert">{saveError}</p>}

      <div className="admin-layout">
        <form className="panel panel-pad form admin-form" onSubmit={submit} noValidate>
          <h3 className="panel-title">{editingId == null ? 'Add a product' : 'Edit product'}</h3>

          <label className="field">
            Name
            <input value={form.name} onChange={set('name')} aria-invalid={!!errors.name} />
            {errors.name && <span className="error">{errors.name}</span>}
          </label>

          <label className="field">
            Collection
            <select value={form.category} onChange={set('category')}>
              {CATEGORY_OPTIONS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>

          <div className="two-col">
            <label className="field">
              Price (₹)
              <input type="number" min="0" step="1" value={form.price} onChange={set('price')} aria-invalid={!!errors.price} />
              {errors.price && <span className="error">{errors.price}</span>}
            </label>
            <label className="field">
              Original price (₹, optional)
              <input type="number" min="0" step="1" value={form.old} onChange={set('old')} aria-invalid={!!errors.old} />
              {errors.old && <span className="error">{errors.old}</span>}
            </label>
          </div>

          <label className="field">
            Description
            <textarea rows="3" value={form.desc} onChange={set('desc')} aria-invalid={!!errors.desc} />
            {errors.desc && <span className="error">{errors.desc}</span>}
          </label>

          <label className="field">
            Photos (you can pick several)
            <input type="file" accept="image/*" multiple onChange={onFiles} />
            {errors.image && <span className="error">{errors.image}</span>}
          </label>
          {form.images.length > 0 && (
            <ul className="admin-photos" aria-label="Product photos">
              {form.images.map((src, i) => (
                <li key={src.slice(-40) + i} className="admin-photo">
                  <img src={src} alt={`Photo ${i + 1}`} />
                  {i === 0 ? (
                    <span className="photo-tag">Main</span>
                  ) : (
                    <button type="button" onClick={() => makeMain(i)}>Make main</button>
                  )}
                  <button type="button" onClick={() => removeImage(i)} aria-label={`Remove photo ${i + 1}`}>Remove</button>
                </li>
              ))}
            </ul>
          )}

          <label className="field">
            Candle colour (used when there is no photo)
            <input type="color" value={form.color} onChange={set('color')} className="color-input" />
          </label>

          <div className="admin-preview" aria-label="Preview">
            <ProductImage product={{ ...form, name: form.name || 'Preview' }} />
          </div>
          <div className="btn-row">
            <button className="btn" type="submit">{editingId == null ? 'Add product' : 'Save changes'}</button>
            {editingId != null && (
              <button className="btn btn-outline" type="button" onClick={reset}>Cancel</button>
            )}
          </div>
        </form>

        <div className="panel">
          <h3 className="panel-title">Products ({products.length})</h3>
          {products.length === 0 && <p className="panel-pad muted">No products yet.</p>}
          <ul className="plain">
            {products.map((p) => (
              <li key={p.id} className="admin-row">
                <div className="cart-thumb"><ProductImage product={p} /></div>
                <div className="cart-info">
                  <Link to={`/product/${p.id}`}><strong>{p.name}</strong></Link>
                  <span className="muted small">{p.category} · {formatINR(p.price)}</span>
                </div>
                <div className="btn-row">
                  <button className="btn btn-outline btn-small" onClick={() => startEdit(p)}>Edit</button>
                  <button className="btn btn-outline btn-small" onClick={() => remove(p)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
          <div className="panel-pad">
            <button className="btn btn-outline btn-small" onClick={restoreDefaults}>Restore original catalogue</button>
          </div>
        </div>
      </div>
    </div>
  );
}
