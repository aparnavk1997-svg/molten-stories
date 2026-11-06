import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

function SignInForm() {
  const { signIn } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signIn(identifier, password);
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  return (
    <form className="form narrow-form" onSubmit={submit}>
      <label className="field">
        Email or username
        <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" autoFocus />
      </label>
      <label className="field">
        Password
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
      </label>
      {error && <span className="error" role="alert">{error}</span>}
      <button className="btn" type="submit" disabled={busy || !identifier || !password}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}

function SignUpForm() {
  const { signUp } = useAuth();
  const [f, setF] = useState({ fullName: '', username: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (f.password.length < 8) return setError('Password must be at least 8 characters.');
    if (f.phone && !/^\d{10}$/.test(f.phone.trim())) return setError('Enter a 10-digit phone number, or leave it blank.');
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

  return (
    <form className="form narrow-form" onSubmit={submit}>
      <label className="field">
        Full name
        <input value={f.fullName} onChange={set('fullName')} autoComplete="name" />
      </label>
      <label className="field">
        Username
        <input value={f.username} onChange={set('username')} autoComplete="username" placeholder="e.g. candle_lover" />
      </label>
      <label className="field">
        Email
        <input type="email" value={f.email} onChange={set('email')} autoComplete="email" />
      </label>
      <label className="field">
        Phone (optional, 10 digits)
        <input type="tel" inputMode="numeric" value={f.phone} onChange={set('phone')} autoComplete="tel-national" />
      </label>
      <label className="field">
        Password (at least 8 characters)
        <input type="password" value={f.password} onChange={set('password')} autoComplete="new-password" />
      </label>
      {error && <span className="error" role="alert">{error}</span>}
      <button className="btn" type="submit" disabled={busy || !f.username || !f.email || !f.password}>
        {busy ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  );
}

function ProfileForm() {
  const { user, profile, isAdmin, saveProfile, signOut } = useAuth();
  const { setAddress } = useCart();
  const [f, setF] = useState({
    username: '', fullName: '', phone: '', street: '', city: '', state: '', pin: '',
  });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  useEffect(() => {
    setF({
      username: profile?.username || user?.user_metadata?.username || '',
      fullName: profile?.fullName || '',
      phone: profile?.phone || '',
      street: profile?.street || '',
      city: profile?.city || '',
      state: profile?.state || '',
      pin: profile?.pin || '',
    });
  }, [profile, user]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (f.phone && !/^\d{10}$/.test(f.phone.trim())) return setError('Phone must be 10 digits.');
    if (f.pin && !/^\d{6}$/.test(f.pin.trim())) return setError('PIN code must be 6 digits.');
    setBusy(true);
    try {
      await saveProfile(f);
      // Keep the bag's delivery address in step with the saved one.
      setAddress({
        name: f.fullName.trim(), phone: f.phone.trim(), street: f.street.trim(),
        city: f.city.trim(), state: f.state.trim(), pin: f.pin.trim(),
      });
      setNotice('Profile saved.');
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  return (
    <>
      <div className="section-head">
        <div>
          <p className="eyebrow">My account</p>
          <h1 className="h1-small">Hello{profile?.fullName ? `, ${profile.fullName.split(' ')[0]}` : ''}</h1>
          <p className="muted small">{user?.email}</p>
        </div>
        <button className="btn btn-outline btn-small" onClick={signOut}>Sign out</button>
      </div>
      {isAdmin && <p><Link to="/admin">Go to admin →</Link></p>}

      <form className="panel panel-pad form" onSubmit={submit} noValidate>
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

        <h3 className="panel-title">Saved delivery address</h3>
        <p className="muted small">Fills in your bag automatically when you order.</p>
        <label className="field">
          Street address
          <input value={f.street} onChange={set('street')} autoComplete="street-address" />
        </label>
        <div className="two-col">
          <label className="field">
            City
            <input value={f.city} onChange={set('city')} autoComplete="address-level2" />
          </label>
          <label className="field">
            State
            <input value={f.state} onChange={set('state')} autoComplete="address-level1" />
          </label>
        </div>
        <label className="field">
          PIN code
          <input inputMode="numeric" maxLength={6} value={f.pin} onChange={set('pin')} autoComplete="postal-code" />
        </label>

        {error && <span className="error" role="alert">{error}</span>}
        {notice && <span className="admin-notice" role="status">{notice}</span>}
        <button className="btn" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
      </form>
    </>
  );
}

export default function Account() {
  const { enabled, loading, session } = useAuth();
  const [tab, setTab] = useState('signin');

  if (!enabled) {
    return (
      <div className="container page narrow">
        <h1>Accounts unavailable</h1>
        <p className="muted">The shop isn't connected to its backend, so accounts can't be used right now.</p>
      </div>
    );
  }
  if (loading) return <div className="container page"><p className="muted">Loading…</p></div>;

  if (session) {
    return <div className="container page narrow"><ProfileForm /></div>;
  }

  return (
    <div className="container page narrow">
      <p className="eyebrow">My account</p>
      <h1>{tab === 'signin' ? 'Sign in' : 'Create an account'}</h1>
      <div className="btn-row">
        <button className={`btn btn-small ${tab === 'signin' ? '' : 'btn-outline'}`} onClick={() => setTab('signin')}>
          Sign in
        </button>
        <button className={`btn btn-small ${tab === 'signup' ? '' : 'btn-outline'}`} onClick={() => setTab('signup')}>
          Create account
        </button>
      </div>
      {tab === 'signin' ? <SignInForm /> : <SignUpForm />}
      <p className="muted small">You don't need an account to order. It just saves your details for next time.</p>
    </div>
  );
}
