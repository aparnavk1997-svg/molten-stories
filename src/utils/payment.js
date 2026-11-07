// UPI payment details. They are public (printed on the QR code and in the WhatsApp message), so they live in
// build-time settings, not in code. Set them in .env.local and in Netlify's environment variables:
//   VITE_UPI_ID    e.g. molten@okhdfcbank
//   VITE_UPI_NAME  the name customers should see in their UPI app (default: Molten Stories)

const rawId = (import.meta.env.VITE_UPI_ID || '').trim();

export const UPI_ID = /^[\w.-]{2,}@[A-Za-z][\w.-]*$/.test(rawId) ? rawId : '';
export const UPI_NAME = (import.meta.env.VITE_UPI_NAME || 'Molten Stories').trim();
export const paymentConfigured = Boolean(UPI_ID);

/** Orders in these states are still waiting for the customer to pay. */
export const awaitingPayment = (status) => status === 'placed' || status === 'confirmed';

/** upi:// link that opens the customer's UPI app with the amount and note already filled in (also what the QR encodes). */
export function upiLink({ amount, code }) {
  const params = [
    `pa=${UPI_ID}`,
    `pn=${encodeURIComponent(UPI_NAME)}`,
    `am=${Number(amount).toFixed(2)}`,
    'cu=INR',
    `tn=${encodeURIComponent(`Order ${code}`)}`,
  ];
  return `upi://pay?${params.join('&')}`;
}

export const payUrl = (code) => `${window.location.origin}/pay?code=${encodeURIComponent(code)}`;
