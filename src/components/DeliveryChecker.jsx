import { useId } from 'react';
import { deliveryInfo, formatINR, isPin } from '../utils/pricing';

/** Pincode field with the delivery charge for that area. `subtotal` decides whether delivery is free. */
export default function DeliveryChecker({ pin, onChange, subtotal }) {
  const id = useId();
  const info = deliveryInfo(pin, subtotal);
  const invalid = pin.length === 6 && !isPin(pin);

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
        {invalid && <p className="small error">Please enter a valid 6-digit pincode.</p>}
        {info && (
          <div className="delivery-result">
            <span className="delivery-zone">Delivery to {pin}</span>
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
