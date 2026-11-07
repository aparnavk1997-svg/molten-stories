// Sends the "your order is confirmed" email when an admin moves an order from Placed to Confirmed.
//
// The admin screen calls this right after it saves the new status, sending the admin's own session token and the
// order ID. We check that the token belongs to an admin, read the order with that same token, and email the
// customer's address (looked up by an admin-only database function, see supabase/migrations/0009).
// Guest orders have no email address, so nothing is sent for them. The mail is sent only once per order.
//
// Sent through the shop's Gmail account, with the same Netlify environment variables as welcome-email.mjs:
//   GMAIL_USER, GMAIL_APP_PASSWORD, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
// Optional: MAIL_FROM_NAME (default "Molten Stories"), SITE_URL (default https://moltenstories.netlify.app)

import nodemailer from 'nodemailer';

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const inr = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

/**
 * True only for the move from Placed to Confirmed, and only the first time: the status history must show
 * "placed" right before the one and only "confirmed" entry. Flipping an order back and forth never re-sends.
 */
export function isFirstConfirmation(order) {
  const log = Array.isArray(order?.status_log) ? order.status_log : [];
  const confirmedAt = log.map((e) => e.status).indexOf('confirmed');
  return (
    order?.status === 'confirmed' &&
    log.filter((e) => e.status === 'confirmed').length === 1 &&
    confirmedAt > 0 &&
    log[confirmedAt - 1].status === 'placed'
  );
}

export function buildEmail(order, { shop, siteUrl }) {
  const row = (name, qty, price) =>
    `<tr><td style="padding:4px 0">${escapeHtml(name)} × ${escapeHtml(qty)}</td>` +
    `<td style="padding:4px 0;text-align:right">${price == null ? '' : inr(price * qty)}</td></tr>`;

  const rows = [];
  for (const i of order.items || []) rows.push(row(i.name, i.qty, i.price));
  (order.hampers || []).forEach((h, n) => {
    rows.push(`<tr><td colspan="2" style="padding:8px 0 2px"><strong>Gift box ${n + 1}</strong></td></tr>`);
    for (const i of h.items || []) rows.push(row(i.name, i.qty, i.price));
    if (h.packaging) rows.push(`<tr><td style="padding:4px 0">Gift box packaging</td><td style="padding:4px 0;text-align:right">${inr(h.packaging)}</td></tr>`);
    if (h.note) rows.push(`<tr><td colspan="2" style="padding:0 0 4px;color:#8a7a6a;font-size:.9em">Note: ${escapeHtml(h.note)}</td></tr>`);
  });
  if (order.gift_wrap) rows.push(`<tr><td style="padding:4px 0">Gift wrap</td><td></td></tr>`);

  const free = Number(order.delivery_fee) === 0;
  const trackUrl = `${siteUrl}/track?code=${encodeURIComponent(order.code)}`;
  const name = order.customer_name || 'there';

  const subject = `Your ${shop} order ${order.code} is confirmed`;
  const html = `
    <div style="font-family:Georgia,serif;max-width:520px;margin:auto;color:#3a2f27;line-height:1.6">
      <h2 style="font-weight:400">Your order is confirmed, ${escapeHtml(name)} 🕯️</h2>
      <p>Thank you for choosing ${escapeHtml(shop)}. We have confirmed your order and will pour and pack it with care.</p>
      <p style="margin:16px 0 4px;color:#8a7a6a;font-size:.85em;letter-spacing:.08em;text-transform:uppercase">Order ID</p>
      <p style="margin:0 0 16px;font-size:1.15em"><strong>${escapeHtml(order.code)}</strong></p>
      <table style="width:100%;border-collapse:collapse;border-top:1px solid #e9dfd3;border-bottom:1px solid #e9dfd3">
        ${rows.join('')}
        <tr><td style="padding:8px 0 2px;border-top:1px solid #e9dfd3">Subtotal</td><td style="padding:8px 0 2px;border-top:1px solid #e9dfd3;text-align:right">${inr(order.subtotal)}</td></tr>
        <tr><td style="padding:2px 0">Delivery</td><td style="padding:2px 0;text-align:right">${free ? 'Free' : inr(order.delivery_fee)}</td></tr>
        <tr><td style="padding:2px 0 8px"><strong>Total</strong></td><td style="padding:2px 0 8px;text-align:right"><strong>${inr(order.total)}</strong></td></tr>
      </table>
      <p style="margin:16px 0 4px"><strong>Delivering to</strong></p>
      <p style="margin:0">${escapeHtml(order.customer_name)}<br>${escapeHtml(order.street)}<br>${escapeHtml(order.city)}, ${escapeHtml(order.state)} - ${escapeHtml(order.pin)}</p>
      <p style="margin-top:20px"><a href="${escapeHtml(trackUrl)}" style="color:#8a5a2b">Track your order</a></p>
      <p style="color:#8a7a6a;font-size:.9em">Questions about your order? Just reply to this email.</p>
    </div>`;
  return { subject, html };
}

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'POST only' });

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = (process.env.GMAIL_APP_PASSWORD || '').replace(/ /g, '');  // Google shows it in groups of 4
  if (!supabaseUrl || !anonKey || !gmailUser || !gmailPass) return json(500, { error: 'Email is not configured' });

  const auth = req.headers.get('authorization') || '';
  if (!auth.toLowerCase().startsWith('bearer ')) return json(401, { error: 'Not signed in' });

  let code;
  try {
    code = String((await req.json())?.code || '').trim().toUpperCase();
  } catch {
    return json(400, { error: 'Send the order code as JSON' });
  }
  // Loose on purpose: just keep junk out of the query. The database decides whether the order exists.
  if (!/^ORD-[0-9A-Z]+(-[0-9A-Z]+)*$/.test(code) || code.length > 40) return json(400, { error: 'Invalid order code' });

  const headers = { apikey: anonKey, authorization: auth, 'content-type': 'application/json' };

  // Only admins may trigger this.
  const adminRes = await fetch(`${supabaseUrl}/rest/v1/rpc/is_admin`, { method: 'POST', headers, body: '{}' });
  if (!adminRes.ok || (await adminRes.json()) !== true) return json(403, { error: 'Admins only' });

  // Read the order as the admin (row-level security allows admins to see every order).
  const orderRes = await fetch(
    `${supabaseUrl}/rest/v1/orders?code=eq.${encodeURIComponent(code)}&select=*`,
    { headers }
  );
  if (!orderRes.ok) return json(502, { error: 'Could not read the order' });
  const order = (await orderRes.json())[0];
  if (!order) return json(404, { error: 'Order not found' });

  if (!isFirstConfirmation(order)) return json(200, { sent: false, reason: 'not-first-confirmation' });
  if (!order.user_id) return json(200, { sent: false, reason: 'guest' });

  const emailRes = await fetch(`${supabaseUrl}/rest/v1/rpc/order_customer_email`, {
    method: 'POST', headers, body: JSON.stringify({ p_code: code }),
  });
  if (!emailRes.ok) return json(502, { error: 'Could not look up the customer email (has migration 0009 been run?)' });
  const to = await emailRes.json();
  if (!to) return json(200, { sent: false, reason: 'no-email' });

  const siteUrl = process.env.SITE_URL || 'https://moltenstories.netlify.app';
  const shop = process.env.MAIL_FROM_NAME || 'Molten Stories';
  const { subject, html } = buildEmail(order, { shop, siteUrl });

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: gmailUser, pass: gmailPass },
    });
    await transporter.sendMail({ from: `"${shop}" <${gmailUser}>`, to, subject, html });
  } catch (err) {
    console.error('order-confirmed-email: Gmail refused to send:', err?.code, err?.responseCode, err?.message);
    return json(502, { error: 'Could not send the email' });
  }
  return json(200, { sent: true });
};
