import React, { useEffect, useId, useRef } from 'react';
import { Glass } from './Glass';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  height?: 'auto' | 'full';
}

/** Bottom sheet dialog. Springs up from the bottom edge; Escape or backdrop closes it. */
export function Sheet({ open, onClose, title, children, height = 'auto' }: SheetProps) {
  const panelRef = useRef<HTMLElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const panel = panelRef.current;
    const firstFocusable = panel?.querySelector<HTMLElement>('input, button, [href], textarea, select, [tabindex]:not([tabindex="-1"])');
    (firstFocusable ?? panel)?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      restoreRef.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key === 'Tab' && panelRef.current) {
      const focusables = Array.from(panelRef.current.querySelectorAll<HTMLElement>('input, button, [href], textarea, select, [tabindex]:not([tabindex="-1"])')).filter((el) => !el.hasAttribute('disabled'));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };

  const heightClass = height === 'full' ? 'h-[calc(100dvh-24px)]' : 'max-h-[85dvh]';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onKeyDown={onKeyDown}>
      <div
        data-testid="sheet-backdrop"
        className="absolute inset-0 bg-ink/60 animate-[sheet-fade_var(--g-dur-state)_var(--g-ease-state)]"
        onClick={onClose}
      />
      <Glass
        as="div"
        padding="none"
        // Glass renders a div; cast the ref through the DOM node
        ref={panelRef as unknown as React.Ref<HTMLElement>}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative w-full max-w-[640px] ${heightClass} overflow-y-auto rounded-b-none animate-[sheet-rise_var(--g-dur-spring)_var(--g-ease-state)] outline-none`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between px-6 pt-4 pb-3 bg-transparent">
          <h2 id={titleId} className="font-ui text-[17px] font-medium text-fg">{title}</h2>
          <button type="button" onClick={onClose} className="font-ui text-[15px] text-fg-2 hover:text-fg rounded-capsule px-3 h-9 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action">Close</button>
        </div>
        <div className="px-6 pb-8">{children}</div>
      </Glass>
    </div>
  );
}
