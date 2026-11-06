// Sends the "your account is ready" email to the customer who just signed up.
//
// The browser calls this right after sign-up with the customer's own session token. We ask Supabase who that token
// belongs to and email THAT address only, so this endpoint can't be used to send mail to arbitrary people.
//
// Sent through the shop's Gmail account using an "app password" (not the normal Gmail password).
//
// Netlify environment variables needed (Site configuration -> Environment variables):
//   GMAIL_USER             the Gmail address to send from, e.g. team.moltenstories@gmail.com
//   GMAIL_APP_PASSWORD     16-character app password for that account (Google Account -> Security -> App passwords)
//   VITE_SUPABASE_URL      (already set)
//   VITE_SUPABASE_ANON_KEY (already set)
// Optional: MAIL_FROM_NAME (default "Molten Stories"), SITE_URL (default https://moltenstories.netlify.app)

import nodemailer from 'nodemailer';

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'POST only' });

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = (process.env.GMAIL_APP_PASSWORD || '').replace(/ /g, '');  // Google shows it in groups of 4, separated by spaces
  if (!supabaseUrl || !anonKey || !gmailUser || !gmailPass) return json(500, { error: 'Email is not configured' });

  const auth = req.headers.get('authorization') || '';
  if (!auth.toLowerCase().startsWith('bearer ')) return json(401, { error: 'Not signed in' });

  // Who is this token for?
  const who = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: anonKey, authorization: auth } });
  if (!who.ok) return json(401, { error: 'Not signed in' });
  const user = await who.json();
  if (!user?.email) return json(400, { error: 'No email on this account' });

  const meta = user.user_metadata || {};
  const name = meta.full_name || meta.username || 'there';
  const siteUrl = process.env.SITE_URL || 'https://moltenstories.netlify.app';
  const shop = process.env.MAIL_FROM_NAME || 'Molten Stories';

  const html = `
    <div style="font-family:Georgia,serif;max-width:520px;margin:auto;color:#3a2f27;line-height:1.6">
      <h2 style="font-weight:400">Welcome to ${escapeHtml(shop)}, ${escapeHtml(name)} 🕯️</h2>
      <p>Your account has been created. You can sign in with this email address:</p>
      <p style="font-size:1.1em"><strong>${escapeHtml(user.email)}</strong></p>
      ${meta.username ? `<p>or with your username <strong>${escapeHtml(meta.username)}</strong>.</p>` : ''}
      <p>Your profile keeps your delivery address, so ordering next time is quicker, and you can follow your orders under My orders.</p>
      <p><a href="${escapeHtml(siteUrl)}/account" style="color:#8a5a2b">Open my account</a></p>
      <p style="color:#8a7a6a;font-size:.9em">If you didn't create this account, you can ignore this email or reply to let us know.</p>
    </div>`;

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: gmailUser, pass: gmailPass },
    });
    await transporter.sendMail({
      from: `"${shop}" <${gmailUser}>`,
      to: user.email,
      subject: `Your ${shop} account is ready`,
      html,
    });
  } catch (err) {
    console.error('welcome-email: Gmail refused to send:', err?.code, err?.responseCode, err?.message);
    return json(502, { error: 'Could not send the email' });
  }
  return json(200, { ok: true });
};
