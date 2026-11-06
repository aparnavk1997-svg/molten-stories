/**
 * Artisan SVG illustrations for empty states and key milestone moments.
 * Fully themed via CSS custom properties.
 */

/** 1. Empty Bag & Drawer: An unlit candle resting peacefully on a ceramic dish with a dotted halo. */
export function EmptyBagIllustration({ className = 'empty-art' }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="eb-halo" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="var(--gold-grad-1)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--gold-grad-1)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="eb-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--gold-grad-1)" />
          <stop offset="100%" stopColor="var(--gold-dark)" />
        </linearGradient>
      </defs>

      {/* Dotted expectant halo */}
      <circle cx="100" cy="72" r="48" fill="url(#eb-halo)" />
      <circle cx="100" cy="72" r="42" stroke="var(--gold-dark)" strokeWidth="1.2" strokeDasharray="3 6" opacity="0.6" />
      <circle cx="100" cy="72" r="54" stroke="var(--gold-light)" strokeWidth="1" strokeDasharray="2 8" opacity="0.4" />

      {/* Decorative stars */}
      <path d="M100 22 L101.5 28 L107.5 29.5 L101.5 31 L100 37 L98.5 31 L92.5 29.5 L98.5 28 Z" fill="var(--gold-light)" opacity="0.75" />
      <path d="M142 52 L143 56 L147 57 L143 58 L142 62 L141 58 L137 57 L141 56 Z" fill="var(--gold)" opacity="0.6" />
      <path d="M58 56 L59 59 L62 60 L59 61 L58 64 L57 61 L54 60 L57 59 Z" fill="var(--gold)" opacity="0.6" />

      {/* Unlit wick */}
      <path d="M100 68 Q102 58 97 52" stroke="var(--wick)" strokeWidth="2.5" strokeLinecap="round" />

      {/* Candle jar / body */}
      <rect x="66" y="68" width="68" height="74" rx="8" fill="var(--jar)" stroke="url(#eb-gold)" strokeWidth="1.8" />
      {/* Wax top & level */}
      <ellipse cx="100" cy="74" rx="30" ry="4" fill="var(--surface-2)" stroke="var(--gold-dark)" strokeWidth="1" />
      {/* Label outline */}
      <rect x="80" y="88" width="40" height="28" rx="3" fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
      <line x1="88" y1="98" x2="112" y2="98" stroke="var(--gold)" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="92" y1="104" x2="108" y2="104" stroke="var(--muted)" strokeWidth="1" strokeLinecap="round" />

      {/* Ceramic fluted dish */}
      <ellipse cx="100" cy="146" rx="64" ry="14" fill="var(--surface-2)" stroke="url(#eb-gold)" strokeWidth="1.8" />
      <ellipse cx="100" cy="144" rx="54" ry="10" fill="var(--media-1)" opacity="0.7" />
      <path d="M42 146 Q100 166 158 146" stroke="var(--gold-dark)" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />

      {/* Dish base shadow */}
      <ellipse cx="100" cy="156" rx="46" ry="5" fill="var(--shadow)" opacity="0.4" />
    </svg>
  );
}

/** 2. Empty Wishlist: A candle jar etched with a heart motif and rising embers. */
export function EmptySavedIllustration({ className = 'empty-art' }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="es-glow" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="var(--gold-grad-1)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--gold-grad-1)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="es-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--gold-grad-1)" />
          <stop offset="100%" stopColor="var(--gold-dark)" />
        </linearGradient>
      </defs>

      {/* Aura */}
      <circle cx="100" cy="90" r="56" fill="url(#es-glow)" />

      {/* Rising heart embers */}
      <path
        d="M100 32 C98 27 92 25 88 28 C83 32 87 38 100 46 C113 38 117 32 112 28 C108 25 102 27 100 32 Z"
        fill="var(--gold-light)"
        opacity="0.85"
      />
      <path
        d="M136 48 C134.5 44 130 42.5 127 45 C123 48 126 53 136 59 C146 53 149 48 145 45 C142 42.5 137.5 44 136 48 Z"
        fill="var(--gold)"
        opacity="0.6"
        transform="scale(0.7) translate(40, -10)"
      />
      <path
        d="M64 48 C62.5 44 58 42.5 55 45 C51 48 54 53 64 59 C74 53 77 48 73 45 C70 42.5 65.5 44 64 48 Z"
        fill="var(--gold)"
        opacity="0.6"
        transform="scale(0.7) translate(10, 10)"
      />

      {/* Sparkles */}
      <circle cx="70" cy="68" r="2.5" fill="var(--gold-light)" opacity="0.7" />
      <circle cx="132" cy="74" r="2" fill="var(--gold-light)" opacity="0.7" />
      <circle cx="100" cy="54" r="1.5" fill="var(--gold)" opacity="0.8" />

      {/* Candle Jar */}
      <rect x="65" y="75" width="70" height="78" rx="9" fill="var(--jar)" stroke="url(#es-gold)" strokeWidth="1.8" />
      <ellipse cx="100" cy="80" rx="31" ry="4.5" fill="var(--surface-2)" stroke="var(--gold-dark)" strokeWidth="1" />
      <path d="M100 75 Q98 67 100 62" stroke="var(--wick)" strokeWidth="2.5" strokeLinecap="round" />

      {/* Etched Heart on Jar Label */}
      <rect x="77" y="94" width="46" height="42" rx="4" fill="var(--surface)" stroke="var(--gold)" strokeWidth="1.2" />
      <path
        d="M100 108 C97 101 89 100 85 104 C80 110 85 117 100 126 C115 117 120 110 115 104 C111 100 103 101 100 108 Z"
        fill="url(#es-gold)"
        opacity="0.9"
      />

      {/* Reflection & Base dish */}
      <ellipse cx="100" cy="158" rx="44" ry="5" fill="var(--shadow)" opacity="0.35" />
    </svg>
  );
}

/** 3. 404 Not Found: A softly blown-out candle with an elegant wisp of curling smoke. */
export function BlownOutCandleIllustration({ className = 'empty-art' }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="bo-smoke" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.8" />
          <stop offset="40%" stopColor="var(--muted)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="var(--muted)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="bo-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--gold-grad-1)" />
          <stop offset="100%" stopColor="var(--gold-dark)" />
        </linearGradient>
      </defs>

      {/* Elegant curling wisps of smoke */}
      <path
        className="smoke-wisp-1"
        d="M100 84 C100 70 115 62 110 48 C105 34 82 36 92 18 C96 11 106 12 108 6"
        stroke="url(#bo-smoke)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        className="smoke-wisp-2"
        d="M98 84 C92 72 84 64 90 52 C96 38 116 38 110 24 C106 16 97 15 95 8"
        stroke="url(#bo-smoke)"
        strokeWidth="1.5"
        strokeDasharray="3 3"
        strokeLinecap="round"
        fill="none"
        opacity="0.65"
      />

      {/* Tiny glowing red-orange ember on wick tip */}
      <circle cx="100" cy="85" r="3.5" fill="#e25d3b" />
      <circle cx="100" cy="85" r="6" fill="#f4a261" opacity="0.4" />
      <path d="M100 87 L100 96" stroke="var(--wick)" strokeWidth="2.5" strokeLinecap="round" />

      {/* Star sparkle drifting away */}
      <path d="M130 36 L131.5 40 L135.5 41 L131.5 42 L130 46 L128.5 42 L124.5 41 L128.5 40 Z" fill="var(--gold)" opacity="0.6" />
      <path d="M68 46 L69 49 L72 50 L69 51 L68 54 L67 51 L64 50 L67 49 Z" fill="var(--gold-light)" opacity="0.5" />

      {/* Candle Jar Body */}
      <rect x="66" y="96" width="68" height="68" rx="8" fill="var(--jar)" stroke="url(#bo-gold)" strokeWidth="1.8" />
      <ellipse cx="100" cy="100" rx="30" ry="4.5" fill="var(--surface-2)" stroke="var(--gold-dark)" strokeWidth="1" />

      {/* Minimal Label */}
      <rect x="80" y="114" width="40" height="26" rx="2" fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
      <text
        x="100"
        y="126"
        textAnchor="middle"
        fontSize="6.5"
        letterSpacing="1"
        fontFamily="DM Sans, sans-serif"
        fill="var(--gold-dark)"
      >
        MOLTEN
      </text>
      <text
        x="100"
        y="133"
        textAnchor="middle"
        fontSize="5.5"
        letterSpacing="0.8"
        fontFamily="DM Sans, sans-serif"
        fill="var(--muted)"
      >
        REST
      </text>

      {/* Shadow Base */}
      <ellipse cx="100" cy="168" rx="46" ry="5" fill="var(--shadow)" opacity="0.35" />
    </svg>
  );
}

/** 4. No Search Results: A glowing magnifying glass revealing a swirl of unpoured wax. */
export function EmptySearchIllustration({ className = 'empty-art' }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="esr-glow" cx="45%" cy="45%" r="50%">
          <stop offset="0%" stopColor="var(--gold-grad-1)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--gold-grad-1)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="esr-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--gold-grad-1)" />
          <stop offset="100%" stopColor="var(--gold-dark)" />
        </linearGradient>
      </defs>

      {/* Background glow */}
      <circle cx="90" cy="85" r="52" fill="url(#esr-glow)" />

      {/* Molten wax pool spiral */}
      <path
        d="M90 85 m -32 0 a 32 32 0 1 0 64 0 a 32 32 0 1 0 -64 0"
        fill="var(--surface-2)"
        stroke="var(--border)"
        strokeWidth="1.2"
      />
      <path
        d="M90 65 C102 65 110 74 110 85 C110 96 100 104 90 104 C78 104 72 94 74 85 C76 77 82 72 90 73 C96 74 98 80 97 85 C96 89 92 91 90 91 C88 91 87 89 88 87"
        stroke="var(--gold)"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />

      {/* Botanicals / scent sparks */}
      <path d="M60 52 C65 54 67 60 65 65 C60 63 58 57 60 52 Z" fill="var(--gold-light)" opacity="0.75" />
      <path d="M125 56 C121 59 121 65 125 68 C128 65 128 59 125 56 Z" fill="var(--gold-light)" opacity="0.75" />
      <circle cx="120" cy="116" r="2" fill="var(--gold)" opacity="0.6" />
      <circle cx="56" cy="100" r="1.5" fill="var(--gold-dark)" opacity="0.6" />

      {/* Magnifying Glass */}
      <circle cx="90" cy="85" r="42" stroke="url(#esr-gold)" strokeWidth="3" fill="none" />
      <circle cx="90" cy="85" r="38" stroke="var(--gold-light)" strokeWidth="1" strokeDasharray="3 4" opacity="0.6" fill="none" />
      {/* Handle */}
      <path d="M120 115 L154 149" stroke="url(#esr-gold)" strokeWidth="6" strokeLinecap="round" />
      <path d="M120 115 L154 149" stroke="var(--gold-light)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />

      {/* Shadow Base */}
      <ellipse cx="100" cy="165" rx="48" ry="5" fill="var(--shadow)" opacity="0.3" />
    </svg>
  );
}
