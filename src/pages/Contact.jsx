import {
  EMAIL, INSTAGRAM_HANDLE, INSTAGRAM_URL, WHATSAPP_DISPLAY, GIFT_ENQUIRY, whatsappUrl,
} from '../utils/whatsapp';

export default function Contact() {
  return (
    <div className="container page narrow">
      <p className="eyebrow">Get in touch</p>
      <h1>Contact us</h1>
      <p className="lead">
        Questions, gifting or a customised hamper? Message us on WhatsApp, email us or find us on
        Instagram, and we'll get back to you.
      </p>
      <div className="btn-row">
        <a
          className="btn"
          href={whatsappUrl('Hi Molten Stories!')}
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp {WHATSAPP_DISPLAY}
        </a>
        <a
          className="btn btn-outline"
          href={whatsappUrl(GIFT_ENQUIRY)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Enquire about a gift hamper
        </a>
      </div>
      <dl className="specs contact-list">
        <div>
          <dt>Email</dt>
          <dd><a className="link" href={`mailto:${EMAIL}`}>{EMAIL}</a></dd>
        </div>
        <div>
          <dt>Instagram</dt>
          <dd>
            <a className="link" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
              {INSTAGRAM_HANDLE}
            </a>
          </dd>
        </div>
        <div>
          <dt>WhatsApp</dt>
          <dd>{WHATSAPP_DISPLAY}</dd>
        </div>
      </dl>
    </div>
  );
}
