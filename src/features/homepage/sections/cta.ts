const geometry = 'inline-flex items-center justify-center h-11 px-6 rounded-capsule font-ui text-[15px] transition-[background-color,color] duration-[var(--g-dur-state)] ease-[var(--g-ease-state)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-ground';

export const primaryLink = `${geometry} bg-action text-action-text font-semibold hover:bg-action-hover`;
export const quietLink = `${geometry} bg-panel border border-hairline text-fg hover:bg-panel-hover`;
export const ghostLink = 'inline-flex items-center h-11 px-2 font-ui text-[15px] text-fg-2 hover:text-fg underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action rounded-control';
