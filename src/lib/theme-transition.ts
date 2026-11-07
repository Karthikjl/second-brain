'use client';

import { flushSync } from 'react-dom';

export type Theme = 'light' | 'dark';

const DURATION_MS = 550;

// A second click during the animation would compute `next` from the not-yet-updated
// theme and land on the wrong one, so clicks are ignored until the switch finishes.
let switching = false;

/**
 * Switches the theme with a circle that grows out of the toggle button and
 * reveals the new theme over the whole page (View Transitions API).
 *
 * Falls back to an instant switch when the browser has no View Transitions
 * support or the user prefers reduced motion.
 *
 * @param next        theme to switch to
 * @param origin      element the circle grows from (usually the toggle button)
 * @param updateState React state update for the new theme; run synchronously
 *                    inside the transition so the "after" snapshot is correct
 */
export function switchTheme(next: Theme, origin: HTMLElement | null, updateState: () => void) {
  const apply = () => {
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      // storage unavailable (private mode) — theme still applies for this page
    }
    flushSync(updateState);
    window.dispatchEvent(new Event('theme-change'));
  };

  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> };
  };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!doc.startViewTransition || reduceMotion) {
    apply();
    return;
  }

  // Circle centre = middle of the toggle button (works for mouse and keyboard).
  const rect = origin?.getBoundingClientRect();
  const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
  const y = rect ? rect.top + rect.height / 2 : 0;
  // Radius that reaches the farthest corner of the viewport.
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

  // Stop per-element colour transitions so the new snapshot shows final colours.
  if (switching) return;
  switching = true;

  const root = document.documentElement;
  root.classList.add('theme-switching');

  const transition = doc.startViewTransition(apply);

  transition.ready
    .then(() => {
      root.animate(
        {
          clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
        },
        {
          duration: DURATION_MS,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    })
    .catch(() => {
      // transition skipped — theme was still applied by the callback
    });

  transition.finished.finally(() => {
    root.classList.remove('theme-switching');
    switching = false;
  });
}
