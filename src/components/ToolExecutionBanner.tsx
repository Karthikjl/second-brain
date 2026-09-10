'use client';

import React, { useState } from 'react';
import {
  CheckSquare,
  StickyNote,
  Flame,
  Calendar,
  Bell,
  Zap,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from 'lucide-react';

interface ToolExecution {
  tool: string;
  args?: any;
  result?: {
    success?: boolean;
    message?: string;
    count?: number;
    tasks?: any[];
    notes?: any[];
    habits?: any[];
    error?: string;
  };
}

interface ToolExecutionBannerProps {
  executions?: ToolExecution[];
  rawCalls?: any;
}

export function ToolExecutionBanner({ executions, rawCalls }: ToolExecutionBannerProps) {
  const [expanded, setExpanded] = useState(false);

  if (!executions && !rawCalls) return null;

  // Normalize execution items: only actual executions or read queries
  const items: ToolExecution[] = executions && executions.length > 0
    ? executions
    : Array.isArray(rawCalls)
    ? rawCalls
        .filter((c: any) => {
          const name = c.function?.name || '';
          return name.startsWith('list_') || name.startsWith('get_');
        })
        .map((c: any) => ({
          tool: c.function?.name || 'tool_action',
          args: typeof c.function?.arguments === 'string' ? JSON.parse(c.function.arguments || '{}') : c.function?.arguments,
        }))
    : [];

  if (items.length === 0) return null;

  function getToolMeta(toolName: string) {
    switch (toolName) {
      case 'create_task':
        return { label: 'Created Task', icon: CheckSquare, color: 'var(--sb-primary)' };
      case 'update_task':
      case 'update_task_status':
        return { label: 'Updated Task', icon: CheckSquare, color: 'var(--sb-primary)' };
      case 'delete_task':
        return { label: 'Deleted Task', icon: CheckSquare, color: 'var(--sb-alert)' };
      case 'list_tasks':
        return { label: 'Queried Tasks', icon: CheckSquare, color: 'var(--sb-primary)' };
      case 'create_note':
        return { label: 'Created Note', icon: StickyNote, color: 'var(--sb-accent-cyan)' };
      case 'update_note':
        return { label: 'Updated Note', icon: StickyNote, color: 'var(--sb-accent-cyan)' };
      case 'delete_note':
        return { label: 'Deleted Note', icon: StickyNote, color: 'var(--sb-alert)' };
      case 'list_notes':
        return { label: 'Searched Notes', icon: StickyNote, color: 'var(--sb-accent-cyan)' };
      case 'create_habit':
        return { label: 'Created Habit', icon: Flame, color: 'var(--sb-accent-orange)' };
      case 'log_habit':
        return { label: 'Logged Habit', icon: Flame, color: 'var(--sb-accent-orange)' };
      case 'unlog_habit':
        return { label: 'Unlogged Habit', icon: Flame, color: 'var(--sb-accent-orange)' };
      case 'list_habits':
        return { label: 'Checked Habits', icon: Flame, color: 'var(--sb-accent-orange)' };
      case 'create_calendar_event':
        return { label: 'Scheduled Event', icon: Calendar, color: 'var(--sb-accent-purple)' };
      case 'update_calendar_event':
        return { label: 'Updated Event', icon: Calendar, color: 'var(--sb-accent-purple)' };
      case 'create_reminder':
        return { label: 'Set Reminder', icon: Bell, color: 'var(--sb-accent-yellow)' };
      case 'complete_reminder':
        return { label: 'Completed Reminder', icon: Bell, color: 'var(--sb-ok)' };
      default:
        return { label: toolName.replace(/_/g, ' '), icon: Zap, color: 'var(--sb-accent-cyan)' };
    }
  }

  return (
    <div className="mb-2.5 space-y-1.5">
      {items.map((exec, idx) => {
        const meta = getToolMeta(exec.tool);
        const Icon = meta.icon;
        const msg = exec.result?.message || (exec.result?.success ? 'Executed successfully' : exec.result?.error);
        const count = exec.result?.count;
        const isListQuery = exec.tool.startsWith('list_');

        return (
          <div
            key={idx}
            className="p-2 rounded-lg border-2 border-[var(--sb-border)] bg-[var(--sb-surface)] shadow-[2px_2px_0px_var(--sb-shadow-color)] text-xs flex flex-col gap-1"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-5 h-5 rounded border border-[var(--sb-border)] flex items-center justify-center shrink-0"
                  style={{ backgroundColor: meta.color, color: '#000' }}
                >
                  <Icon className="w-3 h-3" />
                </div>

                <span className="font-mono font-bold text-[11px] text-[var(--sb-ink)]">
                  ⚡ {meta.label}
                </span>

                {/* Show short result message directly */}
                {msg && !isListQuery && (
                  <span className="text-[11px] text-[var(--sb-muted)] truncate max-w-xs font-medium">
                    — {msg}
                  </span>
                )}

                {/* If list query with multiple items, show compact count */}
                {isListQuery && count !== undefined && (
                  <span className="text-[10px] neo-badge bg-[var(--sb-surface-alt)] font-mono text-[var(--sb-ink)]">
                    {count} items retrieved
                  </span>
                )}
              </div>

              {/* Collapsible toggle for details if arguments or list items exist */}
              {isListQuery && count && count > 0 && (
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="text-[10px] font-bold text-[var(--sb-muted)] hover:text-[var(--sb-ink)] flex items-center gap-0.5"
                >
                  <span>{expanded ? 'Hide' : 'View'}</span>
                  {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>

            {/* If user expands list items */}
            {expanded && isListQuery && (
              <div className="mt-1.5 pt-1.5 border-t border-[var(--sb-border-light)] text-[11px] text-[var(--sb-muted)] font-mono max-h-32 overflow-y-auto space-y-1">
                {exec.result?.tasks?.map((t: any) => (
                  <div key={t.id} className="truncate">
                    • {t.title} {t.status === 'done' ? '✅' : '⏳'}
                  </div>
                ))}
                {exec.result?.notes?.map((n: any) => (
                  <div key={n.id} className="truncate">
                    • {n.content?.slice(0, 50)}...
                  </div>
                ))}
                {exec.result?.habits?.map((h: any) => (
                  <div key={h.id} className="truncate">
                    • {h.title} (Streak: {h.streak || 0} 🔥)
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
