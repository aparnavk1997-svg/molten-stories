export default function CandleImage({ color, label }) {
  const id = color.slice(1);
  return (
    <svg
      viewBox="0 0 200 220"
      role="img"
      aria-label={label}
      className="candle-img"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id={`halo-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={{ stopColor: 'var(--gold-grad-1)' }} stopOpacity="0.55" />
          <stop offset="100%" style={{ stopColor: 'var(--gold-grad-1)' }} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`gold-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" style={{ stopColor: 'var(--gold-grad-1)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--gold-grad-2)' }} />
        </linearGradient>
        <linearGradient id={`glass-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="35%" stopColor="#ffffff" stopOpacity="0.02" />
          <stop offset="100%" style={{ stopColor: 'var(--glass-end)' }} stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id={`wax-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.95" />
          <stop offset="100%" stopColor={color} stopOpacity="0.55" />
        </linearGradient>
      </defs>

      {/* halo */}
      <circle className="candle-halo" cx="100" cy="70" r="66" fill={`url(#halo-${id})`} />

      {/* flame */}
      <path className="candle-flame-outer" d="M100 30 C113 52 113 68 100 80 C87 68 87 52 100 30 Z" fill={`url(#gold-${id})`} />
      <path className="candle-flame-inner" d="M100 50 C106 60 106 70 100 76 C94 70 94 60 100 50 Z" fill="#fff3cf" fillOpacity="0.85" />

      {/* wick */}
      <rect x="98.5" y="78" width="3" height="16" rx="1.5" style={{ fill: 'var(--wick)' }} />

      {/* jar */}
      <rect x="48" y="92" width="104" height="100" rx="12" style={{ fill: 'var(--jar)' }} stroke={`url(#gold-${id})`} strokeWidth="2" />
      {/* wax */}
      <rect x="54" y="98" width="92" height="88" rx="8" fill={`url(#wax-${id})`} />
      <rect x="54" y="98" width="92" height="88" rx="8" fill={`url(#glass-${id})`} />
      {/* wax top rim */}
      <ellipse cx="100" cy="98" rx="46" ry="4" fill="#ffffff" fillOpacity="0.18" />

      {/* label */}
      <rect x="72" y="126" width="56" height="34" rx="2" style={{ fill: 'var(--jar-label)' }} stroke={`url(#gold-${id})`} strokeWidth="1" />
      <path d="M92 134 L100 128 L108 134" fill="none" stroke={`url(#gold-${id})`} strokeWidth="1.2" />
      <text
        x="100" y="146" textAnchor="middle" fontSize="6.5" letterSpacing="1.2"
        fontFamily="DM Sans, sans-serif" style={{ fill: 'var(--jar-text)' }}
      >MOLTEN</text>
      <text
        x="100" y="154" textAnchor="middle" fontSize="6.5" letterSpacing="1.2"
        fontFamily="DM Sans, sans-serif" style={{ fill: 'var(--jar-text)' }}
      >STORIES</text>

      {/* reflection / shadow */}
      <ellipse cx="100" cy="202" rx="56" ry="5" style={{ fill: 'var(--gold-grad-1)' }} fillOpacity="0.18" />
    </svg>
  );
}
