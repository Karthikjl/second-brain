'use client';

import React from 'react';
import { Plus } from 'lucide-react';

type GhostVariant = 'list' | 'habit' | 'grid';

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  /** Shape of the faded placeholder items drawn behind the message. */
  variant?: GhostVariant;
  actionLabel?: string;
  onAction?: () => void;
}

// Static (non-pulsing) so it reads as "nothing here yet", not "still loading".
const ghostLine = 'rounded bg-[var(--sb-muted)] opacity-[0.18]';
const ghostItem =
  'rounded-[var(--sb-radius)] border-2 border-dashed border-[var(--sb-border-light)] bg-[var(--sb-surface)]';

// Widths vary per row so the ghosts look like real content, not a stripe pattern.
const ROW_WIDTHS = ['w-2/5', 'w-1/3', 'w-1/2', 'w-1/4', 'w-2/5', 'w-1/3', 'w-1/2', 'w-1/4', 'w-2/5', 'w-1/3'];

function GhostRows({ variant }: { variant: GhostVariant }) {
  if (variant === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ROW_WIDTHS.slice(0, 9).map((w, i) => (
          <div key={i} className={`${ghostItem} p-5 h-40 space-y-3`}>
            <div className={`${ghostLine} h-3 ${w}`} />
            <div className={`${ghostLine} h-2.5 w-full`} />
            <div className={`${ghostLine} h-2.5 w-5/6`} />
            <div className={`${ghostLine} h-2.5 w-2/3`} />
            <div className="flex gap-2 pt-2">
              <div className={`${ghostLine} h-4 w-12`} />
              <div className={`${ghostLine} h-4 w-10`} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {ROW_WIDTHS.map((w, i) => (
        <div key={i} className={`${ghostItem} p-4 flex items-center justify-between gap-4`}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {variant === 'list' && <div className={`${ghostLine} w-5 h-5 shrink-0`} />}
            <div className="space-y-2 flex-1">
              <div className={`${ghostLine} h-3 ${w}`} />
              <div className={`${ghostLine} h-2.5 w-1/5`} />
            </div>
          </div>
          {variant === 'habit' ? (
            <div className="hidden sm:flex items-center gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                <div key={d} className={`${ghostLine} w-8 h-8`} />
              ))}
            </div>
          ) : (
            <div className={`${ghostLine} h-6 w-20 shrink-0`} />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Full-height empty state: faded placeholder items shaped like the page's real
 * content fill the remaining space, with the message and primary action on top.
 * Parent must be a flex column (the page root) for flex-1 to fill the screen.
 */
export function EmptyState({ icon: Icon, title, description, variant = 'list', actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="relative flex-1 min-h-[360px] overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none select-none"
        style={{
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.9), rgba(0,0,0,0.35) 60%, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.9), rgba(0,0,0,0.35) 60%, transparent)',
        }}
      >
        <GhostRows variant={variant} />
      </div>

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="neo-box bg-[var(--sb-surface)] px-8 py-7 text-center max-w-sm w-full">
          <Icon className="w-10 h-10 text-[var(--sb-muted)] mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-[var(--sb-ink)]">{title}</h3>
          <p className="text-xs text-[var(--sb-muted)] mt-1">{description}</p>
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="neo-btn neo-btn-primary text-xs py-2 px-4 mt-4 shadow-[2px_2px_0px_var(--sb-shadow-color)]"
            >
              <Plus className="w-4 h-4" />
              <span>{actionLabel}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
