'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ToastContext';
import { ReminderModal, ReminderItem } from '@/components/ReminderModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import {
  Bell,
  Plus,
  Clock,
  CheckCircle2,
  Trash2,
  Edit2,
  RotateCcw,
} from 'lucide-react';

export default function RemindersPage() {
  const { showToast } = useToast();
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ReminderItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadReminders = useCallback(async () => {
    try {
      const data = await apiFetch('/reminders');
      setReminders(data.reminders || []);
    } catch (err: any) {
      showToast(err?.message || 'Failed to fetch reminders', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadReminders();
    const handleUpdate = () => loadReminders();
    window.addEventListener('sb-data-updated', handleUpdate);
    return () => window.removeEventListener('sb-data-updated', handleUpdate);
  }, [loadReminders]);

  async function handleSnooze(reminderId: string, minutes: number) {
    try {
      await apiFetch(`/reminders/${reminderId}/snooze`, {
        method: 'POST',
        body: JSON.stringify({ minutes }),
      });
      showToast(`Reminder snoozed for ${minutes} minutes!`, 'info');
      loadReminders();
    } catch (err: any) {
      showToast(err?.message || 'Failed to snooze reminder', 'error');
    }
  }

  async function handleToggleDone(reminder: any) {
    const nextDone = reminder.is_done ? 0 : 1;
    try {
      await apiFetch(`/reminders/${reminder.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_done: nextDone }),
      });
      showToast(nextDone ? 'Reminder marked as done!' : 'Reminder reopened', 'success');
      loadReminders();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update reminder', 'error');
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await apiFetch(`/reminders/${deleteId}`, { method: 'DELETE' });
      showToast('Reminder moved to Recycle Bin', 'success');
      loadReminders();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete reminder', 'error');
    } finally {
      setDeleteId(null);
    }
  }

  const activeReminders = reminders.filter((r) => !r.is_done);
  const completedReminders = reminders.filter((r) => Boolean(r.is_done));

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--sb-ink)] tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-[var(--sb-alert)]" />
            Reminders & Alerts
          </h1>
          <p className="text-xs text-[var(--sb-muted)] font-medium mt-1">
            Never let important appointments, follow-ups, or deadlines slip through the cracks.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingReminder(null);
            setModalOpen(true);
          }}
          className="neo-btn neo-btn-primary text-xs py-2 px-4 shadow-[2px_2px_0px_var(--sb-shadow-color)]"
        >
          <Plus className="w-4 h-4" />
          <span>New Reminder</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="neo-skeleton p-4 h-20 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="neo-skeleton-line w-5 h-5 rounded" />
                <div className="space-y-1.5 flex-1">
                  <div className="neo-skeleton-line h-4 w-1/3" />
                  <div className="neo-skeleton-line h-3 w-1/4" />
                </div>
              </div>
              <div className="neo-skeleton-line h-8 w-36 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active Reminders */}
          <section className="space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-[var(--sb-ink)] flex items-center gap-2">
              <span>Active Reminders</span>
              <span className="neo-badge bg-[var(--sb-alert-surface)] text-[var(--sb-alert)] text-[10px]">
                {activeReminders.length}
              </span>
            </h2>

            {activeReminders.length === 0 ? (
              <div className="neo-box p-8 text-center bg-[var(--sb-surface)]">
                <Bell className="w-10 h-10 text-[var(--sb-muted)] mx-auto mb-2 opacity-40" />
                <p className="text-xs font-bold text-[var(--sb-muted)]">No active reminders. You are all clear!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeReminders.map((reminder) => {
                  const isPast = new Date(reminder.remind_at).getTime() < Date.now();

                  return (
                    <div
                      key={reminder.id}
                      className="neo-box p-4 bg-[var(--sb-surface)] flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleDone(reminder)}
                          className="w-5 h-5 mt-0.5 rounded border-2 border-[var(--sb-border)] bg-[var(--sb-surface)] hover:bg-[var(--sb-ok-surface)] flex items-center justify-center text-xs"
                          title="Mark Done"
                        />
                        <div>
                          <h3 className="text-sm font-bold text-[var(--sb-ink)]">{reminder.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] font-mono text-[var(--sb-muted)] flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(reminder.remind_at).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isPast && (
                              <span className="neo-badge bg-[var(--sb-alert)] text-white text-[9px]">
                                OVERDUE
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Snooze and Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1 bg-[var(--sb-surface-alt)] p-1 rounded border-2 border-[var(--sb-border)]">
                          <span className="text-[10px] font-bold text-[var(--sb-muted)] px-1">Snooze:</span>
                          <button
                            type="button"
                            onClick={() => handleSnooze(reminder.id, 15)}
                            className="neo-btn neo-btn-outline py-0.5 px-1.5 text-[10px]"
                          >
                            +15m
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSnooze(reminder.id, 60)}
                            className="neo-btn neo-btn-outline py-0.5 px-1.5 text-[10px]"
                          >
                            +1h
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSnooze(reminder.id, 1440)}
                            className="neo-btn neo-btn-outline py-0.5 px-1.5 text-[10px]"
                          >
                            +1d
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingReminder(reminder);
                            setModalOpen(true);
                          }}
                          className="p-1.5 rounded hover:bg-[var(--sb-surface-alt)] text-[var(--sb-muted)] hover:text-[var(--sb-ink)]"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(reminder.id)}
                          className="p-1.5 rounded hover:bg-[var(--sb-alert-surface)] text-[var(--sb-alert)]"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Completed Reminders */}
          {completedReminders.length > 0 && (
            <section className="space-y-3 pt-4 border-t-2 border-[var(--sb-border-light)]">
              <h2 className="text-xs font-black uppercase tracking-wider text-[var(--sb-muted)]">
                Completed Reminders ({completedReminders.length})
              </h2>

              <div className="space-y-2 opacity-60">
                {completedReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="p-3 rounded border-2 border-[var(--sb-border)] bg-[var(--sb-surface-alt)] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[var(--sb-ok)]" />
                      <span className="text-xs font-bold line-through text-[var(--sb-muted)]">
                        {reminder.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleDone(reminder)}
                        className="text-[10px] font-bold text-[var(--sb-muted)] hover:text-[var(--sb-ink)]"
                      >
                        Reopen
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(reminder.id)}
                        className="text-[var(--sb-alert)] hover:opacity-80"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Reminder Modal */}
      <ReminderModal
        isOpen={modalOpen}
        reminder={editingReminder}
        onClose={() => {
          setModalOpen(false);
          setEditingReminder(null);
        }}
        onSaved={loadReminders}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteId)}
        title="Move Reminder to Trash?"
        message="This reminder will be moved to the Recycle Bin."
        confirmLabel="Move to Trash"
        isDanger
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
