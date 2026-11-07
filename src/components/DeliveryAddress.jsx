import { useState, useCallback } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { isAddressValid, isPin } from '../utils/pricing';
import { fetchAddressFromPincode } from '../utils/pincode';

/**
 * Full delivery address form rendered on the main /bag page.
 * Keeps name, phone, street, city, state, and pincode in sync with CartContext.
 */
export default function DeliveryAddress({ attempted = false }) {
  const { address, setAddress, pin } = useCart();
  const { profile, primaryAddress, addresses: extra } = useAuth();
  const [pinLookup, setPinLookup] = useState({ loading: false, error: null, location: null });

  // The primary address comes from the profile. List it even when name or phone is still missing,
  // so it is never silently hidden; the form below then flags whatever is left to fill in.
  const hasPrimaryParts = profile && (profile.street || profile.city || profile.state || profile.pin);
  const primary = primaryAddress || (hasPrimaryParts
    ? {
        id: 'primary', label: 'Primary', incomplete: true,
        name: profile.fullName, phone: profile.phone,
        street: profile.street, city: profile.city, state: profile.state, pin: profile.pin,
      }
    : null);
  const addresses = primary ? [primary, ...extra] : extra;
  const matching = addresses.find(
    (a) => a.name === address.name && a.phone === address.phone && a.street === address.street
      && a.city === address.city && a.state === address.state && a.pin === address.pin
  );
  const pickSaved = (e) => {
    const a = addresses.find((x) => x.id === e.target.value);
    if (!a) return;
    setPinLookup({ loading: false, error: null, location: null });
    setAddress({
      // Keep what is already typed for fields the saved address is missing.
      name: a.name || address.name || '',
      phone: a.phone || address.phone || '',
      street: a.street, city: a.city, state: a.state, pin: a.pin,
    });
  };
  const currentPin = address.pin || pin || '';
  const [editing, setEditing] = useState(false);
  const complete = isAddressValid({ ...address, pin: currentPin }) && !pinLookup.error;
  // Plain text when the address is complete; the form when it is being edited, is incomplete, or a checkout attempt failed.
  const showForm = editing || !complete;
  const invalidPin = (currentPin.length === 6 && (!isPin(currentPin) || Boolean(pinLookup.error))) || (attempted && (!isPin(currentPin) || Boolean(pinLookup.error)));

  const nameError = attempted && (!address.name || address.name.trim().length < 2);
  const phoneError = attempted && (!address.phone || !/^\d{10}$/.test(address.phone.trim()));
  const streetError = attempted && (!address.street || address.street.trim().length < 3);
  const cityError = attempted && (!address.city || address.city.trim().length < 2);
  const stateError = attempted && (!address.state || address.state.trim().length < 2);

  const lookupPin = useCallback(async (code) => {
    if (code.length !== 6) {
      setPinLookup({ loading: false, error: null, location: null });
      return;
    }
    if (!isPin(code)) {
      setPinLookup({ loading: false, error: 'Enter a valid 6-digit PIN code.', location: null });
      return;
    }
    setPinLookup({ loading: true, error: null, location: null });
    const res = await fetchAddressFromPincode(code);
    if (res.success) {
      setPinLookup({ loading: false, error: null, location: `${res.city}, ${res.state}` });
      setAddress((prev) => ({
        ...prev,
        pin: code,
        city: res.city || prev.city,
        state: res.state || prev.state,
      }));
    } else if (res.valid === false) {
      setPinLookup({ loading: false, error: res.error || 'Invalid PIN code. Location not found.', location: null });
    } else {
      setPinLookup({ loading: false, error: null, location: null });
    }
  }, [setAddress]);

  const handleChange = (field) => (e) => {
    const val = e.target.value;
    if (field === 'pin') {
      const cleanPin = val.replace(/\D/g, '').slice(0, 6);
      setAddress({ pin: cleanPin });
      if (cleanPin.length === 6) {
        lookupPin(cleanPin);
      } else {
        setPinLookup({ loading: false, error: null, location: null });
      }
    } else if (field === 'phone') {
      const cleanPhone = val.replace(/\D/g, '').slice(0, 10);
      setAddress({ phone: cleanPhone });
    } else {
      setAddress({ [field]: val });
    }
  };

  return (
    <div className="panel delivery-panel" style={{ marginTop: '1.2rem' }}>
      <h3 className="panel-title">Delivery Address</h3>
      <div className="panel-pad">
        {showForm && (
          <p className="muted small" style={{ margin: '0 0 1rem' }}>
            Please enter your delivery address to place your order.
          </p>
        )}

        {!showForm && (
          <div className="del-summary">
            <address className="detail-address">
              <strong>{address.name}</strong>
              <span>{address.street}</span>
              <span>{address.city}, {address.state} - {currentPin}</span>
              <span className="muted small">{address.phone}</span>
            </address>
            <button type="button" className="link-btn" onClick={() => setEditing(true)}>Edit</button>
          </div>
        )}

        {showForm && addresses.length > 0 && (
          <div className="field" style={{ marginBottom: '0.85rem' }}>
            <label htmlFor="del-saved">Deliver to a saved address</label>
            <select id="del-saved" value={matching?.id || ''} onChange={pickSaved}>
              <option value="" disabled>{matching ? '' : 'Choose a saved address…'}</option>
              {addresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id === 'primary' ? 'Primary' : a.label || 'Address'}
                  {a.incomplete ? ' (needs name/phone)' : ''} — {[a.name, a.city].filter(Boolean).join(', ')} {a.pin}
                </option>
              ))}
            </select>
          </div>
        )}

        {showForm && (
          <>
          <div className="two-col" style={{ marginBottom: '0.85rem' }}>
            <div className="field">
              <label htmlFor="del-name">
                Full name <span className="req" aria-hidden="true">*</span>
              </label>
              <input
                id="del-name"
                type="text"
                autoComplete="name"
                placeholder="First and last name"
                value={address.name || ''}
                onChange={handleChange('name')}
                maxLength={80}
                aria-invalid={nameError}
                required
              />
              {nameError && <span className="small error">Please enter full name</span>}
            </div>
            <div className="field">
              <label htmlFor="del-phone">
                Phone number <span className="req" aria-hidden="true">*</span>
              </label>
              <input
                id="del-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="10-digit mobile number"
                value={address.phone || ''}
                onChange={handleChange('phone')}
                maxLength={10}
                aria-invalid={phoneError}
                required
              />
              {phoneError && <span className="small error">Please enter 10-digit mobile number</span>}
            </div>
          </div>

          <div className="field" style={{ marginBottom: '0.85rem' }}>
            <label htmlFor="del-street">
              Street address / House / Flat <span className="req" aria-hidden="true">*</span>
            </label>
            <input
              id="del-street"
              type="text"
              autoComplete="street-address"
              placeholder="Flat / house no., building, street, landmark"
              value={address.street || ''}
              onChange={handleChange('street')}
              maxLength={150}
              aria-invalid={streetError}
              required
            />
            {streetError && <span className="small error">Please enter street address</span>}
          </div>

          <div className="three-col">
            <div className="field">
              <label htmlFor="del-city">
                City / Town <span className="req" aria-hidden="true">*</span>
              </label>
              <input
                id="del-city"
                type="text"
                autoComplete="address-level2"
                placeholder="City"
                value={address.city || ''}
                onChange={handleChange('city')}
                maxLength={50}
                aria-invalid={cityError}
                required
              />
              {cityError && <span className="small error">Please enter city</span>}
            </div>
            <div className="field">
              <label htmlFor="del-state">
                State <span className="req" aria-hidden="true">*</span>
              </label>
              <input
                id="del-state"
                type="text"
                autoComplete="address-level1"
                placeholder="State"
                value={address.state || ''}
                onChange={handleChange('state')}
                maxLength={50}
                aria-invalid={stateError}
                required
              />
              {stateError && <span className="small error">Please enter state</span>}
            </div>
            <div className="field">
              <label htmlFor="del-pin">
                Pincode <span className="req" aria-hidden="true">*</span>
              </label>
              <input
                id="del-pin"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="6-digit PIN"
                value={currentPin}
                onChange={handleChange('pin')}
                maxLength={6}
                aria-invalid={invalidPin}
                required
              />
              {pinLookup.loading && <span className="pin-status loading">Looking up pincode…</span>}
              {pinLookup.location && !invalidPin && <span className="pin-status success">✓ {pinLookup.location}</span>}
              {invalidPin && <span className="small error">{pinLookup.error || 'Enter a valid 6-digit PIN'}</span>}
            </div>
          </div>
          </>
        )}

        {showForm && complete && (
          <div className="btn-row" style={{ marginTop: '1rem' }}>
            <button type="button" className="btn btn-small" onClick={() => setEditing(false)}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
