import { Link } from 'react-router-dom';
import {
  EMAIL, INSTAGRAM_HANDLE, INSTAGRAM_URL, WHATSAPP_DISPLAY, PHONE_NUMBER, PHONE_DISPLAY, whatsappUrl,
} from '../utils/whatsapp';

const iconProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: 'false',
};

const WhatsAppIcon = () => (
  <svg {...iconProps}>
    <path d="M3 21l1.65-4.8A8.5 8.5 0 1 1 8 19.4L3 21z" />
    <path d="M9 10c0 3 2 5 5 5l1.2-1.4-1.9-1-.9.7c-.8-.4-1.5-1.1-1.9-1.9l.7-.9-1-1.9L9 10z" />
  </svg>
);

const PhoneIcon = () => (
  <svg {...iconProps}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
  </svg>
);

const MailIcon = () => (
  <svg {...iconProps}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </svg>
);

const InstagramIcon = () => (
  <svg {...iconProps}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <h4>Explore</h4>
          <ul className="plain">
            <li><Link to="/shop">Shop candles</Link></li>
            <li><Link to="/gift-box">Build a gift box</Link></li>
            <li><Link to="/about">Our story</Link></li>
            <li><Link to="/review">Write a review</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4>Policies</h4>
          <ul className="plain">
            <li><Link to="/policies/delivery">Delivery policy</Link></li>
            <li><Link to="/policies/refund">Refund policy</Link></li>
            <li><Link to="/policies/returns">Return policy</Link></li>
            <li><Link to="/policies/privacy">Privacy policy</Link></li>
          </ul>
        </div>
        <div>
          <h4>Get in touch</h4>
          <p className="small">Every candle tells a story. Handmade with warmth and care.</p>
          <ul className="plain">
            <li>
              <a
                className="link footer-contact"
                href={whatsappUrl('Hi Molten Stories!')}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`WhatsApp ${WHATSAPP_DISPLAY}`}
              >
                <WhatsAppIcon />
                <span>{WHATSAPP_DISPLAY}</span>
              </a>
            </li>
            <li>
              <a
                className="link footer-contact"
                href={`tel:+${PHONE_NUMBER}`}
                aria-label={`Call ${PHONE_DISPLAY}`}
              >
                <PhoneIcon />
                <span>{PHONE_DISPLAY}</span>
              </a>
            </li>
            <li>
              <a className="link footer-contact" href={`mailto:${EMAIL}`} aria-label={`Email ${EMAIL}`}>
                <MailIcon />
                <span>{EMAIL}</span>
              </a>
            </li>
            <li>
              <a
                className="link footer-contact"
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Instagram ${INSTAGRAM_HANDLE}`}
              >
                <InstagramIcon />
                <span>{INSTAGRAM_HANDLE}</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        © {new Date().getFullYear()} Molten Stories. Made with love.
      </div>
    </footer>
  );
}
