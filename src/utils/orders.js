import { formatINR } from './pricing';
import { UPI_ID, UPI_NAME, paymentConfigured, payUrl } from './payment';

export const ORDER_STATUSES = [
  { value: 'placed', label: 'Placed' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const statusLabel = (status) => ORDER_STATUSES.find((s) => s.value === status)?.label || status;

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export const trackUrl = (code) => `${window.location.origin}/track?code=${encodeURIComponent(code)}`;

/** The WhatsApp message for an order, worded for its current status. A confirmed order also asks for payment. */
export function orderConfirmationMessage(order) {
  const lines = order.items.map((i) => `• ${i.name} x ${i.qty} — ${formatINR(i.price * i.qty)}`);
  (order.hampers || []).forEach((h, n) => {
    lines.push(`🎁 Gift box #${n + 1} (packaging ${formatINR(h.packaging || 0)}):`);
    h.items.forEach((i) => lines.push(`   • ${i.name} x ${i.qty} — ${formatINR(i.price * i.qty)}`));
  });
  if (order.gift_wrap) lines.push('• Gift wrap');

  const headline = {
    placed: 'We have received your order and will confirm it shortly.',
    confirmed: 'Your order is confirmed.',
    packed: 'Your order is packed and will be on its way soon.',
    shipped: 'Your order has been shipped.',
    delivered: 'Your order has been delivered. We hope you love it!',
    cancelled: 'Your order has been cancelled.',
  }[order.status] || 'Here is an update on your order.';

  const out = [
    `Hi ${order.customer_name}! 🕯️ ${headline}`,
    '',
    `Order ID: ${order.code}`,
    '',
    ...lines,
    '',
    `Subtotal: ${formatINR(order.subtotal)}`,
    `Delivery: ${Number(order.delivery_fee) === 0 ? 'Free' : formatINR(order.delivery_fee)}`,
    `Total: ${formatINR(order.total)}`,
    '',
    'Delivering to:',
    `${order.customer_name}, ${order.street}, ${order.city}, ${order.state} - ${order.pin}`,
    '',
  ];

  if (order.status === 'confirmed' && paymentConfigured) {
    out.push(
      `💳 Please pay ${formatINR(order.total)} to complete your order.`,
      '',
      `UPI ID: ${UPI_ID} (${UPI_NAME})`,
      `Scan the QR code or pay with your UPI app here: ${payUrl(order.code)}`,
      '',
      'Once you have paid, please reply here with a screenshot so we can confirm your payment and start preparing your order.',
      ''
    );
  }

  out.push(`Track your order any time: ${trackUrl(order.code)}`, '', 'Thank you for choosing Molten Stories!');
  return out.join('\n');
}

/** WhatsApp link addressed to the customer's phone (10-digit Indian number), message filled in. */
export const orderWhatsAppUrl = (order) =>
  `https://wa.me/91${order.phone}?text=${encodeURIComponent(orderConfirmationMessage(order))}`;

/** Opens WhatsApp with the message for this order. */
export function shareOrderOnWhatsApp(order) {
  window.open(orderWhatsAppUrl(order), '_blank', 'noopener');
}
