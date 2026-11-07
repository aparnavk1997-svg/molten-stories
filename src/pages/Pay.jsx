import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { supabase, supabaseEnabled } from '../lib/supabase';
import { formatINR } from '../utils/pricing';
import { statusLabel } from '../utils/orders';
import { UPI_ID, UPI_NAME, awaitingPayment, paymentConfigured, upiLink } from '../utils/payment';
import { WHATSAPP_NUMBER } from '../utils/whatsapp';

export default function Pay() {
  const [params] = useSearchParams();
  const code = (params.get('code') || '').trim();
  const [order, setOrder] = useState(null);
  const [state, setState] = useState(code ? 'loading' : 'missing'); // loading | missing | notfound | error | ready
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!code || !supabaseEnabled) return undefined;
    let cancelled = false;
    supabase.rpc('track_order', { p_code: code }).then(({ data, error }) => {
      if (cancelled) return;
      if (error) return setState('error');
      if (!data) return setState('notfound');
      setOrder(data);
      setState('ready');
    });
    return () => {
      cancelled = true;
    };
  }, [code]);

  const link = order && paymentConfigured ? upiLink({ amount: order.total, code: order.code }) : '';

  useEffect(() => {
    if (!link) return;
    QRCode.toDataURL(link, { width: 280, margin: 2, errorCorrectionLevel: 'M' }).then(setQr).catch(() => setQr(''));
  }, [link]);

  const copyUpi = async () => {
    try {
      await navigator.clipboard.writeText(UPI_ID);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy the UPI ID', UPI_ID);
    }
  };

  let body;
  if (!supabaseEnabled || state === 'error') {
    body = <p className="muted">We could not load this order right now. Please try again in a moment, or message us on WhatsApp.</p>;
  } else if (state === 'missing') {
    body = <p className="muted">This payment link is missing its order ID. Please use the link we sent you on WhatsApp.</p>;
  } else if (state === 'loading') {
    body = <p className="muted">Loading…</p>;
  } else if (state === 'notfound') {
    body = <p className="muted">We could not find that order. Please check the link we sent you on WhatsApp.</p>;
  } else if (!awaitingPayment(order.status)) {
    body = (
      <p className="muted">
        Order {order.code} is marked <strong>{statusLabel(order.status)}</strong>, so there is nothing to pay here.{' '}
        <Link to={`/track?code=${order.code}`}>Track this order</Link>
      </p>
    );
  } else if (!paymentConfigured) {
    body = <p className="muted">Online payment details are not available yet. Please message us on WhatsApp and we will help you pay.</p>;
  } else {
    const paidMessage = `Hi Molten Stories! I have paid ${formatINR(order.total)} for order ${order.code}. Payment screenshot attached.`;
    body = (
      <div className="panel panel-pad pay-card">
        <p className="muted small">Order {order.code}</p>
        <p className="pay-amount"><strong>{formatINR(order.total)}</strong></p>

        {qr && <img className="pay-qr" src={qr} alt={`UPI QR code to pay ${formatINR(order.total)}`} width="280" height="280" />}
        <p className="muted small">Scan with any UPI app (GPay, PhonePe, Paytm, BHIM)</p>

        <a className="btn btn-block" href={link}>Pay {formatINR(order.total)} with a UPI app</a>
        <p className="muted small">On a phone, this opens your UPI app with the amount filled in.</p>

        <p className="pay-upi">
          UPI ID: <strong>{UPI_ID}</strong> ({UPI_NAME})
          <button type="button" className="link-btn" onClick={copyUpi}>{copied ? 'Copied' : 'Copy'}</button>
        </p>

        <p>
          After paying, send us a screenshot so we can confirm your payment and start preparing your order.
        </p>
        <a
          className="btn btn-outline btn-block"
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(paidMessage)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          I have paid, send screenshot on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="container page narrow center-text">
      <p className="eyebrow">Payment</p>
      <h1>Pay for your order</h1>
      {body}
    </div>
  );
}
