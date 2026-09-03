import React from 'react';
import { Glass } from '../../../design/primitives';

const SHELL_WIDTH = 300;
const DEVICE_WIDTH = 390;

export interface PhoneFrameProps {
  children?: React.ReactNode;
  /** Visually hidden sentence describing the picture for anyone who cannot see it. */
  caption: string;
  className?: string;
  /**
   * `phone` crops a 390x780 device render into a 300px shell.
   * `auto` drops the crop for a single component that should stand at its own height.
   */
  aspect?: 'phone' | 'auto';
}

/**
 * A real component rendered as a picture: the inner region is `inert` and `aria-hidden`,
 * so nothing inside can be clicked, focused, or read, and the caption carries the meaning.
 *
 * The frame lifts slightly on hover. The lift is a transform, so it is behind
 * `motion-safe:` and never runs under `prefers-reduced-motion: reduce`; the
 * deeper shadow is a color change and stays. `transitionProperty` is set inline
 * because `Glass` already declares one and inline style settles the cascade.
 */
export function PhoneFrame({ children, caption, className = '', aspect = 'phone' }: PhoneFrameProps) {
  if (aspect === 'auto') {
    return (
      <Glass
        as="figure"
        padding="lg"
        style={{ transitionProperty: 'background-color, transform, box-shadow' }}
        className={`w-full max-w-[390px] min-h-[220px] overflow-hidden rounded-[32px] motion-safe:hover:-translate-y-1 hover:shadow-[0_28px_64px_-28px_rgba(0,0,0,0.75)] duration-[var(--g-dur-state)] ease-[var(--g-ease-state)] ${className}`.trim()}
      >
        <div inert aria-hidden="true" className="min-h-[220px]">{children}</div>
        <figcaption className="sr-only">{caption}</figcaption>
      </Glass>
    );
  }

  return (
    <Glass
      as="figure"
      padding="none"
      style={{ transitionProperty: 'background-color, transform, box-shadow' }}
      className={`w-[300px] max-w-full aspect-[390/780] overflow-hidden rounded-[32px] motion-safe:hover:-translate-y-1 hover:shadow-[0_28px_64px_-28px_rgba(0,0,0,0.75)] duration-[var(--g-dur-state)] ease-[var(--g-ease-state)] ${className}`.trim()}
    >
      <div
        inert
        aria-hidden="true"
        style={{ width: DEVICE_WIDTH, height: 780, transform: `scale(${SHELL_WIDTH / DEVICE_WIDTH})`, transformOrigin: 'top left' }}
      >
        {children}
      </div>
      <figcaption className="sr-only">{caption}</figcaption>
    </Glass>
  );
}
