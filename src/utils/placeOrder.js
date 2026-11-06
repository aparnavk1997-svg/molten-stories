import { supabase, supabaseEnabled } from '../lib/supabase';

const SAVE_TIMEOUT_MS = 8000;

/**
 * Saves the order in the database and returns { code, total }, or null if it couldn't be saved.
 * Never throws: a failure here must not stop the customer from sending their order on WhatsApp.
 * Prices are recalculated by the database from the catalogue, so only ids and quantities are sent.
 */
export async function saveOrder({ items, hampers, gift, address }) {
  if (!supabaseEnabled) return null;
  const addr = gift?.address || address || {};
  const request = supabase.rpc('place_order', {
    p_items: (items || []).map((i) => ({ id: i.id, qty: i.qty })),
    p_hampers: (hampers || []).map((h) => ({
      items: (h.items || []).map((i) => ({ id: i.id, qty: i.qty })),
      note: h.note || '',
    })),
    p_gift_wrap: Boolean(gift?.wrap ?? gift?.giftWrap),
    p_gift_note: gift?.note || '',
    p_name: addr.name || '',
    p_phone: addr.phone || '',
    p_street: addr.street || '',
    p_city: addr.city || '',
    p_state: addr.state || '',
    p_pin: addr.pin || gift?.pin || '',
  });
  const timeout = new Promise((resolve) => setTimeout(() => resolve({ error: new Error('timeout') }), SAVE_TIMEOUT_MS));
  try {
    const { data, error } = await Promise.race([request, timeout]);
    if (error || !data?.code) return null;
    return { code: data.code, total: Number(data.total) };
  } catch {
    return null;
  }
}
