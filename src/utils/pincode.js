import { isPin } from './pricing.js';

const pinCache = new Map();

/**
 * Normalizes city/district names returned by India Post API.
 */
function cleanLocationName(str) {
  if (!str) return '';
  return str.trim();
}

/**
 * Fetches address details (district/city, state, post offices) for a 6-digit Indian PIN code.
 * Uses the official India Post pincode API (api.postalpincode.in) with caching.
 *
 * @param {string|number} pin - 6-digit PIN code
 * @param {object} [options]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<{
 *   success: boolean,
 *   valid: boolean,
 *   city?: string,
 *   district?: string,
 *   state?: string,
 *   postOffices?: Array<{ name: string, district: string, state: string, branchType: string }>,
 *   error?: string,
 *   networkError?: boolean
 * }>}
 */
export async function fetchAddressFromPincode(pin, { signal } = {}) {
  const cleanPin = String(pin || '').trim();

  if (!isPin(cleanPin)) {
    return {
      success: false,
      valid: false,
      error: 'Enter a valid 6-digit PIN code.',
    };
  }

  if (pinCache.has(cleanPin)) {
    return pinCache.get(cleanPin);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);
    const combinedSignal = signal || controller.signal;

    const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
      signal: combinedSignal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }

    const data = await res.json();
    const firstResult = Array.isArray(data) ? data[0] : null;

    if (firstResult && firstResult.Status === 'Success' && Array.isArray(firstResult.PostOffice) && firstResult.PostOffice.length > 0) {
      const offices = firstResult.PostOffice;
      const primaryOffice = offices[0];
      const district = cleanLocationName(primaryOffice.District);
      const state = cleanLocationName(primaryOffice.State);
      const city = district || cleanLocationName(primaryOffice.Block) || cleanLocationName(primaryOffice.Name);

      const result = {
        success: true,
        valid: true,
        city,
        district,
        state,
        postOffices: offices.map((o) => ({
          name: o.Name,
          district: o.District,
          state: o.State,
          branchType: o.BranchType,
          deliveryStatus: o.DeliveryStatus,
        })),
        error: null,
      };

      pinCache.set(cleanPin, result);
      return result;
    }

    // PIN code not found in postal records
    const notFoundResult = {
      success: false,
      valid: false,
      error: 'Invalid PIN code. No location found for this pincode.',
    };
    pinCache.set(cleanPin, notFoundResult);
    return notFoundResult;
  } catch (err) {
    if (err.name === 'AbortError' && signal?.aborted) {
      return { success: false, valid: false, aborted: true };
    }
    // In case of network failure or timeout, return valid format but networkError flag
    // so the user can still proceed with manual entry without being blocked.
    return {
      success: false,
      valid: true,
      networkError: true,
      error: null,
    };
  }
}
