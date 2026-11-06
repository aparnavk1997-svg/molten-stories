import { formatINR } from './pricing';

export const ORDER_STATUSES = [
  { value: 'placed', label: 'Placed' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'packed', label: 'Packed' },
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

/** "Order confirmed" message the admin sends to the customer on WhatsApp. */
export function orderConfirmationMessage(order) {
  const lines = order.items.map((i) => `• ${i.name} x ${i.qty} — ${formatINR(i.price * i.qty)}`);
  (order.hampers || []).forEach((h, n) => {
    lines.push(`🎁 Gift box #${n + 1} (packaging ${formatINR(h.packaging || 0)}):`);
    h.items.forEach((i) => lines.push(`   • ${i.name} x ${i.qty} — ${formatINR(i.price * i.qty)}`));
  });
  if (order.gift_wrap) lines.push('• Gift wrap');
  return [
    `Hi ${order.customer_name}! 🕯️ Your Molten Stories order is confirmed.`,
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
    `Track your order any time: ${trackUrl(order.code)}`,
    '',
    'Thank you for choosing Molten Stories!',
  ].join('\n');
}

/** Opens WhatsApp with the confirmation addressed to the customer's phone (10-digit Indian number). */
export function shareOrderOnWhatsApp(order) {
  const url = `https://wa.me/91${order.phone}?text=${encodeURIComponent(orderConfirmationMessage(order))}`;
  window.open(url, '_blank', 'noopener');
}
