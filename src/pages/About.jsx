import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import Reveal from '../components/Reveal';
import { SCENES } from '../components/MakeScenes';
import { categoriesOf } from '../data/products';
import { useProducts } from '../context/ProductsContext';

// Placeholder wording: edit STEPS and VALUES below so they describe how you actually work.
const STEPS = [
  { title: 'Design', text: 'Every candle starts with a shape and a mood: a petal, a bloom, a little figure. We sketch it, then choose colours that feel right together.' },
  { title: 'Pour', text: 'The wax is melted, coloured and poured by hand into the mould, a few small batches at a time.' },
  { title: 'Set', text: 'Each candle rests until it is fully set. Good things take patience, and so does good wax.' },
  { title: 'Finish', text: 'We trim, check and shape the details, then wrap every candle with care so it reaches you ready to glow.' },
];

const VALUES = [
  { title: 'Made by hand', text: 'No two candles are exactly alike. Small differences in shape and colour are part of the charm.' },
  { title: 'Made for moments', text: 'Birthdays, housewarmings, quiet evenings. We design with the moment in mind, not just the candle.' },
  { title: 'Made with care', text: 'From the first sketch to the final wrap, every step is done slowly and thoughtfully.' },
];

const OCCASIONS = [
  { label: 'A gift for someone', category: 'Gifting', blurb: 'Pick a few candles and we’ll pack them together in a gift box.' },
  { label: 'Pretty for my shelf', category: 'Decorative', blurb: 'Sculpted candles that look as good unlit as they do glowing.' },
  { label: 'Fresh, floral feel', category: 'Floral', blurb: 'Blooms, petals and bouquets in wax.' },
  { label: 'Everyday glow', category: 'Everyday', blurb: 'Simple, happy candles for every evening.' },
];

function Steps() {
  const [active, setActive] = useState(0);
  const [plays, setPlays] = useState(0); // bumping this replays the drawing
  const tabs = useRef([]);
  const Scene = SCENES[active];

  const onKeyDown = (e) => {
    const move = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!move && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const next =
      e.key === 'Home' ? 0 : e.key === 'End' ? STEPS.length - 1 : (active + move + STEPS.length) % STEPS.length;
    setActive(next);
    tabs.current[next]?.focus();
  };

  // Mouse only: the drawing drifts a few pixels towards the pointer.
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
    <div className="make">
      <div className="make-tabs" role="tablist" aria-label="How a candle is made" onKeyDown={onKeyDown}>
        {STEPS.map((s, i) => (
          <button
            key={s.title}
            ref={(el) => (tabs.current[i] = el)}
            type="button"
            role="tab"
            id={`make-tab-${i}`}
            aria-selected={i === active}
            aria-controls="make-panel"
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
          aria-label={`Replay the ${STEPS[active].title.toLowerCase()} drawing`}
        >
          <Scene key={`${active}-${plays}`} />
          <span className="make-hint" aria-hidden="true">Tap to replay</span>
        </button>

        <div key={active} className="make-panel" role="tabpanel" id="make-panel" aria-labelledby={`make-tab-${active}`}>
          <h3>{STEPS[active].title}</h3>
          <p>{STEPS[active].text}</p>
          <div className="make-nav">
            <button type="button" className="link-btn" disabled={active === 0} onClick={() => setActive(active - 1)}>
              ← Previous
            </button>
            <button
              type="button"
              className="link-btn"
              disabled={active === STEPS.length - 1}
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

function Picker() {
  const { products } = useProducts();
  const [pick, setPick] = useState(null);
  const chosen = OCCASIONS.find((o) => o.category === pick);
  const matches = chosen && chosen.category !== 'Gifting'
    ? products.filter((p) => categoriesOf(p).includes(chosen.category)).slice(0, 3)
    : [];

  return (
    <div className="picker">
      <div className="chips" role="group" aria-label="What are you looking for?">
        {OCCASIONS.map((o) => (
          <button
            key={o.category}
            type="button"
            className={`chip ${pick === o.category ? 'active' : ''}`}
            aria-pressed={pick === o.category}
            onClick={() => setPick(pick === o.category ? null : o.category)}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="picker-result" role="status" aria-live="polite">
        {chosen && (
          <>
            <p className="lead">{chosen.blurb}</p>
            {chosen.category === 'Gifting' ? (
              <Link to="/gift-box" className="btn">Build your gift box</Link>
            ) : (
              <>
                <div className="grid">
                  {matches.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
                <p>
                  <Link to={`/shop?c=${chosen.category}`} className="link">See all {chosen.category.toLowerCase()} candles →</Link>
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function About() {
  return (
    <div className="container page about">
      <section className="about-intro">
        <Reveal className="about-copy">
          <p className="eyebrow">A little about us</p>
          <h1>Stories made by hand.</h1>
          <p className="lead">
            Molten Stories is a small candle brand inspired by the beauty of thoughtful details and
            meaningful moments.
          </p>
          <p>
            From delicate floral shapes to traditional cherath-inspired designs, every creation is made
            to add warmth to your space and joy to someone's day.
          </p>
          <p>
            Whether it's a gift, a celebration or a treat for yourself, there's a little story waiting
            to glow.
          </p>
          <div className="btn-row">
            <Link to="/shop" className="btn">Explore the collection</Link>
            <Link to="/contact" className="btn btn-outline">Say hello</Link>
          </div>
        </Reveal>
        <Reveal
          as="img"
          className="about-photo"
          src="/img/about-hero.jpeg"
          alt="Hands wicking a candle on a wooden table, surrounded by wax blocks, dried flowers, wicks and a pot of melted wax"
        />
      </section>

      <section className="about-section">
        <Reveal className="section-head">
          <div>
            <p className="eyebrow">Behind the glow</p>
            <h2>How a candle is made</h2>
          </div>
        </Reveal>
        <Reveal>
          <Steps />
        </Reveal>
      </section>

      <section className="about-section">
        <Reveal className="section-head">
          <div>
            <p className="eyebrow">What we care about</p>
            <h2>Small details, big warmth</h2>
          </div>
        </Reveal>
        <Reveal className="values">
          {VALUES.map((v, i) => (
            <details key={v.title} open={i === 0}>
              <summary>{v.title}</summary>
              <p>{v.text}</p>
            </details>
          ))}
        </Reveal>
      </section>

      <section className="about-section">
        <Reveal className="section-head">
          <div>
            <p className="eyebrow">Not sure where to start?</p>
            <h2>Find your candle</h2>
          </div>
        </Reveal>
        <Reveal>
          <Picker />
        </Reveal>
      </section>
    </div>
  );
}
