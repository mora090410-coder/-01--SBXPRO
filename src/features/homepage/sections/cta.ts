// Shared control feel. Every focus-visible ring here is load-bearing: `[data-base]`
// strips the global outline, so these rings are the only focus affordance.
// Transform-based lifts are wrapped in `motion-safe:` so they never run under
// `prefers-reduced-motion: reduce`; color, shadow, and underline states stay on.
const geometry = 'inline-flex items-center justify-center h-11 px-6 rounded-capsule font-ui text-[15px] transition-[background-color,color,box-shadow,transform] duration-[var(--g-dur-state)] ease-[var(--g-ease-state)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-ground';

const press = 'motion-safe:hover:-translate-y-px motion-safe:active:translate-y-0 motion-safe:active:scale-[0.98]';

export const primaryLink = `${geometry} bg-action text-action-text font-semibold hover:bg-action-hover hover:shadow-[0_8px_24px_-8px_var(--g-gold)] ${press}`;
export const quietLink = `${geometry} bg-panel border border-hairline text-fg hover:bg-panel-hover hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)] ${press}`;
// Underline wipe: a 1px currentColor gradient grown left-to-right via background-size,
// not text-decoration. Under reduced motion the transition collapses to the reduced
// duration token, so the underline still appears on hover — state on, motion off.
export const ghostLink = 'inline-flex items-center h-11 px-2 font-ui text-[15px] text-fg-2 hover:text-fg bg-[linear-gradient(currentColor,currentColor)] bg-no-repeat bg-[length:0%_1px] bg-[position:0_calc(100%-12px)] hover:bg-[length:100%_1px] transition-[background-size,color] duration-[var(--g-dur-state)] ease-[var(--g-ease-state)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action rounded-control';
