import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductImage, { getImages } from '../components/ProductImage';
import { categories, categoriesOf } from '../data/products';
import { useProducts } from '../context/ProductsContext';
import { formatINR } from '../utils/pricing';
import { supabase, supabaseEnabled } from '../lib/supabase';

const CATEGORY_OPTIONS = categories.filter((c) => c !== 'All');
const MAX_IMAGE_SIDE = 900;
const EMPTY = { name: '', categories: [CATEGORY_OPTIONS[0]], price: '', old: '', color: '#c9a95c', desc: '', images: [] };

/** Downscale an image to a JPEG, upload it to Supabase Storage and return its public URL. */
async function uploadImage(file) {
  const blob = await new Promise((resolve, reject) => {
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
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not process the image.'))), 'image/jpeg', 0.85);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That file could not be read as an image.'));
    };
    img.src = url;
  });
  const path = `${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from('product-images').upload(path, blob, {
    contentType: 'image/jpeg',
    cacheControl: '31536000',
  });
  if (error) throw error;
  return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (err) setError('Incorrect email or password.');
    setBusy(false);
  };

  return (
    <div className="container page narrow">
      <p className="eyebrow">Admin</p>
      <h1>Sign in</h1>
      <form className="form narrow-form" onSubmit={submit}>
        <label className="field">
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" autoFocus />
        </label>
        <label className="field">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            aria-invalid={!!error}
          />
        </label>
        {error && <span className="error" role="alert">{error}</span>}
        <button className="btn" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
}

export default function Admin() {
  const {
    allProducts: products, loadError, addProduct, updateProduct, setProductEnabled, deleteProduct, importDefaults,
  } = useProducts();
  const [session, setSession] = useState(undefined); // undefined = still checking
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = adding a new product
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!supabaseEnabled) return undefined;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!supabaseEnabled) {
    return (
      <div className="container page narrow">
        <p className="eyebrow">Admin</p>
        <h1>Backend not connected</h1>
        <p className="muted">
          Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see .env.example) and rebuild to manage products.
        </p>
      </div>
    );
  }
  if (session === undefined) return <div className="container page"><p className="muted">Loading…</p></div>;
  if (!session) return <Login />;

  // Run a database action and show a message on failure instead of failing silently.
  const run = async (action, okMessage) => {
    setBusy(true);
    try {
      await action();
      setErrors((x) => ({ ...x, save: undefined }));
      setNotice(okMessage);
      return true;
    } catch (err) {
      setNotice('');
      setErrors((x) => ({ ...x, save: err.message }));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const toggleCategory = (c) =>
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(c) ? f.categories.filter((x) => x !== c) : [...f.categories, c],
    }));

  const startEdit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name, categories: categoriesOf(p), price: String(p.price), old: p.old ? String(p.old) : '',
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
    let lastError = '';
    setBusy(true);
    for (const file of good) {
      try {
        added.push(await uploadImage(file));
      } catch (err) {
        failed += 1;
        lastError = err.message || '';
      }
    }
    setBusy(false);
    if (added.length) setForm((f) => ({ ...f, images: [...f.images, ...added] }));
    setErrors((x) => ({
      ...x,
      image: failed
        ? `${failed} file${failed === 1 ? ' was' : 's were'} skipped${lastError ? `: ${lastError}` : ': not a readable image.'}`
        : undefined,
    }));
  };

  const removeImage = (i) =>
    setForm((f) => ({ ...f, images: f.images.filter((_, n) => n !== i) }));

  const makeMain = (i) =>
    setForm((f) => ({ ...f, images: [f.images[i], ...f.images.filter((_, n) => n !== i)] }));

  const submit = async (e) => {
    e.preventDefault();
    const price = Number(form.price);
    const old = form.old === '' ? 0 : Number(form.old);
    const next = {};
    if (!form.name.trim()) next.name = 'Enter a name.';
    if (form.categories.length === 0) next.categories = 'Pick at least one collection.';
    if (!form.price || !(price > 0)) next.price = 'Enter a price above 0.';
    if (form.old !== '' && !(old >= 0)) next.old = 'Enter a valid original price.';
    if (!form.desc.trim()) next.desc = 'Enter a short description.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const data = {
      name: form.name.trim(),
      category: form.categories[0],
      categories: form.categories,
      price,
      old: old > price ? old : price,
      color: form.color,
      desc: form.desc.trim(),
      images: form.images,
    };
    const ok = editingId == null
      ? await run(() => addProduct(data), `Added "${data.name}".`)
      : await run(() => updateProduct(editingId, data), `Saved "${data.name}".`);
    if (ok) reset();
  };

  const toggleEnabled = (p) =>
    run(
      () => setProductEnabled(p.id, !!p.disabled),
      p.disabled ? `"${p.name}" is now visible in the shop.` : `"${p.name}" is hidden from the shop.`
    );

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    const ok = await run(() => deleteProduct(p.id), `Deleted "${p.name}".`);
    if (ok && editingId === p.id) reset();
  };

  const importOriginal = () => {
    if (!window.confirm('Copy the original catalogue into the database?')) return;
    return run(importDefaults, 'Imported the original catalogue.');
  };

  const signOut = () => supabase.auth.signOut();

  return (
    <div className="container page">
      <div className="section-head">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="h1-small">Manage products</h1>
        </div>
        <button className="btn btn-outline btn-small" onClick={signOut}>Sign out</button>
      </div>
      <p className="muted small">Changes are saved to the database and appear for all visitors straight away.</p>
      {notice && <p className="admin-notice" role="status">{notice}</p>}
      {(errors.save || loadError) && <p className="error" role="alert">{errors.save || loadError}</p>}

      <div className="admin-layout">
        <form className="panel panel-pad form admin-form" onSubmit={submit} noValidate>
          <h3 className="panel-title">{editingId == null ? 'Add a product' : 'Edit product'}</h3>

          <label className="field">
            Name
            <input value={form.name} onChange={set('name')} aria-invalid={!!errors.name} />
            {errors.name && <span className="error">{errors.name}</span>}
          </label>

          <fieldset className="field check-group">
            <legend>Collections (pick one or more)</legend>
            <div className="check-row">
              {CATEGORY_OPTIONS.map((c) => (
                <label key={c} className="check">
                  <input
                    type="checkbox"
                    checked={form.categories.includes(c)}
                    onChange={() => toggleCategory(c)}
                  />
                  {c}
                </label>
              ))}
            </div>
            {errors.categories && <span className="error">{errors.categories}</span>}
          </fieldset>

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
            <input type="file" accept="image/*" multiple onChange={onFiles} disabled={busy} />
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
            <button className="btn" type="submit" disabled={busy}>
              {busy ? 'Working…' : editingId == null ? 'Add product' : 'Save changes'}
            </button>
            {editingId != null && (
              <button className="btn btn-outline" type="button" onClick={reset}>Cancel</button>
            )}
          </div>
        </form>

        <div className="panel">
          <h3 className="panel-title">
            Products ({products.length})
            {products.some((p) => p.disabled) && (
              <span className="muted small"> · {products.filter((p) => p.disabled).length} hidden</span>
            )}
          </h3>
          {products.length === 0 && <p className="panel-pad muted">No products yet.</p>}
          <ul className="plain">
            {products.map((p) => (
              <li key={p.id} className={`admin-row ${p.disabled ? 'is-disabled' : ''}`}>
                {p.disabled ? (
                  <span className="cart-thumb"><ProductImage product={p} /></span>
                ) : (
                  <Link to={`/product/${p.id}`} className="cart-thumb" aria-label={`View ${p.name}`}>
                    <ProductImage product={p} />
                  </Link>
                )}
                <div className="cart-info">
                  {p.disabled ? (
                    <strong>{p.name}</strong>
                  ) : (
                    <Link to={`/product/${p.id}`}><strong>{p.name}</strong></Link>
                  )}
                  <span className="muted small">{categoriesOf(p).join(', ')} · {formatINR(p.price)}</span>
                  {p.disabled && <span className="admin-hidden">Hidden from shop</span>}
                </div>
                <div className="btn-row">
                  <button
                    className="btn btn-outline btn-small"
                    onClick={() => toggleEnabled(p)}
                    disabled={busy}
                    aria-label={`${p.disabled ? 'Enable' : 'Disable'} ${p.name}`}
                  >
                    {p.disabled ? 'Enable' : 'Disable'}
                  </button>
                  <button className="btn btn-outline btn-small" onClick={() => startEdit(p)}>Edit</button>
                  <button className="btn btn-outline btn-small" onClick={() => remove(p)} disabled={busy}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
          {products.length === 0 && (
            <div className="panel-pad">
              <button className="btn btn-outline btn-small" onClick={importOriginal} disabled={busy}>
                Import the original catalogue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
