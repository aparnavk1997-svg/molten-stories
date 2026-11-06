/**
 * Animated line-art scenes for the Contact page studio showcase.
 * Matches the interactive drawing aesthetic of MakeScenes on the Our story page.
 */

function ContactDefs({ id }) {
  return (
    <defs>
      <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" style={{ stopColor: 'var(--gold-grad-1)' }} />
        <stop offset="1%" style={{ stopColor: 'var(--gold-grad-2)' }} />
      </linearGradient>
      <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" style={{ stopColor: 'var(--gold-grad-1)', stopOpacity: 0.6 }} />
        <stop offset="1%" style={{ stopColor: 'var(--gold-grad-1)', stopOpacity: 0 }} />
      </radialGradient>
    </defs>
  );
}

/** 1. Connect: A wax-sealed envelope opening with golden conversation rays. */
export function ConnectScene() {
  return (
    <svg className="ms" viewBox="0 0 320 380" aria-hidden="true" focusable="false">
      <ContactDefs id="connect" />
      {/* Background guide circle */}
      <g className="ms-guide">
        <circle cx="160" cy="180" r="110" />
        <path d="M50 180 H270 M160 70 V290" />
      </g>

      {/* Floating Sparkles & Connection Radiance */}
      <circle className="ms-heat" cx="160" cy="170" r="95" fill="url(#connect-glow)" />

      {/* Envelope Base */}
      <g className="ms-line">
        <path className="ms-draw" pathLength="1" style={{ '--i': 0 }} d="M70 140 H250 V260 Q250 270 240 270 H80 Q70 270 70 260 Z" />
        {/* Envelope Fold Lines */}
        <path className="ms-draw" pathLength="1" style={{ '--i': 1 }} d="M70 140 L160 210 L250 140" />
        <path className="ms-draw" pathLength="1" style={{ '--i': 2 }} d="M70 270 L125 200" />
        <path className="ms-draw" pathLength="1" style={{ '--i': 3 }} d="M250 270 L195 200" />
      </g>

      {/* Letter rising from inside */}
      <g className="ms-line">
        <path className="ms-draw" pathLength="1" style={{ '--i': 4 }} d="M90 170 V100 Q90 90 100 90 H220 Q230 90 230 100 V170" />
        {/* Note lines */}
        <line className="ms-draw" pathLength="1" style={{ '--i': 5 }} x1="110" y1="115" x2="210" y2="115" />
        <line className="ms-draw" pathLength="1" style={{ '--i': 6 }} x1="110" y1="135" x2="185" y2="135" />
      </g>

      {/* Molten Wax Seal Stamp */}
      <circle className="ms-dot ms-pop" style={{ '--i': 7 }} cx="160" cy="210" r="18" fill="url(#connect-gold)" />
      <path className="ms-star" style={{ '--i': 8 }} d="M160 200 L163 207 L170 210 L163 213 L160 220 L157 213 L150 210 L157 207 Z" fill="#fff" opacity="0.9" />

      {/* Sparkles drifting upwards */}
      <circle className="ms-dot ms-pop" style={{ '--i': 9 }} cx="120" cy="65" r="5" />
      <circle className="ms-dot ms-pop" style={{ '--i': 10 }} cx="210" cy="55" r="6" />
      <circle className="ms-dot ms-pop" style={{ '--i': 11 }} cx="160" cy="40" r="4" />
    </svg>
  );
}

/** 2. Curate: An apothecary beaker blending bespoke scents with botanical sprigs. */
export function CurateScene() {
  return (
    <svg className="ms" viewBox="0 0 320 380" aria-hidden="true" focusable="false">
      <ContactDefs id="curate" />
      <g className="ms-guide">
        <circle cx="160" cy="190" r="105" />
        <path d="M160 85 V295" />
      </g>

      {/* Scent halo */}
      <ellipse className="ms-heat" cx="160" cy="200" rx="100" ry="80" fill="url(#curate-glow)" />

      {/* Apothecary Jar / Beaker */}
      <g className="ms-line">
        <path className="ms-draw" pathLength="1" style={{ '--i': 0 }} d="M125 110 H195" />
        <path className="ms-draw" pathLength="1" style={{ '--i': 1 }} d="M135 110 V145 L95 245 Q85 270 110 270 H210 Q235 270 225 245 L185 145 V110" />
      </g>

      {/* Molten Blend inside beaker */}
      <path className="ms-surface" d="M106 220 Q160 230 214 220 L220 250 Q225 265 205 265 H115 Q95 265 100 250 Z" fill="url(#curate-gold)" opacity="0.65" />

      {/* Botanical Sprig */}
      <g className="ms-line">
        <path className="ms-draw" pathLength="1" style={{ '--i': 2 }} d="M160 230 C160 160 180 90 205 60" />
        <path className="ms-petal ms-draw" pathLength="1" style={{ '--i': 3 }} d="M185 120 C205 110 215 125 205 135 C195 145 180 135 185 120 Z" />
        <path className="ms-petal ms-draw" pathLength="1" style={{ '--i': 4 }} d="M165 160 C145 150 135 165 145 175 C155 185 170 175 165 160 Z" />
        <path className="ms-petal ms-draw" pathLength="1" style={{ '--i': 5 }} d="M195 80 C215 70 225 85 215 95 C205 105 190 95 195 80 Z" />
      </g>

      {/* Fragrance Droplets */}
      <circle className="ms-dot ms-pop" style={{ '--i': 6 }} cx="160" cy="140" r="5" />
      <circle className="ms-dot ms-pop" style={{ '--i': 7 }} cx="160" cy="170" r="6" />
      <circle className="ms-dot ms-pop" style={{ '--i': 8 }} cx="160" cy="200" r="7" />
    </svg>
  );
}

/** 3. Hamper: An illustrated luxury gift box tied with a satin ribbon. */
export function HamperScene() {
  return (
    <svg className="ms" viewBox="0 0 320 380" aria-hidden="true" focusable="false">
      <ContactDefs id="hamper" />
      <g className="ms-guide">
        <circle cx="160" cy="190" r="110" />
      </g>

      {/* Gift Box Base */}
      <g className="ms-line">
        <rect className="ms-draw" pathLength="1" style={{ '--i': 0 }} x="80" y="150" width="160" height="120" rx="8" />
        {/* Lid Top */}
        <path className="ms-draw" pathLength="1" style={{ '--i': 1 }} d="M70 150 H250 V130 Q250 120 240 120 H80 Q70 120 70 130 Z" />
      </g>

      {/* Ribbon Straps */}
      <rect className="ms-band" x="148" y="120" width="24" height="150" fill="url(#hamper-gold)" />
      <rect className="ms-band" x="70" y="195" width="180" height="20" fill="url(#hamper-gold)" />

      {/* Satin Bow on Top */}
      <g className="ms-line">
        <path className="ms-petal ms-draw" pathLength="1" style={{ '--i': 2 }} d="M160 120 C130 90 100 100 120 120 C140 135 155 125 160 120 Z" />
        <path className="ms-petal ms-draw" pathLength="1" style={{ '--i': 3 }} d="M160 120 C190 90 220 100 200 120 C180 135 165 125 160 120 Z" />
        {/* Ribbon tails */}
        <path className="ms-draw" pathLength="1" style={{ '--i': 4 }} d="M152 125 C140 145 130 155 125 175" />
        <path className="ms-draw" pathLength="1" style={{ '--i': 5 }} d="M168 125 C180 145 190 155 195 175" />
      </g>

      {/* Center Bow Knot */}
      <circle className="ms-dot ms-pop" style={{ '--i': 6 }} cx="160" cy="120" r="9" fill="url(#hamper-gold)" />

      {/* Gift Tag */}
      <g className="ms-line">
        <path className="ms-draw" pathLength="1" style={{ '--i': 7 }} d="M190 145 L225 175 L210 200 L175 170 Z" fill="var(--surface)" />
        <circle className="ms-dot ms-pop" style={{ '--i': 8 }} cx="186" cy="158" r="3" />
      </g>
    </svg>
  );
}

/** 4. Warmth: A glowing candle radiating cozy light arcs and evening starlight. */
export function WarmthScene() {
  return (
    <svg className="ms" viewBox="0 0 320 380" aria-hidden="true" focusable="false">
      <ContactDefs id="warmth" />
      {/* Radiant light halos */}
      <circle className="ms-heat" cx="160" cy="150" r="105" fill="url(#warmth-glow)" />
      <g className="ms-guide">
        <circle cx="160" cy="150" r="70" />
        <circle cx="160" cy="150" r="95" />
      </g>

      {/* Radiant Glow Rays */}
      <path className="ms-wisp" style={{ '--i': 0 }} d="M160 40 V65" />
      <path className="ms-wisp" style={{ '--i': 1 }} d="M75 105 L95 120" />
      <path className="ms-wisp" style={{ '--i': 2 }} d="M245 105 L225 120" />
      <path className="ms-wisp" style={{ '--i': 3 }} d="M60 150 H85" />
      <path className="ms-wisp" style={{ '--i': 4 }} d="M260 150 H235" />

      {/* Flame */}
      <path className="ms-pop" style={{ '--i': 2 }} d="M160 100 C175 125 175 145 160 160 C145 145 145 125 160 100 Z" fill="url(#warmth-gold)" />
      <path className="ms-pop" style={{ '--i': 3 }} d="M160 120 C166 132 166 142 160 152 C154 142 154 132 160 120 Z" fill="#fff" opacity="0.9" />

      {/* Wick */}
      <rect x="158.5" y="156" width="3" height="14" rx="1.5" fill="var(--wick)" />

      {/* Candle Jar Body */}
      <g className="ms-line">
        <rect className="ms-draw" pathLength="1" style={{ '--i': 4 }} x="105" y="170" width="110" height="105" rx="10" />
        <ellipse className="ms-draw" pathLength="1" style={{ '--i': 5 }} cx="160" cy="176" rx="46" ry="5" />
        {/* Label */}
        <rect className="ms-draw" pathLength="1" style={{ '--i': 6 }} x="130" y="205" width="60" height="38" rx="3" fill="var(--surface)" />
      </g>

      {/* Twinkles */}
      <path className="ms-star" style={{ '--i': 7 }} d="M100 80 L102 85 L107 87 L102 89 L100 94 L98 89 L93 87 L98 85 Z" fill="var(--gold-light)" />
      <path className="ms-star" style={{ '--i': 8 }} d="M220 70 L222 75 L227 77 L222 79 L220 84 L218 79 L213 77 L218 75 Z" fill="var(--gold-light)" />
    </svg>
  );
}

export const CONTACT_SCENES = [ConnectScene, CurateScene, HamperScene, WarmthScene];
