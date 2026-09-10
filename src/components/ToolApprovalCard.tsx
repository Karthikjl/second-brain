'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  X,
  Check,
  RefreshCw,
  Edit3,
  Trash2,
  Calendar,
  Clock,
  Flame,
  CheckSquare,
  StickyNote,
  Tag,
  Hash,
  MapPin,
  Target,
  ArrowRight,
} from 'lucide-react';

export interface PendingToolApproval {
  id: string;
  tool: string;
  args: any;
  status: 'pending' | 'executing' | 'approved' | 'rejected';
  result?: any;
  target_title?: string;
  target_id?: string;
  current_status?: string;
  current_due_at?: string;
  current_urgent?: number | boolean;
  current_important?: number | boolean;
  current_content?: string;
  current_target_per_week?: number;
}

interface ToolApprovalCardProps {
  approvals: PendingToolApproval[];
  onApprove: (approval: PendingToolApproval) => Promise<void>;
  onReject: (approvalId: string) => void;
}

export function ToolApprovalCard({
  approvals,
  onApprove,
  onReject,
}: ToolApprovalCardProps) {
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  if (!approvals || approvals.length === 0) return null;

  function getActionMeta(toolName: string, args: any = {}) {
    if (toolName.includes('task')) {
      if (toolName.includes('delete')) return { label: 'Delete Task', icon: Trash2, color: 'var(--sb-alert)' };
      if (toolName.includes('update')) {
        if (args.status === 'done' || args.status === 'completed') {
          return { label: 'Complete Task', icon: CheckCircle2, color: 'var(--sb-ok)' };
        }
        if (args.status === 'pending') {
          return { label: 'Reopen Task', icon: RefreshCw, color: 'var(--sb-accent-yellow)' };
        }
        return { label: 'Update Task', icon: Edit3, color: 'var(--sb-primary)' };
      }
      return { label: 'Create Task', icon: CheckSquare, color: 'var(--sb-primary)' };
    }
    if (toolName.includes('note')) {
      if (toolName.includes('delete')) return { label: 'Delete Note', icon: Trash2, color: 'var(--sb-alert)' };
      if (toolName.includes('update')) return { label: 'Update Note', icon: Edit3, color: 'var(--sb-accent-cyan)' };
      return { label: 'Create Note', icon: StickyNote, color: 'var(--sb-accent-cyan)' };
    }
    if (toolName.includes('habit')) {
      if (toolName.includes('delete')) return { label: 'Delete Habit', icon: Trash2, color: 'var(--sb-alert)' };
      if (toolName.includes('unlog')) return { label: 'Undo Habit Check-in', icon: XCircle, color: 'var(--sb-accent-orange)' };
      if (toolName.includes('log')) return { label: 'Check In Habit', icon: Flame, color: 'var(--sb-accent-orange)' };
      if (toolName.includes('update')) return { label: 'Update Habit', icon: Edit3, color: 'var(--sb-accent-orange)' };
      return { label: 'Create Habit', icon: Flame, color: 'var(--sb-accent-orange)' };
    }
    if (toolName.includes('calendar') || toolName.includes('event')) {
      if (toolName.includes('delete')) return { label: 'Cancel Event', icon: Trash2, color: 'var(--sb-alert)' };
      if (toolName.includes('update')) return { label: 'Reschedule Event', icon: Edit3, color: 'var(--sb-accent-purple)' };
      return { label: 'Schedule Event', icon: Calendar, color: 'var(--sb-accent-purple)' };
    }
    if (toolName.includes('reminder')) {
      if (toolName.includes('complete')) return { label: 'Complete Reminder', icon: CheckCircle2, color: 'var(--sb-ok)' };
      if (toolName.includes('snooze')) return { label: 'Snooze Reminder', icon: Clock, color: 'var(--sb-accent-yellow)' };
      if (toolName.includes('update')) return { label: 'Update Reminder', icon: Edit3, color: 'var(--sb-accent-yellow)' };
      return { label: 'Create Reminder', icon: Clock, color: 'var(--sb-accent-yellow)' };
    }
    return { label: toolName.replace(/_/g, ' '), icon: Play, color: 'var(--sb-primary)' };
  }

  async function handleApproveClick(item: PendingToolApproval) {
    setLoadingMap((prev) => ({ ...prev, [item.id]: true }));
    try {
      await onApprove(item);
    } finally {
      setLoadingMap((prev) => ({ ...prev, [item.id]: false }));
    }
  }

  const KNOWN_KEYS = new Set([
    'title',
    'name',
    'status',
    'task_id',
    'note_id',
    'habit_id',
    'event_id',
    'reminder_id',
    'id',
    'description',
    'content',
    'append_content',
    'due_at',
    'starts_at',
    'ends_at',
    'remind_at',
    'urgent',
    'important',
    'target_per_week',
    'tags',
    'search',
    'location',
  ]);

  return (
    <div className="space-y-3 my-3">
      {approvals.map((item) => {
        const args = item.args || {};
        const meta = getActionMeta(item.tool, args);
        const Icon = meta.icon;
        const isLoading = loadingMap[item.id] || item.status === 'executing';
        const isPending = item.status === 'pending';
        const isApproved = item.status === 'approved';
        const isRejected = item.status === 'rejected';

        // Actual resolved item title
        const itemTitle = item.target_title || args.name || (item.tool.startsWith('create_') ? args.title : null);

        // Collect extra custom arguments
        const extraKeys = Object.keys(args).filter((k) => !KNOWN_KEYS.has(k));

        return (
          <div
            key={item.id}
            className={`border-2 border-[var(--sb-border)] rounded-xl p-3.5 transition-all shadow-[3px_3px_0px_var(--sb-shadow-color)] ${
              isApproved
                ? 'bg-[var(--sb-ok-surface)] border-[var(--sb-border)]'
                : isRejected
                ? 'bg-[var(--sb-surface)] opacity-60'
                : 'bg-[var(--sb-surface)]'
            }`}
          >
            {/* Header / Action Label */}
            <div className="flex items-center justify-between gap-2 border-b-2 border-[var(--sb-border)] pb-2 mb-2.5">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-md border-2 border-[var(--sb-border)] flex items-center justify-center shrink-0 shadow-[1px_1px_0px_var(--sb-shadow-color)]"
                  style={{ backgroundColor: meta.color, color: '#121212' }}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-black text-[var(--sb-ink)] capitalize">
                  {meta.label}
                </span>
              </div>

              {/* Status Badge */}
              <div>
                {isPending && (
                  <span className="neo-badge bg-[var(--sb-accent-orange)] text-[#121212] text-[10px] flex items-center gap-1 font-bold">
                    <AlertTriangle className="w-3 h-3" />
                    Approval Required
                  </span>
                )}
                {isApproved && (
                  <span className="neo-badge bg-[var(--sb-ok)] text-white text-[10px] flex items-center gap-1 font-bold">
                    <Check className="w-3 h-3" />
                    Approved & Executed
                  </span>
                )}
                {isRejected && (
                  <span className="neo-badge bg-[var(--sb-surface-alt)] text-[var(--sb-muted)] text-[10px] flex items-center gap-1 font-bold">
                    <X className="w-3 h-3" />
                    Cancelled
                  </span>
                )}
              </div>
            </div>

            {/* Proposed Arguments Breakdown */}
            <div className="bg-[var(--sb-surface-alt)] rounded-lg p-3 border border-[var(--sb-border)] text-xs space-y-2.5">
              {/* Target / Item Title */}
              {itemTitle ? (
                <div className="flex items-center gap-2 bg-[var(--sb-surface)] px-2.5 py-1.5 rounded-md border border-[var(--sb-border)]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--sb-muted)] shrink-0">
                    {item.tool.startsWith('create_') ? 'New Item:' : 'Target Item:'}
                  </span>
                  <span className="text-xs font-black text-[var(--sb-ink)] truncate">
                    "{itemTitle}"
                  </span>
                </div>
              ) : (
                /* Fallback only if no title could ever be found */
                (args.task_id || args.note_id || args.habit_id || args.event_id || args.reminder_id || args.id) && (
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--sb-muted)] shrink-0 font-bold flex items-center gap-1">
                      <Hash className="w-3 h-3" /> Target ID:
                    </span>
                    <span className="text-[var(--sb-ink)] bg-[var(--sb-surface)] px-1.5 py-0.5 rounded border border-[var(--sb-border)] text-[11px] font-mono">
                      {args.task_id || args.note_id || args.habit_id || args.event_id || args.reminder_id || args.id}
                    </span>
                  </div>
                )
              )}

              {/* Status Update & Transition */}
              {args.status !== undefined && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[var(--sb-muted)] shrink-0 font-bold">Status:</span>
                  {item.current_status && item.current_status !== args.status ? (
                    <div className="flex items-center gap-1.5">
                      <span className="neo-badge text-[10px] bg-[var(--sb-surface)] opacity-70">
                        {item.current_status === 'done' || item.current_status === 'completed'
                          ? '✅ Completed'
                          : '⏳ Pending'}
                      </span>
                      <ArrowRight className="w-3 h-3 text-[var(--sb-muted)]" />
                      <span
                        className={`neo-badge text-[10px] font-bold ${
                          args.status === 'done' || args.status === 'completed'
                            ? 'bg-[var(--sb-ok)] text-white'
                            : 'bg-[var(--sb-accent-yellow)] text-[#121212]'
                        }`}
                      >
                        {args.status === 'done' || args.status === 'completed' ? '✅ Completed' : '⏳ Pending'}
                      </span>
                    </div>
                  ) : (
                    <span
                      className={`neo-badge text-[10px] font-bold ${
                        args.status === 'done' || args.status === 'completed'
                          ? 'bg-[var(--sb-ok)] text-white'
                          : 'bg-[var(--sb-accent-yellow)] text-[#121212]'
                      }`}
                    >
                      {args.status === 'done' || args.status === 'completed' ? '✅ Completed' : '⏳ Pending'}
                    </span>
                  )}
                </div>
              )}

              {/* Rename / Title modification (when editing title) */}
              {args.title && item.target_title && args.title !== item.target_title && (
                <div className="flex items-start gap-2">
                  <span className="text-[var(--sb-muted)] shrink-0 font-bold">Rename to:</span>
                  <span className="text-[var(--sb-ink)] font-bold text-xs">"{args.title}"</span>
                </div>
              )}

              {/* Delete Warning */}
              {item.tool.includes('delete') && (
                <div className="flex items-center gap-1.5 text-[var(--sb-alert)] font-bold text-[11px] bg-[var(--sb-surface)] p-2 rounded border border-[var(--sb-alert)]">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>This item will be moved to the Trash bin.</span>
                </div>
              )}

              {/* Priority */}
              {(args.urgent !== undefined || args.important !== undefined) && (
                <div className="flex items-center gap-2">
                  <span className="text-[var(--sb-muted)] shrink-0 font-bold">Priority:</span>
                  <span className="neo-badge text-[9px] bg-[var(--sb-surface)]">
                    {args.urgent ? '🚨 Urgent' : '⏳ Normal'} | {args.important ? '⭐ Important' : '⚪ Secondary'}
                  </span>
                </div>
              )}

              {/* Habit Frequency */}
              {args.target_per_week !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-[var(--sb-muted)] shrink-0 font-bold flex items-center gap-1">
                    <Target className="w-3 h-3 text-[var(--sb-accent-orange)]" /> Target Goal:
                  </span>
                  <span className="text-[var(--sb-ink)] font-bold">{args.target_per_week} times / week</span>
                </div>
              )}

              {/* Location */}
              {args.location && (
                <div className="flex items-start gap-2">
                  <span className="text-[var(--sb-muted)] shrink-0 font-bold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[var(--sb-accent-purple)]" /> Location:
                  </span>
                  <span className="text-[var(--sb-ink)]">{args.location}</span>
                </div>
              )}

              {/* Dates */}
              {args.due_at && (
                <div className="flex items-start gap-2">
                  <span className="text-[var(--sb-muted)] shrink-0 font-bold">Due Date:</span>
                  <span className="text-[var(--sb-ink)] font-semibold">{args.due_at}</span>
                </div>
              )}
              {args.starts_at && (
                <div className="flex items-start gap-2">
                  <span className="text-[var(--sb-muted)] shrink-0 font-bold">Starts At:</span>
                  <span className="text-[var(--sb-ink)] font-semibold">{args.starts_at}</span>
                </div>
              )}
              {args.ends_at && (
                <div className="flex items-start gap-2">
                  <span className="text-[var(--sb-muted)] shrink-0 font-bold">Ends At:</span>
                  <span className="text-[var(--sb-ink)] font-semibold">{args.ends_at}</span>
                </div>
              )}
              {args.remind_at && (
                <div className="flex items-start gap-2">
                  <span className="text-[var(--sb-muted)] shrink-0 font-bold">Remind At:</span>
                  <span className="text-[var(--sb-ink)] font-semibold">{args.remind_at}</span>
                </div>
              )}

              {/* Content / Descriptions */}
              {args.description !== undefined && (
                <div className="flex items-start gap-2">
                  <span className="text-[var(--sb-muted)] shrink-0 font-bold">Description:</span>
                  <span className="text-[var(--sb-ink)] break-all">{args.description || '—'}</span>
                </div>
              )}
              {args.content !== undefined && (
                <div className="flex items-start gap-2">
                  <span className="text-[var(--sb-muted)] shrink-0 font-bold">Content:</span>
                  <span className="text-[var(--sb-ink)] break-all">{args.content}</span>
                </div>
              )}
              {args.append_content && (
                <div className="flex items-start gap-2">
                  <span className="text-[var(--sb-muted)] shrink-0 font-bold">Append:</span>
                  <span className="text-[var(--sb-ok)] font-semibold">{args.append_content}</span>
                </div>
              )}

              {/* Tags */}
              {args.tags && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[var(--sb-muted)] shrink-0 font-bold flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Tags:
                  </span>
                  {(Array.isArray(args.tags) ? args.tags : [args.tags]).map((tag: string, tidx: number) => (
                    <span key={tidx} className="neo-badge text-[9px] bg-[var(--sb-accent-cyan)] text-[#121212] font-bold">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Dynamic Extra Keys */}
              {extraKeys.map((key) => (
                <div key={key} className="flex items-start gap-2">
                  <span className="text-[var(--sb-muted)] shrink-0 font-bold capitalize">{key.replace(/_/g, ' ')}:</span>
                  <span className="text-[var(--sb-ink)] break-all">
                    {typeof args[key] === 'object' ? JSON.stringify(args[key]) : String(args[key])}
                  </span>
                </div>
              ))}
            </div>

            {/* Execution Confirmation Message */}
            {item.result && (
              <div className="mt-2 text-xs font-bold text-[var(--sb-ok)] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{item.result.message || 'Action executed successfully.'}</span>
              </div>
            )}

            {/* Action Buttons (Approve / Reject) */}
            {isPending && (
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => onReject(item.id)}
                  disabled={isLoading}
                  className="neo-btn neo-btn-outline text-xs py-1 px-3 flex items-center gap-1 hover:text-[var(--sb-alert)]"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApproveClick(item)}
                  disabled={isLoading}
                  className="neo-btn neo-btn-primary text-xs py-1 px-3.5 shadow-[2px_2px_0px_var(--sb-shadow-color)] flex items-center gap-1.5"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Executing...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve & Run</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
