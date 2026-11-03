import { formatINR } from './pricing';

export const WHATSAPP_NUMBER = '917560811261';
export const WHATSAPP_DISPLAY = '+91 75608 11261';

export const EMAIL = 'team.moltenstories@gmail.com';
export const INSTAGRAM_HANDLE = '@molten_stories';
export const INSTAGRAM_URL = 'https://www.instagram.com/molten_stories/';

export const whatsappUrl = (text) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

/** items: [{ name, price, qty }] */
export function orderMessage(items) {
  const lines = items.map((i) => `${i.name} x ${i.qty} — ${formatINR(i.price * i.qty)}`);
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  return (
    `Hello Molten Stories! I'd like to place an order:\n\n${lines.join('\n')}\n\n` +
    `Total: ${formatINR(total)}\n\n` +
    `Please confirm availability, delivery charges and payment details.`
  );
}

export const GIFT_ENQUIRY = "Hi Molten Stories! I'm interested in a custom gift hamper.";

/** Opens WhatsApp in a new tab with the order pre-filled. */
export function placeOrderOnWhatsApp(items) {
  window.open(whatsappUrl(orderMessage(items)), '_blank', 'noopener');
}
