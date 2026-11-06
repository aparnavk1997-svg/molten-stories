import { useLayoutEffect, useRef } from 'react';

// Fades an element up once it scrolls into view. Skips entirely (content stays visible)
// when IntersectionObserver is missing or the user prefers reduced motion.
export function useReveal() {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.classList.add('reveal');
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.classList.add('in-view');
        io.disconnect();
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

export default function Reveal({ as: Tag = 'div', children, ...rest }) {
  const ref = useReveal();
  return (
    <Tag ref={ref} {...rest}>
      {children}
    </Tag>
  );
}
