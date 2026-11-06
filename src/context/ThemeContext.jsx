import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const KEY = 'molten-stories-theme';
const ThemeContext = createContext(null);
let animTimer;
let glowTimer;

function readInitial() {
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readInitial);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#1a1511' : '#f8f4ed');
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* storage unavailable */
    }
  }, [theme]);

  const toggle = useCallback(() => {
    // Briefly enable colour transitions so the whole page fades between themes.
    const root = document.documentElement;
    root.classList.add('theme-anim');
    clearTimeout(animTimer);
    animTimer = setTimeout(() => root.classList.remove('theme-anim'), 450);
    // Lighting the candle (dark -> light) also plays a warm glow across the page.
    if (theme === 'dark') {
      root.classList.remove('theme-lighting');
      void root.offsetWidth; // restart the animation if toggled quickly
      root.classList.add('theme-lighting');
      clearTimeout(glowTimer);
      glowTimer = setTimeout(() => root.classList.remove('theme-lighting'), 1200);
    }
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
