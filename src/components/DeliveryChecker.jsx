import { useState, useEffect, useId } from 'react';
import { deliveryInfo, formatINR, isPin } from '../utils/pricing';
import { fetchAddressFromPincode } from '../utils/pincode';

/** Pincode field with the delivery charge for that area. `subtotal` decides whether delivery is free. */
export default function DeliveryChecker({ pin, onChange, subtotal }) {
  const id = useId();
  const [lookup, setLookup] = useState({ loading: false, location: '', error: null });
  const info = deliveryInfo(pin, subtotal);

  useEffect(() => {
    let active = true;
    if (pin && pin.length === 6) {
      if (!isPin(pin)) {
        setLookup({ loading: false, location: '', error: 'Please enter a valid 6-digit pincode.' });
        return;
      }
      setLookup({ loading: true, location: '', error: null });
      fetchAddressFromPincode(pin).then((res) => {
        if (!active) return;
        if (res.success) {
          setLookup({ loading: false, location: `${res.city}, ${res.state}`, error: null });
        } else if (res.valid === false) {
          setLookup({ loading: false, location: '', error: res.error || 'Invalid PIN code. Location not found.' });
        } else {
          setLookup({ loading: false, location: '', error: null });
        }
      });
    } else {
      setLookup({ loading: false, location: '', error: null });
    }
    return () => {
      active = false;
    };
  }, [pin]);

  const invalid = (pin.length === 6 && !isPin(pin)) || Boolean(lookup.error);

  return (
    <div className="delivery-check">
      <label htmlFor={id}>Delivery pincode</label>
      <input
        id={id}
        value={pin}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        inputMode="numeric"
        autoComplete="postal-code"
        placeholder="e.g. 682039"
        maxLength={6}
        aria-invalid={invalid}
        aria-describedby={`${id}-msg`}
      />
      <div id={`${id}-msg`} role="status">
        {lookup.loading && <p className="small muted">Checking pincode…</p>}
        {invalid && <p className="small error">{lookup.error || 'Please enter a valid 6-digit pincode.'}</p>}
        {!invalid && !lookup.loading && info && (
          <div className="delivery-result">
            <span className="delivery-zone">
              Delivery to {pin}{lookup.location ? ` (${lookup.location})` : ''}
            </span>
            {info.free ? (
              <span className="delivery-fee free">
                <s>{formatINR(info.charge)}</s> Free
              </span>
            ) : (
              <span className="delivery-fee">{formatINR(info.fee)}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
