import { useRef, useState } from 'react';
import { CONTACT_SCENES } from '../components/ContactScenes';
import {
  EMAIL,
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  WHATSAPP_DISPLAY,
  whatsappUrl,
  PHONE_NUMBER,
  PHONE_DISPLAY,
} from '../utils/whatsapp';

const TOPICS = [
  'General question',
  'Custom gift hamper',
  'Bulk & wedding orders',
  'Order assistance',
];

const JOURNEY_STEPS = [
  {
    title: 'Connect',
    tagline: 'Send a hello',
    text: 'Whether it is a single candle recommendation or custom hampers for a wedding, reach out and we’ll chat through your ideas.',
  },
  {
    title: 'Curate',
    tagline: 'Bespoke scents & shades',
    text: 'We match fragrances, wax tones, and custom labels to suit your personal aesthetic or event theme.',
  },
  {
    title: 'Hamper',
    tagline: 'Artisan hand-packing',
    text: 'Every order is nested in eco-friendly wood-wool and tied with satin ribbon and personalized gift tags.',
  },
  {
    title: 'Glow',
    tagline: 'Ready to illuminate',
    text: 'Carefully dispatched and delivered safely to your doorstep, ready to bring warmth into your space.',
  },
];

const FAQS = [
  {
    q: 'How long does delivery take?',
    a: 'Orders within Kerala typically arrive within 2–4 business days. Deliveries across the rest of India take 4–7 business days.',
  },
  {
    q: 'Can I customize candle jars or scents for events & weddings?',
    a: 'Yes! We love creating bespoke hampers, custom labels, and personalized scents for weddings, corporate gifting, and celebrations. Reach out to us with your quantity and date.',
  },
  {
    q: 'What wax and wicks do you use?',
    a: 'We use 100% natural, premium soy wax and lead-free cotton wicks, infused with fine phthalate-free fragrance oils for a clean, even burn.',
  },
];

function StudioJourney() {
  const [active, setActive] = useState(0);
  const [plays, setPlays] = useState(0);
  const tabs = useRef([]);
  const Scene = CONTACT_SCENES[active];

  const onKeyDown = (e) => {
    const move = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!move && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const next =
      e.key === 'Home'
        ? 0
        : e.key === 'End'
        ? JOURNEY_STEPS.length - 1
        : (active + move + JOURNEY_STEPS.length) % JOURNEY_STEPS.length;
    setActive(next);
    tabs.current[next]?.focus();
  };

  const onArtMove = (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    e.currentTarget.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  };

  const onArtLeave = (e) => {
    e.currentTarget.style.setProperty('--px', 0);
    e.currentTarget.style.setProperty('--py', 0);
  };

  return (
    <div className="make contact-journey-wrap">
      <div className="make-tabs" role="tablist" aria-label="From enquiry to your home" onKeyDown={onKeyDown}>
        {JOURNEY_STEPS.map((s, i) => (
          <button
            key={s.title}
            ref={(el) => (tabs.current[i] = el)}
            type="button"
            role="tab"
            id={`contact-tab-${i}`}
            aria-selected={i === active}
            aria-controls="contact-journey-panel"
            tabIndex={i === active ? 0 : -1}
            className={`make-tab ${i <= active ? 'reached' : ''} ${i === active ? 'active' : ''}`}
            onClick={() => setActive(i)}
          >
            <span className="make-name">{s.title}</span>
          </button>
        ))}
      </div>

      <div className="make-stage">
        <button
          type="button"
          className="make-art"
          onClick={() => setPlays((n) => n + 1)}
          onPointerMove={onArtMove}
          onPointerLeave={onArtLeave}
          aria-label={`Replay the ${JOURNEY_STEPS[active].title.toLowerCase()} illustration`}
        >
          <Scene key={`${active}-${plays}`} />
          <span className="make-hint" aria-hidden="true">Tap to replay</span>
        </button>

        <div
          key={active}
          className="make-panel"
          role="tabpanel"
          id="contact-journey-panel"
          aria-labelledby={`contact-tab-${active}`}
        >
          <p className="eyebrow">{JOURNEY_STEPS[active].tagline}</p>
          <h3>{JOURNEY_STEPS[active].title}</h3>
          <p>{JOURNEY_STEPS[active].text}</p>
          <div className="make-nav">
            <button
              type="button"
              className="link-btn"
              disabled={active === 0}
              onClick={() => setActive(active - 1)}
            >
              ← Previous
            </button>
            <button
              type="button"
              className="link-btn"
              disabled={active === JOURNEY_STEPS.length - 1}
              onClick={() => setActive(active + 1)}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Contact() {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const buildWhatsAppMessage = () => {
    const greeting = name.trim() ? `Hi Molten Stories! My name is ${name.trim()}.` : 'Hi Molten Stories!';
    const topicLine = `Topic: ${topic}`;
    const body = message.trim() ? `\n\n${message.trim()}` : '';
    return `${greeting}\n${topicLine}${body}`;
  };

  const handleSendWhatsApp = (e) => {
    e.preventDefault();
    window.open(whatsappUrl(buildWhatsAppMessage()), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="container page">
      <div className="contact-header">
        <p className="eyebrow">We'd love to hear from you</p>
        <h1 className="h1-small">Get in touch</h1>
        <p className="contact-lead">
          Have a question about a candle, custom gifting, or bulk hampers? Message us on WhatsApp, call, email, or find us on Instagram.
        </p>
      </div>

      {/* Quick Contact Channel Cards */}
      <div className="contact-cards-grid">
        <a
          href={whatsappUrl('Hi Molten Stories!')}
          target="_blank"
          rel="noopener noreferrer"
          className="contact-card highlight"
        >
          <div className="contact-card-icon" aria-hidden="true">💬</div>
          <div className="contact-card-info">
            <span className="contact-card-badge">Fastest reply</span>
            <h3>WhatsApp</h3>
            <p className="contact-card-val">{WHATSAPP_DISPLAY}</p>
            <span className="contact-card-action">Message on WhatsApp →</span>
          </div>
        </a>

        <a href={`tel:+${PHONE_NUMBER}`} className="contact-card">
          <div className="contact-card-icon" aria-hidden="true">📞</div>
          <div className="contact-card-info">
            <span className="contact-card-badge">Phone</span>
            <h3>Call Us</h3>
            <p className="contact-card-val">{PHONE_DISPLAY}</p>
            <span className="contact-card-action">Call directly →</span>
          </div>
        </a>

        <a href={`mailto:${EMAIL}`} className="contact-card">
          <div className="contact-card-icon" aria-hidden="true">✉️</div>
          <div className="contact-card-info">
            <span className="contact-card-badge">Email</span>
            <h3>Direct Email</h3>
            <p className="contact-card-val">{EMAIL}</p>
            <span className="contact-card-action">Send email →</span>
          </div>
        </a>

        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="contact-card"
        >
          <div className="contact-card-icon" aria-hidden="true">📸</div>
          <div className="contact-card-info">
            <span className="contact-card-badge">Community</span>
            <h3>Instagram</h3>
            <p className="contact-card-val">{INSTAGRAM_HANDLE}</p>
            <span className="contact-card-action">Follow on Instagram →</span>
          </div>
        </a>
      </div>

      {/* Main Interactive Contact Layout */}
      <div className="contact-layout">
        {/* Left: Quick Message Composer */}
        <div className="panel contact-composer-panel">
          <h2 className="panel-title">Send a quick message</h2>
          <form className="contact-composer-form" onSubmit={handleSendWhatsApp}>
            <div className="field">
              <label htmlFor="c-topic">What can we help you with?</label>
              <div className="chips contact-topic-chips" role="group" aria-label="Select enquiry topic">
                {TOPICS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`chip ${topic === t ? 'active' : ''}`}
                    onClick={() => setTopic(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label htmlFor="c-name">Your name (optional)</label>
              <input
                id="c-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maya"
                autoComplete="name"
              />
            </div>

            <div className="field">
              <label htmlFor="c-msg">Your message / details</label>
              <textarea
                id="c-msg"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us about the scents, quantities, or questions you have…"
              />
            </div>

            <div className="contact-form-actions">
              <button type="submit" className="btn btn-block">
                Start WhatsApp chat
              </button>
            </div>
            <p className="muted small text-center" style={{ marginTop: '0.6rem' }}>
              Opens WhatsApp with your message pre-formatted.
            </p>
          </form>
        </div>

        {/* Right: Studio Hours & Frequently Asked Questions */}
        <div className="contact-side">
          <div className="panel contact-studio-card">
            <h3 className="panel-title">Studio &amp; Craft</h3>
            <div className="contact-studio-body">
              <div className="studio-spec-row">
                <span className="studio-spec-label">Studio Hours</span>
                <span className="studio-spec-val">Mon – Sat: 10:00 AM – 7:00 PM IST</span>
              </div>
              <div className="studio-spec-row">
                <span className="studio-spec-label">Crafting</span>
                <span className="studio-spec-val">Small-batch artisan soy candles</span>
              </div>
              <div className="studio-spec-row">
                <span className="studio-spec-label">Packaging</span>
                <span className="studio-spec-val">Eco-friendly with gift hamper options</span>
              </div>
            </div>
          </div>

          <div className="panel contact-faq-panel">
            <h3 className="panel-title">Common questions</h3>
            <div className="contact-faqs">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={faq.q} className={`faq-item ${isOpen ? 'open' : ''}`}>
                    <button
                      type="button"
                      className="faq-q-btn"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                    >
                      <span>{faq.q}</span>
                      <span className="faq-toggle-icon">{isOpen ? '−' : '+'}</span>
                    </button>
                    {isOpen && <p className="faq-answer">{faq.a}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Studio Experience Section */}
      <section className="about-section contact-journey-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">From enquiry to your home</p>
            <h2>How we bring your ideas to life</h2>
          </div>
        </div>
        <StudioJourney />
      </section>
    </div>
  );
}
