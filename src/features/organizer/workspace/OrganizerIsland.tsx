import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { DUR_SPRING } from '../../../design/primitives/motion';
import { CapsuleButton } from '../../../design/primitives';
import type { OrganizerLifecyclePhase } from '../lifecycle/organizerLifecycle';
import { buildOrganizerIslandSummary } from './organizerIslandModel';
import './organizerIsland.css';

interface OrganizerIslandAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export interface OrganizerIslandProps {
  filled: number;
  paid: number;
  drawn: boolean;
  phase: OrganizerLifecyclePhase;
  primary: OrganizerIslandAction | null;
  secondary?: OrganizerIslandAction[];
  note?: string;
  /** Retained for the homepage example; text summaries have no entry animation. */
  growOnEnter?: boolean;
  unpaid?: number;
  unknown?: number;
  saveStatus?: string;
  isShared?: boolean;
  isPublished?: boolean;
  activeTask?: 'board' | 'payments';
  liveSummary?: string;
  liveTrust?: string;
  pollingText?: string;
  isFinal?: boolean;
  hasBlocker?: boolean;
  onPayments?: () => void;
  onFindPerson?: () => void;
  onShowUnassigned?: () => void;
  onReviewIssue?: () => void;
  disabled?: boolean;
}

/** Nonmodal disclosure in a reserved strip; its single surface changes size, never scales text. */
export default function OrganizerIsland(props: OrganizerIslandProps) {
  const [open, setOpen] = useState(false);
  const [triggerHeight, setTriggerHeight] = useState<number>();
  const surface = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const hold = useRef<{ timer: ReturnType<typeof setTimeout>; x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const cancelHold = () => {
    if (hold.current) clearTimeout(hold.current.timer);
    hold.current = null;
  };
  useEffect(() => cancelHold, []);
  const startHold = (event: React.PointerEvent) => {
    cancelHold();
    suppressClick.current = false;
    if (event.pointerType !== 'touch' || open || props.disabled) return;
    hold.current = {
      x: event.clientX, y: event.clientY,
      timer: setTimeout(() => {
        hold.current = null;
        suppressClick.current = true;
        setOpen(true);
      }, DUR_SPRING),
    };
  };
  const moveHold = (event: React.PointerEvent) => {
    if (hold.current && Math.hypot(event.clientX - hold.current.x, event.clientY - hold.current.y) > 10) cancelHold();
  };
  const id = useId();
  const summary = buildOrganizerIslandSummary(props);

  useLayoutEffect(() => {
    const button = trigger.current;
    if (open || !button || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => setTriggerHeight(button.getBoundingClientRect().height));
    observer.observe(button);
    return () => observer.disconnect();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !surface.current?.contains(event.target)) {
        if (surface.current?.contains(document.activeElement)) trigger.current?.focus();
        setOpen(false);
      }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setOpen(false);
      trigger.current?.focus();
    };
    const focusOutside = (event: FocusEvent) => {
      if (event.target instanceof Node && !surface.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    document.addEventListener('focusin', focusOutside);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape);
      document.removeEventListener('focusin', focusOutside);
    };
  }, [open]);

  const invoke = (callback: () => void) => {
    // Sheets capture this persistent toggle as their return target, not a hidden action.
    trigger.current?.focus();
    flushSync(() => setOpen(false));
    callback();
  };
  const primary = summary.issue && props.onReviewIssue
    ? { label: 'Review issue', onClick: props.onReviewIssue }
    : props.primary;
  const shortcuts = [
    { label: 'Payments', onClick: props.onPayments },
    { label: 'Find a person', onClick: props.onFindPerson },
    { label: 'Show unassigned', onClick: props.onShowUnassigned },
  ].filter((action): action is { label: string; onClick: () => void } => Boolean(action.onClick));

  return (
    <section className="organizer-island-strip" aria-label="Organizer status" style={triggerHeight ? { minHeight: `calc(${triggerHeight}px + 1rem)` } : undefined}>
      <div ref={surface} className="organizer-island" data-base="dark" data-open={open}>
        <button ref={trigger} type="button" className="organizer-island-toggle"
          aria-label="Organizer status" aria-describedby={`${id}-summary`} aria-expanded={open} aria-controls={id}
          disabled={props.disabled}
          onPointerDown={startHold} onPointerMove={moveHold} onPointerUp={cancelHold} onPointerCancel={cancelHold} onPointerLeave={cancelHold}
          onClick={() => {
            if (suppressClick.current) { suppressClick.current = false; return; }
            setOpen((value) => !value);
          }}>
          <span id={`${id}-summary`} className="organizer-island-summary" role="status" aria-live="polite" aria-atomic="true">
            <span className="organizer-island-label">{summary.label}</span>
            <span className="organizer-island-detail">{open ? 'Close details' : summary.detail}</span>
          </span>
          <span className="organizer-island-chevron" aria-hidden="true">⌄</span>
        </button>
        <div className="organizer-island-reveal" aria-hidden={!open} inert={!open}>
          <div className="organizer-island-clip">
            <div id={id} className="organizer-island-content" role="region" aria-label="Board details">
              <div className="organizer-island-overview">
                <p>{props.phase}</p>
                <p>{summary.saveLabel}</p>
              </div>
              <p className="organizer-island-total">{props.filled} of 100 assigned</p>
              <div className="organizer-island-counts" aria-label="Payment status by square">
                <span>{props.paid} paid</span><span>{summary.unpaid} unpaid</span><span>{summary.unknown} not asked yet</span>
              </div>
              <p className="organizer-island-detail">Payment notes are private. Counts are squares.</p>
              {props.liveTrust && <p>{props.liveTrust}</p>}
              {props.pollingText && <p className="organizer-island-detail">{props.pollingText}</p>}
              {props.note && <p className="organizer-island-note">{props.note}</p>}
              {primary && <CapsuleButton variant="primary" className="w-full" disabled={props.disabled || primary.disabled} onClick={() => invoke(primary.onClick)}>{primary.label}</CapsuleButton>}
              {shortcuts.length > 0 && <div className="organizer-island-shortcuts">{shortcuts.map((action) => <CapsuleButton key={action.label} variant="ghost" onClick={() => invoke(action.onClick)}>{action.label}</CapsuleButton>)}</div>}
              {props.secondary?.map((action) => <CapsuleButton key={action.label} variant="ghost" disabled={action.disabled} onClick={() => invoke(action.onClick)}>{action.label}</CapsuleButton>)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
