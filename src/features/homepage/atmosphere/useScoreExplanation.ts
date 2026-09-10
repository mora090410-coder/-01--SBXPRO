import { useEffect, useRef } from 'react';
import type { gsap } from 'gsap';

/** One optional, local animation. Text and the matching result are always finished HTML. */
export function useScoreExplanation() {
  const ref = useRef<HTMLDivElement>(null);
  const played = useRef(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preference.matches || typeof IntersectionObserver === 'undefined' || played.current) {
      node.dataset.animation = 'static';
      return;
    }
    let active = true;
    let context: gsap.Context | undefined;
    node.dataset.animation = 'idle';
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting) || played.current) return;
      played.current = true;
      observer.disconnect();
      void import('gsap').then(({ gsap }) => {
        if (!active || preference.matches) return;
        context = gsap.context(() => {
          node.dataset.animation = 'playing';
          gsap.timeline({ onComplete: () => { if (active) node.dataset.animation = 'complete'; } })
            .fromTo('[data-score-accent]', { scaleX: 0 }, { scaleX: 1, duration: 0.45, stagger: 0.12, ease: 'power1.out' })
            .fromTo('[data-score-trace]', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.45, stagger: 0.15, ease: 'power1.out' })
            .fromTo('[data-match-accent]', { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'power1.out' });
        }, node);
      }).catch(() => { if (active) node.dataset.animation = 'static'; });
    }, { threshold: 0.2 });
    const stop = () => {
      if (!preference.matches) return;
      observer.disconnect();
      context?.revert();
      context = undefined;
      node.dataset.animation = 'static';
    };
    preference.addEventListener('change', stop);
    observer.observe(node);
    return () => {
      active = false;
      observer.disconnect();
      preference.removeEventListener('change', stop);
      context?.revert();
    };
  }, []);
  return ref;
}
