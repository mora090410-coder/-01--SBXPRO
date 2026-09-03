import React, { useLayoutEffect, useRef } from 'react';
import { useReducedMotion } from './motion';

export interface RevealProps {
  children: React.ReactNode;
  /** Element to render. Defaults to `div`. */
  as?: React.ElementType;
  /** Stagger, in milliseconds. Becomes `transition-delay`. */
  delay?: number;
  className?: string;
}

/**
 * Rise-and-fade on scroll entry, with a VISIBLE resting state.
 *
 * The rendered markup carries no `data-reveal` attribute, so the CSS in
 * `tokens.css` gives it no transition, no transform, and no opacity change.
 * That is the state a server render, a no-JS browser, and a browser without
 * `IntersectionObserver` all see: finished content, immediately.
 *
 * The hidden `pending` state is applied only from `useLayoutEffect`, which runs
 * before paint, and only when `prefers-reduced-motion` is not `reduce` and an
 * observer exists. So there is no flash of hidden content and no flash of
 * content that then hides. The reduced-motion CSS block neutralizes `pending`
 * as a second guard, in case the preference flips after the attribute is set.
 */
export function Reveal({ children, as: Tag = 'div', delay = 0, className = '' }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    // No motion allowed, or no observer to drive it: stay in the visible
    // resting state and carry no attribute at all.
    if (reduced || typeof IntersectionObserver === 'undefined') {
      node.removeAttribute('data-reveal');
      return;
    }

    node.setAttribute('data-reveal', 'pending');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            node.setAttribute('data-reveal', 'in');
            observer.disconnect();
            return;
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reduced]);

  const Element = Tag as React.ElementType;
  return (
    <Element
      ref={ref as React.Ref<never>}
      className={className || undefined}
      style={delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Element>
  );
}
