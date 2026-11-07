import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ProductImage, { getImages } from '../components/ProductImage';
import ImageFitDialog from '../components/ImageFitDialog';
import { categories, categoriesOf } from '../data/products';
import { useProducts } from '../context/ProductsContext';
import { fileToSource } from '../utils/imageFit';
import { formatINR } from '../utils/pricing';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import AdminOrders from '../components/AdminOrders';
import AdminReviews from '../components/AdminReviews';

const CATEGORY_OPTIONS = categories.filter((c) => c !== 'All');
const EMPTY = { name: '', categories: [CATEGORY_OPTIONS[0]], price: '', old: '', color: '#c9a95c', desc: '', images: [] };

/** Upload a fitted photo (JPEG data URL) to Supabase Storage and return its public URL. */
async function uploadImage(dataUrl) {
  const blob = await (await fetch(dataUrl)).blob();
  const path = `${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from('product-images').upload(path, blob, {
    contentType: 'image/jpeg',
    cacheControl: '31536000',
  });
  if (error) throw error;
  return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
}

function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err.message);
    }
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
    allProducts: products, loading: productsLoading, loadError, addProduct, updateProduct, setProductEnabled, deleteProduct,
  } = useProducts();
  const { enabled: supabaseEnabled, loading: authLoading, session, isAdmin, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [editingId, setEditingId] = useState(null); // null = adding a new product
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  // Photos waiting to be fitted to the frame: { src, replaceIndex } (replaceIndex null = add as new).
  const [fitQueue, setFitQueue] = useState([]);
  const [tab, setTab] = useState(() => (['orders', 'reviews'].includes(searchParams.get('tab')) ? searchParams.get('tab') : 'products'));

  // Arriving from the header bell (/admin?tab=orders), including when already on this page.
  const tabParam = searchParams.get('tab');
  useEffect(() => {
    if (tabParam === 'orders' || tabParam === 'reviews') setTab(tabParam);
  }, [tabParam]);

  // Arriving from a product image's edit button (/admin?edit=ID): open that product in the form.
  const editParam = searchParams.get('edit');
  useEffect(() => {
    if (!isAdmin || !editParam) return;
    const target = products.find((p) => p.id === Number(editParam));
    if (target) {
      setTab('products');
      startEdit(target);
    }
    if (target || !productsLoading) setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, editParam, products, productsLoading]);

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
  if (authLoading) return <div className="container page"><p className="muted">Loading…</p></div>;
  if (!session) return <Login />;
  if (!isAdmin) {
    return (
      <div className="container page narrow">
        <p className="eyebrow">Admin</p>
        <h1>No admin access</h1>
        <p className="muted">This account isn't an admin. Sign out and use the admin login to manage products.</p>
        <div className="btn-row">
          <button className="btn" onClick={signOut}>Sign out</button>
          <Link className="btn btn-outline" to="/account">My account</Link>
        </div>
      </div>
    );
  }

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

  // A function declaration so the effect above can call it (it is hoisted).
  function startEdit(p) {
    setEditingId(p.id);
    setForm({
      name: p.name, categories: categoriesOf(p), price: String(p.price), old: p.old ? String(p.old) : '',
      color: p.color || '#c9a95c', desc: p.desc, images: getImages(p),
    });
    setErrors({});
    setNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

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
    const queued = [];
    let failed = bad.length;
    let lastError = '';
    setBusy(true);
    for (const file of good) {
      try {
        queued.push({ src: await fileToSource(file), replaceIndex: null });
      } catch (err) {
        failed += 1;
        lastError = err.message || '';
      }
    }
    setBusy(false);
    if (queued.length) setFitQueue((q) => [...q, ...queued]);
    setErrors((x) => ({
      ...x,
      image: failed
        ? `${failed} file${failed === 1 ? ' was' : 's were'} skipped${lastError ? `: ${lastError}` : ': not a readable image.'}`
        : undefined,
    }));
  };

  const applyFit = async (dataUrl) => {
    const { replaceIndex } = fitQueue[0];
    setBusy(true);
    try {
      const url = await uploadImage(dataUrl);
      setForm((f) => ({
        ...f,
        images:
          replaceIndex == null
            ? [...f.images, url]
            : f.images.map((img, n) => (n === replaceIndex ? url : img)),
      }));
      setErrors((x) => ({ ...x, image: undefined }));
    } catch (err) {
      setErrors((x) => ({ ...x, image: `Photo upload failed: ${err.message}` }));
    }
    setBusy(false);
    setFitQueue((q) => q.slice(1));
  };

  const adjustImage = (i) => setFitQueue((q) => [...q, { src: form.images[i], replaceIndex: i }]);

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

  return (
    <div className="container page">
      <div className="section-head">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="h1-small">{tab === 'orders' ? 'Orders' : tab === 'reviews' ? 'Reviews' : 'Manage products'}</h1>
        </div>
        <button className="btn btn-outline btn-small" onClick={signOut}>Sign out</button>
      </div>
      <div className="btn-row">
        <button className={`btn btn-small ${tab === 'products' ? '' : 'btn-outline'}`} onClick={() => setTab('products')}>Products</button>
        <button className={`btn btn-small ${tab === 'orders' ? '' : 'btn-outline'}`} onClick={() => setTab('orders')}>Orders</button>
        <button className={`btn btn-small ${tab === 'reviews' ? '' : 'btn-outline'}`} onClick={() => setTab('reviews')}>Reviews</button>
      </div>
      {tab === 'orders' ? (
        <AdminOrders />
      ) : tab === 'reviews' ? (
        <AdminReviews />
      ) : (
      <>
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
            <span className="muted small">
              Photos are shown at a 4:5 ratio everywhere. You can adjust how each one fits after choosing it.
            </span>
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
                  <button type="button" onClick={() => adjustImage(i)} aria-label={`Adjust photo ${i + 1}`}>Adjust</button>
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
        </div>
      </div>
      {fitQueue.length > 0 && (
        <ImageFitDialog
          key={fitQueue.length + fitQueue[0].src.slice(-30)}
          src={fitQueue[0].src}
          onApply={applyFit}
          onCancel={() => setFitQueue((q) => q.slice(1))}
        />
      )}
      </>
      )}
    </div>
  );
}
