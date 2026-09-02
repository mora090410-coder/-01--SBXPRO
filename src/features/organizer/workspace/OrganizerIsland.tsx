import React from 'react';
import { Island, IslandRings, Eyebrow, CapsuleButton } from '../../../design/primitives';
import type { OrganizerLifecyclePhase } from '../lifecycle/organizerLifecycle';

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
}

/** Always-dark status island: collapsed rings summarize fill/paid/draw, expanded surfaces the one primary action. */
export default function OrganizerIsland({ filled, paid, drawn, phase, primary, secondary, note }: OrganizerIslandProps) {
  const paidRatio = filled ? paid / filled : 0;
  const rings = [
    { value: filled / 100, caption: `${filled}%`, label: `${filled} of 100 squares filled` },
    { value: paidRatio, caption: `${Math.round(paidRatio * 100)}%`, label: `${paid} of ${filled} paid`, tone: 'gold' as const },
    { value: drawn ? 1 : 0, caption: drawn ? 'Drawn' : 'Draw', label: drawn ? 'Numbers drawn' : 'Numbers not drawn', tone: 'gold' as const },
  ];

  return (
    <Island
      label="Organizer status"
      placement="top"
      collapsed={<IslandRings rings={rings} />}
      expanded={
        <div className="flex flex-col gap-3">
          <Eyebrow>{phase}</Eyebrow>
          {note ? <p className="font-ui text-[14px] text-broadcast-white/70">{note}</p> : null}
          {primary ? (
            <CapsuleButton
              variant="primary"
              className="w-full"
              onClick={primary.onClick}
              disabled={primary.disabled}
            >
              {primary.label}
            </CapsuleButton>
          ) : null}
          {secondary?.length ? (
            <div className="flex flex-col gap-1">
              {secondary.map((action) => (
                <CapsuleButton
                  key={action.label}
                  variant="ghost"
                  onClick={action.onClick}
                  disabled={action.disabled}
                >
                  {action.label}
                </CapsuleButton>
              ))}
            </div>
          ) : null}
        </div>
      }
    />
  );
}
