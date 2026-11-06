import { Link, Navigate, useParams } from 'react-router-dom';
import { EMAIL, WHATSAPP_DISPLAY } from '../utils/whatsapp';

// Edit the wording here to match your actual shop policies.
const POLICIES = {
  refund: {
    title: 'Refund policy',
    intro: 'Every candle is handmade with care, so we want you to love what arrives.',
    sections: [
      {
        heading: 'When we refund',
        body: [
          'If your candle arrives damaged, melted or is not what you ordered, we will refund you or send a replacement.',
          'Please message us on WhatsApp within 48 hours of delivery with your order details and clear photos of the candle and its packaging.',
        ],
      },
      {
        heading: 'When we cannot refund',
        body: [
          'Candles that have been lit or used, and minor colour or shape variations that come with handmade work, are not eligible for a refund.',
          'Custom and personalised orders cannot be refunded once production has started.',
        ],
      },
      {
        heading: 'How refunds are paid',
        body: ['Approved refunds are returned through the same method you paid with, within 5–7 working days.'],
      },
    ],
  },
  returns: {
    title: 'Return policy',
    intro: 'We accept returns only in the cases described below.',
    sections: [
      {
        heading: 'What can be returned',
        body: [
          'Candles that arrive damaged or incorrect can be returned or exchanged. Candles are not accepted back for change of mind, as they are made to order.',
          'Items must be unused, unlit and in their original packaging.',
        ],
      },
      {
        heading: 'How to return',
        body: [
          'Contact us on WhatsApp within 48 hours of delivery with your order details and photos. We will confirm the return and share the pickup or shipping steps.',
        ],
      },
      {
        heading: 'Exchanges',
        body: ['Where possible we will send a replacement of the same candle. If it is unavailable, we will offer a refund instead.'],
      },
    ],
  },
  delivery: {
    title: 'Delivery policy',
    intro: 'We confirm delivery details with you on WhatsApp before your order is sent.',
    sections: [
      {
        heading: 'Free delivery',
        body: [
          'Delivery is free on orders where the candles come to ₹999 or more. Gift wrap and gift box charges do not count towards this amount.',
        ],
      },
      {
        heading: 'Orders under ₹999',
        body: [
          'Enter your pincode in your bag to see the delivery charge for your address. We confirm it with you on WhatsApp before you pay.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Privacy policy',
    intro: 'We collect only what we need to take and deliver your order.',
    sections: [
      {
        heading: 'What we collect',
        body: [
          'When you place an order on WhatsApp or contact us, we receive your name, phone number, delivery address and the items you want.',
          'The items in your bag are stored only in your own browser so they are still there when you come back. We do not run accounts or collect payment details on this website.',
        ],
      },
      {
        heading: 'How we use it',
        body: ['We use your details only to confirm, prepare and deliver your order and to answer your questions. We do not sell your information.'],
      },
      {
        heading: 'Sharing',
        body: ['We share your name, address and phone number with our delivery partner only so they can deliver your order.'],
      },
      {
        heading: 'Your choices',
        body: ['You can ask us to delete your details at any time by contacting us.'],
      },
    ],
  },
};

export default function Policy() {
  const { slug } = useParams();
  const policy = POLICIES[slug];
  if (!policy) return <Navigate to="/" replace />;

  return (
    <div className="container page narrow policy">
      <p className="eyebrow">Policies</p>
      <h1>{policy.title}</h1>
      <p className="lead">{policy.intro}</p>
      {policy.sections.map((s) => (
        <section key={s.heading}>
          <h3>{s.heading}</h3>
          {s.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </section>
      ))}
      <p className="muted">
        Questions? WhatsApp us on {WHATSAPP_DISPLAY} or email{' '}
        <a className="link" href={`mailto:${EMAIL}`}>{EMAIL}</a>.
      </p>
      <Link to="/contact" className="btn">Contact us</Link>
    </div>
  );
}
