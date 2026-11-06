import { FREE_DELIVERY_MIN, deliveryInfo, formatINR, GIFT_WRAP_PRICE, GIFT_BOX_PRICE } from './pricing';

export const WHATSAPP_NUMBER = '917560811261';
export const WHATSAPP_DISPLAY = '+91 75608 11261';
export const PHONE_NUMBER = '917736701897';
export const PHONE_DISPLAY = '+91 77367 01897';

export const EMAIL = 'team.moltenstories@gmail.com';
export const INSTAGRAM_HANDLE = '@molten_stories';
export const INSTAGRAM_URL = 'https://www.instagram.com/molten_stories/';

export const whatsappUrl = (text) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

/** Customer-facing product ID, e.g. 7 -> "MS-007". */
export const productCode = (id) => `MS-${String(id).padStart(3, '0')}`;

/** Delivery lines for the WhatsApp message: charge known (valid pincode), free, or still to confirm. */
function deliveryLines(pin, subtotal) {
  const d = deliveryInfo(pin, subtotal);
  if (d) {
    return { line: `Delivery to ${pin}: ${d.free ? 'Free' : formatINR(d.fee)}\n`, fee: d.fee, known: true };
  }
  return { line: subtotal >= FREE_DELIVERY_MIN ? `Delivery: Free\n` : '', fee: 0, known: subtotal >= FREE_DELIVERY_MIN };
}

/**
 * Formats WhatsApp order message with clear distinction between
 * regular individual candles and custom gift box hampers.
 */
export function orderMessage(orderPayload, legacyGift = {}) {
  const isLegacy = Array.isArray(orderPayload);
  const items = isLegacy ? orderPayload : (orderPayload.items || []);
  const hampers = isLegacy ? (legacyGift.hampers || []) : (orderPayload.hampers || []);
  const options = isLegacy ? legacyGift : (orderPayload.gift || orderPayload);

  const addr = options.address || {};
  const pin = addr.pin || options.pin || '';
  const giftWrap = options.giftWrap ?? options.wrap;
  const note = (options.note || '').trim();

  const bodySections = [];

  if (items.length > 0) {
    const regularLines = items.map(
      (i) => `• ${i.name} (ID: ${productCode(i.id)}) x ${i.qty} — ${formatINR(i.price * i.qty)}`
    );
    let sectionText = `Individual Candles:\n${regularLines.join('\n')}`;
    if (giftWrap) {
      sectionText += `\nGift wrap: ${formatINR(GIFT_WRAP_PRICE)}`;
    }
    bodySections.push(sectionText);
  }

  if (hampers.length > 0) {
    hampers.forEach((h, idx) => {
      const hamperTitle = hampers.length > 1 ? `🎁 Custom Gift Box Hamper #${idx + 1}` : `🎁 Custom Gift Box Hamper`;
      const count = (h.items || []).reduce((s, i) => s + (i.qty || 1), 0);
      const hamperLines = (h.items || []).map(
        (i) => `  • ${i.name} (ID: ${productCode(i.id)}) x ${i.qty} — ${formatINR(i.price * i.qty)}`
      );
      const hSub = (h.items || []).reduce((s, i) => s + i.price * i.qty, 0);
      let hBlock = `${hamperTitle} (${count} candles):\n${hamperLines.join('\n')}\n  Packaging fee: ${formatINR(GIFT_BOX_PRICE)}\n  Hamper total: ${formatINR(hSub + GIFT_BOX_PRICE)}`;
      if (h.note && h.note.trim()) {
        hBlock += `\n  Enclosed card: "${h.note.trim()}"`;
      }
      bodySections.push(hBlock);
    });
  }

  const itemsSubtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const hampersCandlesSubtotal = hampers.reduce(
    (s, h) => s + (h.items || []).reduce((hs, hi) => hs + hi.price * hi.qty, 0),
    0
  );
  const candlesTotal = itemsSubtotal + hampersCandlesSubtotal;
  const wrapFees = (items.length > 0 && giftWrap ? GIFT_WRAP_PRICE : 0) + (hampers.length * GIFT_BOX_PRICE);
  const del = deliveryLines(pin, candlesTotal);

  const hasAddress = addr.name || addr.street || addr.city || addr.phone;
  let addrSection = '';
  if (hasAddress) {
    const parts = [
      addr.name ? `Recipient: ${addr.name}` : '',
      addr.phone ? `Phone: ${addr.phone}` : '',
      addr.street ? `Address: ${addr.street}` : '',
      [addr.city, addr.state, pin ? `PIN: ${pin}` : ''].filter(Boolean).join(', '),
    ].filter(Boolean);
    addrSection = `Delivery details:\n${parts.join('\n')}\n\n`;
  }

  const isOnlyHampers = items.length === 0 && hampers.length > 0;
  const intro = isOnlyHampers
    ? `Hello Molten Stories! I'd like to place an order for ${hampers.length === 1 ? 'a custom gift box hamper' : `${hampers.length} custom gift box hampers`}:`
    : `Hello Molten Stories! I'd like to place an order:`;

  return (
    `${intro}\n\n` +
    `${bodySections.join('\n\n')}\n\n` +
    del.line +
    `Total: ${formatINR(candlesTotal + wrapFees + del.fee)}\n\n` +
    (note && hampers.length === 0 ? `Gift message card: "${note}"\n\n` : '') +
    addrSection +
    (del.known
      ? `Please confirm availability and payment details.`
      : `Please confirm availability, delivery charges and payment details.`)
  );
}

export const GIFT_ENQUIRY = "Hi Molten Stories! I'm interested in a custom gift hamper.";
export const STORY_MESSAGE = "Hi Molten Stories! I'd love to share my story about your candles.";

/** review: { name, city, product, rating, text } */
export function reviewMessage({ name, city, product, rating, text }) {
  return (
    `Hi Molten Stories! I'd like to share a review.\n\n` +
    `Name: ${name}\n` +
    (city ? `City: ${city}\n` : '') +
    (product ? `Candle: ${product}\n` : '') +
    `Rating: ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)} (${rating}/5)\n\n` +
    `"${text}"\n\n` +
    `You're welcome to feature this on your website.`
  );
}

/** items: [{ id, name, price, qty }]; boxPrice: flat gift box charge; note: optional gift message */
export function giftBoxMessage(items, note = '', boxPrice = 0) {
  const lines = items.map(
    (i) => `• ${i.name} (ID: ${productCode(i.id)}) x ${i.qty} — ${formatINR(i.price * i.qty)}`
  );
  const count = items.reduce((s, i) => s + i.qty, 0);
  const candlesTotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  return (
    `Hello Molten Stories! I'd like to order a gift box of ${count} candles:\n\n${lines.join('\n')}\n\n` +
    `Candles: ${formatINR(candlesTotal)}\n` +
    `Gift box: ${formatINR(boxPrice)}\n` +
    `Total: ${formatINR(candlesTotal + boxPrice)}\n` +
    (candlesTotal >= FREE_DELIVERY_MIN ? `Delivery: Free\n` : '') +
    `\n` +
    (note ? `Gift message: "${note}"\n\n` : '') +
    (candlesTotal >= FREE_DELIVERY_MIN
      ? `Please confirm availability, packing and payment details.`
      : `Please confirm availability, packing, delivery charges and payment details.`)
  );
}

/** Opens WhatsApp in a new tab with the order pre-filled. */
export function placeOrderOnWhatsApp(items, gift) {
  window.open(whatsappUrl(orderMessage(items, gift)), '_blank', 'noopener');
}
