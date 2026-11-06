// Animated line-art for the "How a candle is made" section on the Our story page.
// Every scene's resting state (no animation) is its finished state, so reduced-motion users see a complete drawing.
// Colours come from CSS (see .ms-* in index.css) so the art follows the light/dark theme.

const JAR_BODY = 'M100 150 V306 Q100 330 124 330 H196 Q220 330 220 306 V150';
const JAR_FILL = 'M100 150 H220 V306 Q220 330 196 330 H124 Q100 330 100 306 Z';
const RIM = 'M92 150 H228';

function Defs({ id }) {
  return (
    <defs>
      <clipPath id={`${id}-jar`}>
        <path d={JAR_FILL} />
      </clipPath>
      <linearGradient id={`${id}-wax`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style={{ stopColor: 'var(--gold-light)' }} />
        <stop offset="1" style={{ stopColor: 'var(--gold)' }} />
      </linearGradient>
      <radialGradient id={`${id}-glow`}>
        <stop offset="0" style={{ stopColor: 'var(--gold-light)', stopOpacity: 0.55 }} />
        <stop offset="1" style={{ stopColor: 'var(--gold-light)', stopOpacity: 0 }} />
      </radialGradient>
    </defs>
  );
}

const PETALS = [0, 72, 144, 216, 288];

/** 1. Design: a bloom sketched line by line, with faint construction lines. */
export function DesignScene() {
  return (
    <svg className="ms" viewBox="0 0 320 380" aria-hidden="true" focusable="false">
      <g className="ms-guide">
        <circle cx="160" cy="150" r="104" />
        <path d="M44 150 H276 M160 34 V266" />
      </g>
      {PETALS.map((deg, i) => (
        <g key={deg} transform={`rotate(${deg} 160 150)`}>
          <path
            className="ms-line ms-draw ms-petal"
            pathLength="1"
            style={{ '--i': i }}
            d="M160 150 C136 112 142 72 160 54 C178 72 184 112 160 150 Z"
          />
        </g>
      ))}
      <circle className="ms-dot ms-pop" style={{ '--i': 5 }} cx="160" cy="150" r="7" />
      <path className="ms-line ms-draw" pathLength="1" style={{ '--i': 6 }} d="M160 160 C160 232 152 292 160 348" />
      <path
        className="ms-line ms-draw ms-petal"
        pathLength="1"
        style={{ '--i': 8 }}
        d="M158 252 C130 242 118 220 120 208 C142 212 156 230 158 252 Z"
      />
      <path
        className="ms-line ms-draw ms-petal"
        pathLength="1"
        style={{ '--i': 9 }}
        d="M159 296 C187 286 201 266 199 254 C177 258 161 274 159 296 Z"
      />
    </svg>
  );
}

/** 2. Pour: molten wax runs from a pot into the jar and the level rises. */
export function PourScene() {
  return (
    <svg className="ms" viewBox="0 0 320 380" aria-hidden="true" focusable="false">
      <Defs id="pour" />
      <g className="ms-line">
        <path d="M112 34 H208 L176 80 H144 Z" />
        <path d="M208 46 H238 Q252 46 252 60 Q252 72 238 72 H196" />
      </g>
      <path className="ms-wax ms-pot" d="M124 42 H196 L172 72 H148 Z" fill="url(#pour-wax)" />
      <rect className="ms-stream" x="157" y="80" width="6" height="250" rx="3" fill="url(#pour-wax)" />
      <g clipPath="url(#pour-jar)">
        <g className="ms-level">
          <rect x="100" y="190" width="120" height="150" fill="url(#pour-wax)" />
          <ellipse className="ms-surface" cx="160" cy="190" rx="60" ry="5" />
        </g>
      </g>
      <path className="ms-line" d={JAR_BODY} />
      <path className="ms-line" d={RIM} />
    </svg>
  );
}

/** 3. Set: the wax cools and settles; a little warmth drifts away. */
export function SetScene() {
  return (
    <svg className="ms" viewBox="0 0 320 380" aria-hidden="true" focusable="false">
      <Defs id="set" />
      <ellipse className="ms-heat" cx="160" cy="250" rx="130" ry="130" fill="url(#set-glow)" />
      <g clipPath="url(#set-jar)">
        <g className="ms-cool">
          <rect x="100" y="190" width="120" height="150" fill="url(#set-wax)" />
          <ellipse className="ms-surface" cx="160" cy="190" rx="60" ry="5" />
        </g>
      </g>
      <path className="ms-line" d={JAR_BODY} />
      <path className="ms-line" d={RIM} />
      <path className="ms-line ms-draw" pathLength="1" style={{ '--i': 0 }} d="M160 190 V160" />
      <g className="ms-steam">
        <path className="ms-wisp" style={{ '--i': 0 }} d="M140 138 C128 118 152 104 140 84 C132 70 144 60 140 48" />
        <path className="ms-wisp" style={{ '--i': 1 }} d="M164 130 C152 110 176 96 164 76 C156 62 168 52 164 40" />
        <path className="ms-wisp" style={{ '--i': 2 }} d="M186 138 C174 118 198 104 186 84 C178 70 190 60 186 48" />
      </g>
    </svg>
  );
}

const STARS = [
  { x: 76, y: 178, s: 1, i: 0 },
  { x: 250, y: 214, s: 0.8, i: 1 },
  { x: 208, y: 104, s: 1.15, i: 2 },
];

/** 4. Finish: the wick is trimmed, a ribbon is tied, and the candle catches the light. */
export function FinishScene() {
  return (
    <svg className="ms" viewBox="0 0 320 380" aria-hidden="true" focusable="false">
      <Defs id="fin" />
      <g clipPath="url(#fin-jar)">
        <g className="ms-set">
          <rect x="100" y="190" width="120" height="150" fill="url(#fin-wax)" />
          <ellipse className="ms-surface" cx="160" cy="190" rx="60" ry="5" />
        </g>
        <rect className="ms-band" style={{ '--i': 1 }} x="100" y="238" width="120" height="16" />
      </g>
      <path className="ms-line" d={JAR_BODY} />
      <path className="ms-line" d={RIM} />
      <path className="ms-line" d="M160 190 V170" />
      <g className="ms-line">
        <path className="ms-draw" pathLength="1" style={{ '--i': 1 }} d="M100 238 H220" />
        <path className="ms-draw" pathLength="1" style={{ '--i': 1 }} d="M100 254 H220" />
        <path className="ms-draw" pathLength="1" style={{ '--i': 3 }} d="M160 246 C140 214 108 226 122 246 C130 257 150 253 160 246" />
        <path className="ms-draw" pathLength="1" style={{ '--i': 4 }} d="M160 246 C180 214 212 226 198 246 C190 257 170 253 160 246" />
        <path className="ms-draw" pathLength="1" style={{ '--i': 5 }} d="M158 250 C152 270 150 282 142 298" />
        <path className="ms-draw" pathLength="1" style={{ '--i': 5 }} d="M162 250 C168 270 170 282 178 298" />
      </g>
      <circle className="ms-dot ms-pop" style={{ '--i': 6 }} cx="160" cy="246" r="5" />
      {STARS.map((st) => (
        <g key={st.i} transform={`translate(${st.x} ${st.y}) scale(${st.s})`}>
          <path
            className="ms-star"
            style={{ '--i': st.i }}
            d="M0 -10 Q1.6 -1.6 10 0 Q1.6 1.6 0 10 Q-1.6 1.6 -10 0 Q-1.6 -1.6 0 -10 Z"
          />
        </g>
      ))}
    </svg>
  );
}

export const SCENES = [DesignScene, PourScene, SetScene, FinishScene];
