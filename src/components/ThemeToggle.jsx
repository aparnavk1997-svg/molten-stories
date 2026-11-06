import { useTheme } from '../context/ThemeContext';

/** Candle toggle: lit = light theme, blown out = dark theme. */
export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const lit = theme !== 'dark';
  const label = lit ? 'Blow out the candle (switch to dark theme)' : 'Light the candle (switch to light theme)';
  return (
    <button
      type="button"
      className={`theme-toggle ${lit ? 'is-lit' : 'is-out'}`}
      onClick={toggle}
      aria-pressed={lit}
      aria-label={label}
      title={label}
    >
      <svg
        viewBox="0 0 24 24"
        className="tt-candle"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="tt-flame-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f7d27a" />
            <stop offset="100%" stopColor="#d98f3a" />
          </linearGradient>
        </defs>
        <rect x="8.5" y="13" width="7" height="8.5" rx="1.2" />
        <path d="M12 13v-1.8" />
        <path className="tt-smoke" d="M12 10.5c-1.3-1.4 1.3-2.4 0-4.2" />
        <path
          className="tt-flame"
          d="M12 3.2c1.9 2.3 2.7 3.8 2.7 5.2a2.7 2.7 0 0 1-5.4 0c0-1.4.8-2.9 2.7-5.2z"
          fill="url(#tt-flame-g)"
          stroke="none"
        />
      </svg>
    </button>
  );
}
