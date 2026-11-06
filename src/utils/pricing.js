export const MAX_QTY = 20;
export const GIFT_WRAP_PRICE = 30; // flat, per order
export const GIFT_BOX_PRICE = 100; // flat packaging charge for bespoke hampers
export const GIFT_NOTE_MAX = 200;
export const FREE_DELIVERY_MIN = 999; // items subtotal (excludes gift wrap)

// Delivery charge by pincode zone (we ship from Kochi, 682039)
export const DELIVERY_RATES = { Kochi: 40, Kerala: 70, India: 120 };

export const formatINR = (n) => '₹' + Math.round(n).toLocaleString('en-IN');

export const isPin = (s) => /^[1-9]\d{5}$/.test(String(s || '').trim());

/**
 * Checks if all required shipping fields are provided and valid.
 */
export function isAddressValid(address) {
  if (!address) return false;
  const nameOk = typeof address.name === 'string' && address.name.trim().length >= 2;
  const phoneOk = typeof address.phone === 'string' && /^\d{10}$/.test(address.phone.trim());
  const streetOk = typeof address.street === 'string' && address.street.trim().length >= 3;
  const cityOk = typeof address.city === 'string' && address.city.trim().length >= 2;
  const stateOk = typeof address.state === 'string' && address.state.trim().length >= 2;
  const pinOk = typeof address.pin === 'string' && isPin(address.pin.trim());
  return Boolean(nameOk && phoneOk && streetOk && cityOk && stateOk && pinOk);
}

/**
 * Delivery for a pincode: { zone, charge, fee, free }, or null if the pincode isn't a valid 6-digit PIN.
 * `charge` is the zone rate; `fee` is what the customer pays (0 once the subtotal reaches the free threshold).
 */
export function deliveryInfo(pin, subtotal) {
  if (!isPin(pin)) return null;
  const n = Number(pin);
  const prefix = Math.floor(n / 1000);
  let zone = 'India';
  const lakshadweep = n >= 682551 && n <= 682559; // a separate territory, not Kerala
  if (lakshadweep) zone = 'India';
  else if (prefix === 682) zone = 'Kochi';
  else if (prefix >= 670 && prefix <= 695) zone = 'Kerala';
  const charge = DELIVERY_RATES[zone];
  const free = subtotal >= FREE_DELIVERY_MIN;
  return { zone, charge, fee: free ? 0 : charge, free };
}
