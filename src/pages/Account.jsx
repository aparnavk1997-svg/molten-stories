import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import { formatINR, isPin } from '../utils/pricing';
import { formatDate, statusLabel } from '../utils/orders';
import { OrderProgress } from './Track';

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Field({ id, label, required, error, children }) {
  return (
    <label className="field" htmlFor={id}>
      <span>
        {label}
        {required && <span className="req" aria-hidden="true"> *</span>}
      </span>
      {children}
      {error && <span className="error" id={`${id}-err`} role="alert">{error}</span>}
    </label>
  );
}

function PasswordField({ id, label, value, onChange, onBlur, autoComplete, error }) {
  const [show, setShow] = useState(false);
  return (
    <Field id={id} label={label} required error={error}>
      <span className="pw-wrap">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          autoComplete={autoComplete}
          aria-required="true"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
        />
        <button
          type="button"
          className="pw-toggle"
          onClick={() => setShow((s) => !s)}
          aria-pressed={show}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </span>
    </Field>
  );
}

/** Shared state for a form with per-field errors: shown after the field is left, or after a submit attempt. */
function useFieldErrors(values, validate) {
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const errors = validate(values);
  const shown = (k) => (submitted || touched[k] ? errors[k] : undefined);
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));
  return { errors, shown, blur, setSubmitted };
}

const focusField = (id) => document.getElementById(id)?.focus();

function SignInForm({ onForgot }) {
  const { signIn } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const { errors, shown, blur, setSubmitted } = useFieldErrors({ identifier, password }, (v) => {
    const e = {};
    if (!v.identifier.trim()) e.identifier = 'Enter your email or username.';
    if (!v.password) e.password = 'Enter your password.';
    return e;
  });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitted(true);
    if (errors.identifier) return focusField('si-identifier');
    if (errors.password) return focusField('si-password');
    setBusy(true);
    try {
      await signIn(identifier, password);
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  return (
    <form className="form" onSubmit={submit} noValidate>
      <Field id="si-identifier" label="Email or username" required error={shown('identifier')}>
        <input
          id="si-identifier"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          onBlur={blur('identifier')}
          autoComplete="username"
          autoFocus
          aria-required="true"
          aria-invalid={!!shown('identifier')}
          aria-describedby={shown('identifier') ? 'si-identifier-err' : undefined}
        />
      </Field>
      <PasswordField
        id="si-password"
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onBlur={blur('password')}
        autoComplete="current-password"
        error={shown('password')}
      />
      {/* Pressing these must not blur the autofocused field: its error message would appear, push the button
          down, and the click would miss it. */}
      <button type="button" className="link-btn" onMouseDown={(e) => e.preventDefault()} onClick={onForgot}>Forgot password?</button>
      {error && <span className="error" role="alert">{error}</span>}
      <button className="btn btn-block" type="submit" disabled={busy} onMouseDown={(e) => e.preventDefault()}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}

function ForgotPasswordForm({ onBack }) {
  const { requestPasswordReset, resetLinkFailed } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!EMAIL_RE.test(email.trim())) return setError('Enter the email address you signed up with.');
    setBusy(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  if (sent) {
    return (
      <div className="form">
        <p className="admin-notice" role="status">
          If there is an account for {email.trim()}, we have emailed a link to reset the password. It can take a minute, and it may land in spam.
        </p>
        <button type="button" className="link-btn" onClick={onBack}>Back to sign in</button>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      {resetLinkFailed && (
        <p className="error" role="alert">That reset link has expired or was already used. Enter your email to get a new one.</p>
      )}
      <p className="muted small">Enter your email and we will send you a link to choose a new password. Usernames cannot be used here.</p>
      <Field id="fp-email" label="Email" required>
        <input
          id="fp-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoFocus
          aria-required="true"
        />
      </Field>
      {error && <span className="error" role="alert">{error}</span>}
      <button className="btn btn-block" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
      <button type="button" className="link-btn" onClick={onBack}>Back to sign in</button>
    </form>
  );
}

function ResetPasswordForm() {
  const { updatePassword, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Use at least 8 characters.');
    if (password !== confirm) return setError('The two passwords do not match.');
    setBusy(true);
    try {
      await updatePassword(password);   // afterwards they are simply signed in
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  return (
    <div className="container page auth-page">
      <div className="auth-card">
        <div className="auth-main">
          <h1 className="auth-title">Choose a new password</h1>
          <form className="form" onSubmit={submit} noValidate>
            <PasswordField id="rp-password" label="New password (at least 8 characters)" value={password}
              onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            <PasswordField id="rp-confirm" label="Confirm new password" value={confirm}
              onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
            {error && <span className="error" role="alert">{error}</span>}
            <button className="btn btn-block" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save new password'}</button>
            <button type="button" className="link-btn" onClick={signOut}>Cancel</button>
          </form>
        </div>
      </div>
    </div>
  );
}

function SignUpForm() {
  const { signUp } = useAuth();
  const [f, setF] = useState({ fullName: '', username: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const { errors, shown, blur, setSubmitted } = useFieldErrors(f, (v) => {
    const e = {};
    if (!v.fullName.trim()) e.fullName = 'Enter your full name.';
    const uname = v.username.trim().toLowerCase();
    if (!uname) e.username = 'Choose a username.';
    else if (!USERNAME_RE.test(uname)) e.username = '3-20 characters: letters, numbers or underscore.';
    if (!v.email.trim()) e.email = 'Enter your email address.';
    else if (!EMAIL_RE.test(v.email.trim())) e.email = 'Enter a valid email address.';
    if (v.phone.trim() && !/^\d{10}$/.test(v.phone.trim())) e.phone = 'Enter 10 digits, or leave it blank.';
    if (!v.password) e.password = 'Create a password.';
    else if (v.password.length < 8) e.password = 'Use at least 8 characters.';
    return e;
  });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitted(true);
    const first = ['fullName', 'username', 'email', 'phone', 'password'].find((k) => errors[k]);
    if (first) return focusField(`su-${first}`);
    setBusy(true);
    try {
      const { needsConfirmation } = await signUp(f);
      if (needsConfirmation) setSent(true);
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  if (sent) {
    return (
      <p className="admin-notice" role="status">
        Almost there! We sent a confirmation link to {f.email}. Open it, then come back and sign in.
      </p>
    );
  }

  const props = (k) => ({
    id: `su-${k}`,
    value: f[k],
    onChange: set(k),
    onBlur: blur(k),
    'aria-invalid': !!shown(k),
    'aria-describedby': shown(k) ? `su-${k}-err` : undefined,
  });

  return (
    <form className="form" onSubmit={submit} noValidate>
      <div className="two-col">
        <Field id="su-fullName" label="Full name" required error={shown('fullName')}>
          <input {...props('fullName')} autoComplete="name" aria-required="true" />
        </Field>
        <Field id="su-username" label="Username" required error={shown('username')}>
          <input {...props('username')} autoComplete="username" placeholder="3-20 letters, numbers or _" aria-required="true" />
        </Field>
      </div>
      <div className="two-col">
        <Field id="su-email" label="Email" required error={shown('email')}>
          <input {...props('email')} type="email" autoComplete="email" aria-required="true" />
        </Field>
        <Field id="su-phone" label="Phone (optional)" error={shown('phone')}>
          <input {...props('phone')} type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="10 digits" />
        </Field>
      </div>
      <PasswordField
        id="su-password"
        label="Password (at least 8 characters)"
        value={f.password}
        onChange={set('password')}
        onBlur={blur('password')}
        autoComplete="new-password"
        error={shown('password')}
      />
      {error && <span className="error" role="alert">{error}</span>}
      <button className="btn btn-block" type="submit" disabled={busy}>
        {busy ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  );
}

function MyOrders({ userId }) {
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('orders')
      .select('id, code, status, total, created_at, items, status_log')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (!cancelled) setOrders(data || []); });
    return () => { cancelled = true; };
  }, [userId]);

  return (
    <div className="panel panel-pad">
      <h3 className="panel-title">My orders</h3>
      {orders === null && <p className="muted">Loading…</p>}
      {orders && orders.length === 0 && <p className="muted">No orders yet. Orders confirmed on WhatsApp will appear here.</p>}
      {orders && orders.length > 0 && (
        <ul className="plain">
          {orders.map((o) => (
            <li key={o.id} className="my-order">
              <div className="my-order-head">
                <Link to={`/track?code=${o.code}`}><strong>{o.code}</strong></Link>
                <span className="my-order-status">{statusLabel(o.status)}</span>
              </div>
              <OrderProgress order={o} />
              <p className="my-order-items">{o.items.map((i) => `${i.name} ×${i.qty}`).join(', ')}</p>
              <div className="my-order-foot muted small">
                <span>{formatDate(o.created_at)}</span>
                <strong>{formatINR(o.total)}</strong>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const EMPTY_ADDRESS = { label: '', name: '', phone: '', street: '', city: '', state: '', pin: '' };

function validateAddress(v) {
  const e = {};
  if (v.name.trim().length < 2) e.name = 'Enter the recipient\'s full name.';
  if (!/^\d{10}$/.test(v.phone.trim())) e.phone = 'Enter a 10-digit mobile number.';
  if (v.street.trim().length < 3) e.street = 'Enter the street address.';
  if (v.city.trim().length < 2) e.city = 'Enter the city.';
  if (v.state.trim().length < 2) e.state = 'Enter the state.';
  if (!isPin(v.pin)) e.pin = 'Enter a valid 6-digit PIN code.';
  return e;
}

function AddressForm({ initial, onSave, onCancel }) {
  const [f, setF] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { errors, shown, blur, setSubmitted } = useFieldErrors(f, validateAddress);
  const set = (k) => (e) => {
    let val = e.target.value;
    if (k === 'phone') val = val.replace(/\D/g, '').slice(0, 10);
    if (k === 'pin') val = val.replace(/\D/g, '').slice(0, 6);
    setF((x) => ({ ...x, [k]: val }));
  };
  const props = (k, extra = {}) => ({
    id: `ad-${k}`,
    value: f[k],
    onChange: set(k),
    onBlur: blur(k),
    'aria-invalid': !!shown(k),
    'aria-describedby': shown(k) ? `ad-${k}-err` : undefined,
    ...extra,
  });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitted(true);
    const first = ['name', 'phone', 'street', 'city', 'state', 'pin'].find((k) => errors[k]);
    if (first) return focusField(`ad-${first}`);
    setBusy(true);
    try {
      await onSave(f);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form className="panel panel-pad form" onSubmit={submit} noValidate>
      <h3 className="panel-title">{initial.id ? 'Edit address' : 'New address'}</h3>
      <Field id="ad-label" label="Label (optional)">
        <input {...props('label')} maxLength={30} placeholder="e.g. Home, Office" />
      </Field>
      <div className="two-col">
        <Field id="ad-name" label="Full name" required error={shown('name')}>
          <input {...props('name')} maxLength={80} autoComplete="name" aria-required="true" />
        </Field>
        <Field id="ad-phone" label="Phone" required error={shown('phone')}>
          <input {...props('phone')} type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="10 digits" aria-required="true" />
        </Field>
      </div>
      <Field id="ad-street" label="Street address / House / Flat" required error={shown('street')}>
        <input {...props('street')} maxLength={150} autoComplete="street-address" aria-required="true" />
      </Field>
      <div className="three-col">
        <Field id="ad-city" label="City / Town" required error={shown('city')}>
          <input {...props('city')} maxLength={50} autoComplete="address-level2" aria-required="true" />
        </Field>
        <Field id="ad-state" label="State" required error={shown('state')}>
          <input {...props('state')} maxLength={50} autoComplete="address-level1" aria-required="true" />
        </Field>
        <Field id="ad-pin" label="PIN code" required error={shown('pin')}>
          <input {...props('pin')} inputMode="numeric" autoComplete="postal-code" aria-required="true" />
        </Field>
      </div>
      {error && <span className="error" role="alert">{error}</span>}
      <div className="btn-row">
        <button className="btn" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save address'}</button>
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={busy}>Cancel</button>
      </div>
    </form>
  );
}

/** Edits the primary shipping address stored on the profile (name and phone come from Details). */
function PrimaryAddressForm({ profile, onSave, onCancel }) {
  const [f, setF] = useState({ street: profile.street, city: profile.city, state: profile.state, pin: profile.pin });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { errors, shown, blur, setSubmitted } = useFieldErrors(f, (v) => {
    const e = {};
    if (v.street.trim().length < 3) e.street = 'Enter the street address.';
    if (v.city.trim().length < 2) e.city = 'Enter the city.';
    if (v.state.trim().length < 2) e.state = 'Enter the state.';
    if (!isPin(v.pin)) e.pin = 'Enter a valid 6-digit PIN code.';
    return e;
  });
  const set = (k) => (e) => {
    const val = k === 'pin' ? e.target.value.replace(/\D/g, '').slice(0, 6) : e.target.value;
    setF((x) => ({ ...x, [k]: val }));
  };
  const props = (k) => ({
    id: `pa-${k}`,
    value: f[k],
    onChange: set(k),
    onBlur: blur(k),
    'aria-invalid': !!shown(k),
    'aria-describedby': shown(k) ? `pa-${k}-err` : undefined,
    'aria-required': 'true',
  });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitted(true);
    const first = ['street', 'city', 'state', 'pin'].find((k) => errors[k]);
    if (first) return focusField(`pa-${first}`);
    setBusy(true);
    try {
      await onSave(f);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form className="panel panel-pad form" onSubmit={submit} noValidate>
      <h3 className="panel-title">Edit primary address</h3>
      <p className="muted small">The name and phone number on this address come from your Details tab.</p>
      <Field id="pa-street" label="Street address / House / Flat" required error={shown('street')}>
        <input {...props('street')} maxLength={150} autoComplete="street-address" />
      </Field>
      <div className="three-col">
        <Field id="pa-city" label="City / Town" required error={shown('city')}>
          <input {...props('city')} maxLength={50} autoComplete="address-level2" />
        </Field>
        <Field id="pa-state" label="State" required error={shown('state')}>
          <input {...props('state')} maxLength={50} autoComplete="address-level1" />
        </Field>
        <Field id="pa-pin" label="PIN code" required error={shown('pin')}>
          <input {...props('pin')} inputMode="numeric" autoComplete="postal-code" />
        </Field>
      </div>
      {error && <span className="error" role="alert">{error}</span>}
      <div className="btn-row">
        <button className="btn" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save address'}</button>
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={busy}>Cancel</button>
      </div>
    </form>
  );
}

function AddressEmpty({ icon, title, text, action, onAction }) {
  return (
    <div className="panel panel-pad addr-empty">
      <span className="addr-empty-icon" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
      </span>
      <h3>{title}</h3>
      <p className="muted">{text}</p>
      <button type="button" className="btn btn-small" onClick={onAction}>{action}</button>
    </div>
  );
}

const PIN_ICON = (
  <>
    <path d="M12 21s-7-6.2-7-11.2A7 7 0 0 1 19 9.8C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.8" r="2.4" />
  </>
);
const HOUSE_ICON = (
  <>
    <path d="M4 11l8-6.5L20 11" />
    <path d="M6 9.5V20h12V9.5" />
    <path d="M10 20v-5h4v5" />
  </>
);

function AddressesTab({ goToDetails }) {
  const { profile, primaryAddress, addresses, saveProfile, saveAddress, deleteAddress } = useAuth();
  const { setAddress } = useCart();
  const [editing, setEditing] = useState(null); // null | 'primary' | 'new' | address id
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState(null);

  const run = async (fn) => {
    setError('');
    try {
      await fn();
    } catch (err) {
      setError(err.message);
    }
  };

  const save = async (fields) => {
    await saveAddress(fields, editing === 'new' ? undefined : editing);
    setEditing(null);
  };

  const savePrimary = async (fields) => {
    await saveProfile({ ...profile, ...fields });
    setEditing(null);
  };

  const useInBag = (a) =>
    setAddress({ name: a.name, phone: a.phone, street: a.street, city: a.city, state: a.state, pin: a.pin });

  if (editing === 'primary') {
    return <PrimaryAddressForm profile={profile} onSave={savePrimary} onCancel={() => setEditing(null)} />;
  }

  if (editing) {
    const current = editing === 'new' ? null : addresses.find((a) => a.id === editing);
    return (
      <AddressForm
        initial={current ? { ...current } : EMPTY_ADDRESS}
        onSave={save}
        onCancel={() => setEditing(null)}
      />
    );
  }

  const hasPrimaryParts = profile && (profile.street || profile.city || profile.state || profile.pin);
  const primaryMissingContact = hasPrimaryParts && !primaryAddress;
  // The "Other addresses" section only appears once the primary address itself is saved (street, city, state, PIN),
  // or when extra addresses already exist, so they never get hidden. Name and phone are not needed for this:
  // each extra address carries its own.
  const canAddOther = Boolean(
    profile && profile.street?.trim() && profile.city?.trim() && profile.state?.trim() && isPin(profile.pin)
  );
  const showOther = canAddOther || addresses.length > 0;

  return (
    <div>
      {error && <p className="error" role="alert">{error}</p>}

      {hasPrimaryParts ? (
        <ul className="plain addr-grid">
          <li className="panel panel-pad addr-card is-default">
            <div className="addr-top">
              <strong>Primary shipping address</strong>
              <span className="my-order-status">Primary</span>
            </div>
            <address className="detail-address">
              <span>{profile.fullName || '—'}</span>
              <span>{profile.street}</span>
              <span>{[profile.city, profile.state].filter(Boolean).join(', ')}{profile.pin ? ` - ${profile.pin}` : ''}</span>
              <span className="muted small">{profile.phone || '—'}</span>
            </address>
            {primaryMissingContact && (
              <p className="muted small">
                Add your full name and a 10-digit phone in{' '}
                <button type="button" className="link-btn" onClick={goToDetails}>Details</button>{' '}
                so this can be used at checkout.
              </p>
            )}
            <div className="addr-actions">
              <button type="button" className="link-btn" onClick={() => setEditing('primary')}>Edit</button>
              {primaryAddress && (
                <button type="button" className="link-btn" onClick={() => useInBag(primaryAddress)}>Use in my bag</button>
              )}
            </div>
          </li>
        </ul>
      ) : (
        <AddressEmpty
          icon={PIN_ICON}
          title="Add your primary address"
          text="Save it once and we'll fill it into your bag every time you order."
          action="Add address"
          onAction={() => setEditing('primary')}
        />
      )}

      {showOther && <h3 className="addr-heading">Other addresses</h3>}
      {showOther && (addresses.length === 0 ? (
        <AddressEmpty
          icon={HOUSE_ICON}
          title="No other addresses yet"
          text="Add one for gifts or work, and pick it at checkout."
          action="Add another address"
          onAction={() => setEditing('new')}
        />
      ) : (
        <ul className="plain addr-grid">
          {addresses.map((a) => (
            <li key={a.id} className="panel panel-pad addr-card">
              <div className="addr-top">
                <strong>{a.label || 'Address'}</strong>
              </div>
              <address className="detail-address">
                <span>{a.name}</span>
                <span>{a.street}</span>
                <span>{a.city}, {a.state} - {a.pin}</span>
                <span className="muted small">{a.phone}</span>
              </address>
              <div className="addr-actions">
                <button type="button" className="link-btn" onClick={() => setEditing(a.id)}>Edit</button>
                {confirmId === a.id ? (
                  <>
                    <button type="button" className="link-btn addr-danger" onClick={() => run(async () => { await deleteAddress(a.id); setConfirmId(null); })}>
                      Confirm delete
                    </button>
                    <button type="button" className="link-btn" onClick={() => setConfirmId(null)}>Keep</button>
                  </>
                ) : (
                  <button type="button" className="link-btn addr-danger" onClick={() => setConfirmId(a.id)}>Delete</button>
                )}
                <button type="button" className="link-btn" onClick={() => useInBag(a)}>Use in my bag</button>
              </div>
            </li>
          ))}
        </ul>
      ))}
      {addresses.length > 0 && canAddOther && (
        <div className="btn-row">
          <button type="button" className="btn btn-outline btn-small" onClick={() => setEditing('new')}>+ Add another address</button>
        </div>
      )}
    </div>
  );
}

function ProfileForm() {
  const { user, profile, isAdmin, saveProfile, signOut } = useAuth();
  const [f, setF] = useState({ username: '', fullName: '', phone: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState('orders');
  const [editing, setEditing] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const fromProfile = () => ({
    username: profile?.username || user?.user_metadata?.username || '',
    fullName: profile?.fullName || '',
    phone: profile?.phone || '',
    street: profile?.street || '',
    city: profile?.city || '',
    state: profile?.state || '',
    pin: profile?.pin || '',
  });

  useEffect(() => {
    setF(fromProfile());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, user]);

  const cancelEdit = () => {
    setF(fromProfile());
    setError('');
    setEditing(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (f.phone && !/^\d{10}$/.test(f.phone.trim())) return setError('Phone must be 10 digits.');
    setBusy(true);
    try {
      await saveProfile(f);
      setNotice('Details saved.');
      setEditing(false);
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  const displayName = profile?.fullName || profile?.username || user?.email || '';
  const initial = displayName.trim().charAt(0).toUpperCase() || '?';
  const tabs = [['orders', 'Orders'], ['addresses', 'Addresses'], ['details', 'Details']];

  return (
    <>
      <div className="acct-head">
        <span className="acct-avatar" aria-hidden="true">{initial}</span>
        <div className="acct-who">
          <p className="eyebrow">My account</p>
          <h1 className="h1-small">Hello{profile?.fullName ? `, ${profile.fullName.split(' ')[0]}` : ''}</h1>
          <p className="muted small">
            {profile?.username && <>@{profile.username} · </>}{user?.email}
          </p>
        </div>
        <div className="acct-actions">
          {isAdmin && <Link className="btn btn-outline btn-small" to="/admin">Admin</Link>}
          <button className="btn btn-outline btn-small" onClick={signOut}>Sign out</button>
        </div>
      </div>

      <div className="auth-tabs" role="tablist" aria-label="Account sections">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={view === key}
            className={view === key ? 'active' : ''}
            onClick={() => setView(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'orders' && user && <MyOrders userId={user.id} />}

      {view === 'addresses' && <AddressesTab goToDetails={() => setView('details')} />}

      {view === 'details' && !editing && (
        <div className="acct-form">
          {notice && <p className="admin-notice" role="status">{notice}</p>}
          <section className="panel panel-pad">
            <h3 className="panel-title">Profile</h3>
            <dl className="detail-list">
              <div><dt>Username</dt><dd>{f.username ? `@${f.username}` : '—'}</dd></div>
              <div><dt>Full name</dt><dd>{f.fullName || '—'}</dd></div>
              <div><dt>Email</dt><dd>{user?.email || '—'}</dd></div>
              <div><dt>Phone</dt><dd>{f.phone || '—'}</dd></div>
            </dl>
          </section>
          <div className="btn-row">
            <button type="button" className="btn btn-outline btn-small" onClick={() => { setNotice(''); setEditing(true); }}>
              Edit details
            </button>
          </div>
        </div>
      )}

      {view === 'details' && editing && (
        <form className="form acct-form" onSubmit={submit} noValidate>
          <section className="panel panel-pad form">
            <h3 className="panel-title">Profile</h3>
            <label className="field">
              Username
              <input value={f.username} onChange={set('username')} />
            </label>
            <label className="field">
              Full name
              <input value={f.fullName} onChange={set('fullName')} autoComplete="name" />
            </label>
            <label className="field">
              Phone (10 digits)
              <input type="tel" inputMode="numeric" value={f.phone} onChange={set('phone')} autoComplete="tel-national" />
            </label>
          </section>

          {error && <span className="error" role="alert">{error}</span>}
          <div className="btn-row">
            <button className="btn" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
            <button type="button" className="btn btn-outline" onClick={cancelEdit} disabled={busy}>Cancel</button>
          </div>
        </form>
      )}
    </>
  );
}

export default function Account() {
  const { enabled, loading, session, recovering, resetLinkFailed } = useAuth();
  const [tab, setTab] = useState(resetLinkFailed ? 'forgot' : 'signin');

  if (!enabled) {
    return (
      <div className="container page narrow">
        <h1>Accounts unavailable</h1>
        <p className="muted">The shop isn't connected to its backend, so accounts can't be used right now.</p>
      </div>
    );
  }
  if (loading) return <div className="container page"><p className="muted">Loading…</p></div>;

  if (session && recovering) return <ResetPasswordForm />;

  if (session) {
    return <div className="container page acct-page"><ProfileForm /></div>;
  }

  return (
    <div className="container page auth-page">
      <div className="auth-card">
        <aside className="auth-aside">
          <p className="eyebrow">My account</p>
          <h2>{tab === 'signup' ? 'Join Molten Stories' : tab === 'forgot' ? 'Locked out?' : 'Welcome back'}</h2>
          <ul className="plain auth-perks">
            <li>Save your delivery details for faster checkout</li>
            <li>See all your orders and their progress in one place</li>
          </ul>
        </aside>
        <div className="auth-main">
          <div className="auth-tabs" role="tablist" aria-label="Account">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'signin'}
              className={tab === 'signin' ? 'active' : ''}
              onClick={() => setTab('signin')}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'signup'}
              className={tab === 'signup' ? 'active' : ''}
              onClick={() => setTab('signup')}
            >
              Create account
            </button>
          </div>
          <h1 className="auth-title">{tab === 'signup' ? 'Create an account' : tab === 'forgot' ? 'Reset your password' : 'Sign in'}</h1>
          {tab === 'signin' && <SignInForm onForgot={() => setTab('forgot')} />}
          {tab === 'forgot' && <ForgotPasswordForm onBack={() => setTab('signin')} />}
          {tab === 'signup' && <SignUpForm />}
          <p className="muted small auth-note">You don't need an account to order. It just saves your details for next time.</p>
        </div>
      </div>
    </div>
  );
}
