/** Restarts the bump animation on the Bag link (CSS reacts to the data-bump attribute). */
function bump(el) {
  el.removeAttribute('data-bump');
  void el.offsetWidth; // force a reflow so the animation can replay
  el.setAttribute('data-bump', '');
  setTimeout(() => el.removeAttribute('data-bump'), 600);
}

/**
 * Glides a copy of `source` (a product photo) to the header's Bag link, or to the menu button
 * when the Bag link is hidden (mobile). Resolves true when the copy has landed, or false straight
 * away when there is nothing to animate (reduced motion, no source, no visible target).
 * The copy is made synchronously, so it is safe to close or hide the source right after calling.
 */
export function flyToBag(source) {
  if (!source || typeof source.animate !== 'function') return Promise.resolve(false);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return Promise.resolve(false);

  let target = document.querySelector('[data-bag-target]');
  if (!target || !target.getBoundingClientRect().width) target = document.querySelector('.menu-toggle');
  if (!target) return Promise.resolve(false);

  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  if (!from.width || !from.height || !to.width) return Promise.resolve(false);

  const ghost = source.cloneNode(true);
  ghost.removeAttribute('id');
  ghost.setAttribute('aria-hidden', 'true');
  Object.assign(ghost.style, {
    position: 'fixed', left: `${from.left}px`, top: `${from.top}px`,
    width: `${from.width}px`, height: `${from.height}px`, margin: '0',
    zIndex: '1000', pointerEvents: 'none', objectFit: 'cover',
    borderRadius: '8px', boxShadow: '0 12px 30px -10px rgba(0,0,0,0.45)', transformOrigin: 'center',
  });
  document.body.appendChild(ghost);

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const end = Math.min(0.14, 30 / from.width);

  return new Promise((resolve) => {
    const finish = () => {
      ghost.remove();
      bump(target);
      resolve(true);
    };
    const anim = ghost.animate(
      [
        { transform: 'translate(0, 0) scale(1)', opacity: 1, borderRadius: '8px' },
        { transform: `translate(${dx * 0.55}px, ${dy * 0.55}px) scale(0.5)`, opacity: 0.95, offset: 0.55 },
        { transform: `translate(${dx}px, ${dy}px) scale(${end})`, opacity: 0.25, borderRadius: '50%' },
      ],
      { duration: 700, easing: 'cubic-bezier(.55,.05,.25,1)', fill: 'forwards' }
    );
    anim.onfinish = finish;
    anim.oncancel = finish;
  });
}
