'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ToastContext';
import {
  CheckSquare,
  Flame,
  Bell,
  Calendar as CalendarIcon,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { TaskModal } from '@/components/TaskModal';
import { NoteModal } from '@/components/NoteModal';
import { HabitModal } from '@/components/HabitModal';
import { ReminderModal } from '@/components/ReminderModal';
import { CalendarEventModal } from '@/components/CalendarEventModal';

export default function DashboardPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [habitModalOpen, setHabitModalOpen] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const res = await apiFetch('/dashboard');
      setData(res);
    } catch (err: any) {
      showToast(err?.message || 'Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadDashboard();
    const handleUpdate = () => loadDashboard();
    window.addEventListener('sb-data-updated', handleUpdate);
    return () => window.removeEventListener('sb-data-updated', handleUpdate);
  }, [loadDashboard]);

  async function toggleTaskStatus(task: any) {
    const nextStatus = task.status === 'done' ? 'pending' : 'done';
    try {
      await apiFetch(`/tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      loadDashboard();
      showToast(`Task marked as ${nextStatus}!`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update task', 'error');
    }
  }

  async function toggleHabitLog(habit: any) {
    const todayStr = habit.today_date || new Date().toISOString().slice(0, 10);
    const isCompleted = Boolean(habit.today_completed || habit.completed_today);

    try {
      if (isCompleted) {
        await apiFetch(`/habits/${habit.id}/logs/${todayStr}`, { method: 'DELETE' });
        showToast('Habit check-in removed', 'info');
      } else {
        await apiFetch(`/habits/${habit.id}/logs`, {
          method: 'POST',
          body: JSON.stringify({ log_date: todayStr, completed: 1 }),
        });
        showToast('Habit streak updated! 🔥', 'success');
      }
      loadDashboard();
    } catch (err: any) {
      showToast(err?.message || 'Failed to log habit', 'error');
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Banner Skeleton */}
        <div className="neo-skeleton p-6 h-36 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="neo-skeleton-line h-4 w-28" />
            <div className="neo-skeleton-line h-7 w-64" />
            <div className="neo-skeleton-line h-3.5 w-96 max-w-full" />
          </div>
          <div className="flex gap-2">
            <div className="neo-skeleton-line h-8 w-24" />
            <div className="neo-skeleton-line h-8 w-24" />
          </div>
        </div>

        {/* 4 Stats Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="neo-skeleton p-4 h-24 flex flex-col justify-between">
              <div className="flex justify-between">
                <div className="neo-skeleton-line h-3 w-20" />
                <div className="neo-skeleton-line h-4 w-4 rounded-full" />
              </div>
              <div className="neo-skeleton-line h-7 w-16" />
            </div>
          ))}
        </div>

        {/* Tasks and Habits 2-Column Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="neo-skeleton p-5 h-64 flex flex-col justify-between">
            <div className="neo-skeleton-line h-5 w-32 mb-4" />
            <div className="space-y-2.5 flex-1">
              <div className="neo-skeleton-line h-12 w-full" />
              <div className="neo-skeleton-line h-12 w-full" />
              <div className="neo-skeleton-line h-12 w-full" />
            </div>
          </div>
          <div className="neo-skeleton p-5 h-64 flex flex-col justify-between">
            <div className="neo-skeleton-line h-5 w-32 mb-4" />
            <div className="space-y-2.5 flex-1">
              <div className="neo-skeleton-line h-12 w-full" />
              <div className="neo-skeleton-line h-12 w-full" />
              <div className="neo-skeleton-line h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const todayTasks = data?.today?.tasks || [];
  const todayHabits = data?.today?.habits || [];
  const todayReminders = data?.today?.reminders || [];
  const todayEvents = data?.today?.events || [];
  const tomorrowTasks = data?.tomorrow?.tasks || [];
  const tomorrowEvents = data?.tomorrow?.events || [];
  const next7Days = data?.next7Days || { tasks: [], events: [], reminders: [] };

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="neo-box p-6 relative overflow-hidden bg-gradient-to-r from-[var(--sb-surface)] via-[var(--sb-surface-alt)] to-[var(--sb-accent-cyan-surface)] border-2 border-[var(--sb-border)] shadow-[4px_4px_0px_var(--sb-shadow-color)]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="neo-badge bg-[var(--sb-primary)] text-[var(--sb-primary-ink)] font-black text-[10px] shadow-[1px_1px_0px_var(--sb-shadow-color)]">
                DAILY FOCUS
              </span>
              <span className="text-xs font-bold text-[var(--sb-muted)]">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--sb-ink)]">
              Ready to conquer today?
            </h2>
            <p className="text-xs font-medium text-[var(--sb-muted)] mt-1 max-w-xl">
              You have {todayTasks.filter((t: any) => t.status !== 'done').length} pending tasks, {todayHabits.filter((h: any) => !h.today_completed).length} active habits to check in, and {todayEvents.length} events scheduled.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTaskModalOpen(true)}
              className="neo-btn neo-btn-primary text-xs py-2 px-3.5 shadow-[2px_2px_0px_var(--sb-shadow-color)]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Task</span>
            </button>
            <button
              onClick={() => setNoteModalOpen(true)}
              className="neo-btn neo-btn-outline text-xs py-2 px-3.5 shadow-[2px_2px_0px_var(--sb-shadow-color)]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Note</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="neo-box p-4 bg-[var(--sb-surface)] border-2 border-[var(--sb-border)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--sb-muted)]">
              Tasks Today
            </span>
            <CheckSquare className="w-4 h-4 text-[var(--sb-primary)]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[var(--sb-ink)]">
              {todayTasks.filter((t: any) => t.status === 'done').length}/{todayTasks.length}
            </span>
            <span className="text-[11px] font-bold text-[var(--sb-muted)]">done</span>
          </div>
        </div>

        <div className="neo-box p-4 bg-[var(--sb-surface)] border-2 border-[var(--sb-border)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--sb-muted)]">
              Habits Streak
            </span>
            <Flame className="w-4 h-4 text-[var(--sb-accent-orange)]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[var(--sb-ink)]">
              {todayHabits.filter((h: any) => h.today_completed).length}/{todayHabits.length}
            </span>
            <span className="text-[11px] font-bold text-[var(--sb-muted)]">completed</span>
          </div>
        </div>

        <div className="neo-box p-4 bg-[var(--sb-surface)] border-2 border-[var(--sb-border)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--sb-muted)]">
              Calendar Events
            </span>
            <CalendarIcon className="w-4 h-4 text-[var(--sb-accent-purple)]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[var(--sb-ink)]">
              {todayEvents.length}
            </span>
            <span className="text-[11px] font-bold text-[var(--sb-muted)]">scheduled</span>
          </div>
        </div>

        <div className="neo-box p-4 bg-[var(--sb-surface)] border-2 border-[var(--sb-border)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--sb-muted)]">
              Reminders
            </span>
            <Bell className="w-4 h-4 text-[var(--sb-alert)]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[var(--sb-ink)]">
              {todayReminders.length}
            </span>
            <span className="text-[11px] font-bold text-[var(--sb-muted)]">active</span>
          </div>
        </div>
      </div>

      {/* Main Sections: Today's Tasks & Today's Habits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Tasks Card */}
        <div className="neo-box p-5 bg-[var(--sb-surface)] flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-[var(--sb-border)]">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-[var(--sb-ink)]" />
              <h3 className="font-black text-sm uppercase tracking-wide text-[var(--sb-ink)]">
                Today's Tasks
              </h3>
            </div>
            <button
              onClick={() => setTaskModalOpen(true)}
              className="neo-btn neo-btn-outline text-[11px] py-1 px-2"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto max-h-72">
            {todayTasks.length === 0 ? (
              <div className="p-6 text-center text-xs font-bold text-[var(--sb-muted)] bg-[var(--sb-surface-alt)] rounded border-2 border-dashed border-[var(--sb-border-light)]">
                No tasks due today. All caught up! 🎉
              </div>
            ) : (
              todayTasks.map((t: any) => (
                <div
                  key={t.id}
                  className={`p-3 rounded-md border-2 border-[var(--sb-border)] flex items-center justify-between gap-3 transition-all ${
                    t.status === 'done'
                      ? 'bg-[var(--sb-surface-alt)] opacity-60'
                      : 'bg-[var(--sb-surface)] shadow-[2px_2px_0px_var(--sb-shadow-color)]'
                  }`}
                >
                  <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={t.status === 'done'}
                      onChange={() => toggleTaskStatus(t)}
                      className="w-4 h-4 rounded border-2 border-[var(--sb-border)] accent-[var(--sb-primary)]"
                    />
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-bold truncate ${
                          t.status === 'done' ? 'line-through text-[var(--sb-muted)]' : 'text-[var(--sb-ink)]'
                        }`}
                      >
                        {t.title}
                      </p>
                      {t.description && (
                        <p className="text-[10px] text-[var(--sb-muted)] truncate">{t.description}</p>
                      )}
                    </div>
                  </label>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {t.urgent === 1 && (
                      <span className="neo-badge bg-[var(--sb-alert-surface)] text-[var(--sb-alert)] text-[10px]">
                        URGENT
                      </span>
                    )}
                    {t.important === 1 && (
                      <span className="neo-badge bg-[var(--sb-accent-cyan-surface)] text-[var(--sb-accent-cyan)] text-[10px]">
                        VIP
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Today's Habits Card */}
        <div className="neo-box p-5 bg-[var(--sb-surface)] flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-[var(--sb-border)]">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-[var(--sb-accent-orange)]" />
              <h3 className="font-black text-sm uppercase tracking-wide text-[var(--sb-ink)]">
                Daily Habits
              </h3>
            </div>
            <button
              onClick={() => setHabitModalOpen(true)}
              className="neo-btn neo-btn-outline text-[11px] py-1 px-2"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto max-h-72">
            {todayHabits.length === 0 ? (
              <div className="p-6 text-center text-xs font-bold text-[var(--sb-muted)] bg-[var(--sb-surface-alt)] rounded border-2 border-dashed border-[var(--sb-border-light)]">
                No habits created yet. Build your first streak! 🚀
              </div>
            ) : (
              todayHabits.map((h: any) => (
                <div
                  key={h.id}
                  className={`p-3 rounded-md border-2 border-[var(--sb-border)] flex items-center justify-between gap-3 transition-all ${
                    h.today_completed
                      ? 'bg-[var(--sb-ok-surface)] border-[var(--sb-ok)]'
                      : 'bg-[var(--sb-surface)] shadow-[2px_2px_0px_var(--sb-shadow-color)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => toggleHabitLog(h)}
                      className={`w-6 h-6 rounded-md border-2 border-[var(--sb-border)] flex items-center justify-center font-bold text-xs transition-all ${
                        h.today_completed
                          ? 'bg-[var(--sb-ok)] text-white shadow-none'
                          : 'bg-[var(--sb-surface)] shadow-[2px_2px_0px_var(--sb-shadow-color)] hover:translate-x-[-1px]'
                      }`}
                    >
                      {h.today_completed ? <CheckCircle2 className="w-4 h-4" /> : null}
                    </button>
                    <div>
                      <p className="text-xs font-bold text-[var(--sb-ink)]">{h.title}</p>
                      <p className="text-[10px] font-mono text-[var(--sb-muted)]">
                        Target: {h.target_per_week} days/week
                      </p>
                    </div>
                  </div>

                  <span className="neo-badge bg-[var(--sb-accent-orange-surface)] text-[var(--sb-accent-orange)] text-[10px]">
                    🔥 {h.current_streak || 0}d streak
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Schedule & Reminders: Tomorrow and Next 7 Days */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Events & Reminders */}
        <div className="neo-box p-5 bg-[var(--sb-surface)]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-[var(--sb-border)]">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[var(--sb-accent-purple)]" />
              <h3 className="font-bold text-xs uppercase tracking-wide text-[var(--sb-ink)]">
                Today's Schedule
              </h3>
            </div>
            <button
              onClick={() => setEventModalOpen(true)}
              className="neo-btn neo-btn-outline text-[10px] py-0.5 px-2"
            >
              + Event
            </button>
          </div>

          <div className="space-y-2">
            {todayEvents.length === 0 && todayReminders.length === 0 ? (
              <p className="text-[11px] text-[var(--sb-muted)] font-medium">No events or reminders today.</p>
            ) : (
              <>
                {todayEvents.map((e: any) => (
                  <div
                    key={e.id}
                    className="p-2.5 rounded bg-[var(--sb-accent-purple-surface)] border-2 border-[var(--sb-border)] text-xs font-bold"
                  >
                    <div className="text-[var(--sb-ink)]">{e.title}</div>
                    <div className="text-[10px] text-[var(--sb-muted)] font-mono mt-0.5">
                      {new Date(e.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {e.location ? ` • ${e.location}` : ''}
                    </div>
                  </div>
                ))}
                {todayReminders.map((r: any) => (
                  <div
                    key={r.id}
                    className="p-2.5 rounded bg-[var(--sb-alert-surface)] border-2 border-[var(--sb-border)] text-xs font-bold"
                  >
                    <div className="text-[var(--sb-ink)] flex items-center gap-1.5">
                      <Bell className="w-3 h-3 text-[var(--sb-alert)]" />
                      {r.title}
                    </div>
                    <div className="text-[10px] text-[var(--sb-muted)] font-mono mt-0.5">
                      {new Date(r.remind_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Tomorrow */}
        <div className="neo-box p-5 bg-[var(--sb-surface)]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-[var(--sb-border)]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--sb-accent-cyan)]" />
              <h3 className="font-bold text-xs uppercase tracking-wide text-[var(--sb-ink)]">
                Tomorrow
              </h3>
            </div>
          </div>

          <div className="space-y-2">
            {tomorrowTasks.length === 0 && tomorrowEvents.length === 0 ? (
              <p className="text-[11px] text-[var(--sb-muted)] font-medium">Nothing scheduled for tomorrow yet.</p>
            ) : (
              <>
                {tomorrowTasks.map((t: any) => (
                  <div
                    key={t.id}
                    className="p-2.5 rounded bg-[var(--sb-surface-alt)] border-2 border-[var(--sb-border)] text-xs font-bold"
                  >
                    <span className="text-[var(--sb-ink)]">Task: {t.title}</span>
                  </div>
                ))}
                {tomorrowEvents.map((e: any) => (
                  <div
                    key={e.id}
                    className="p-2.5 rounded bg-[var(--sb-accent-cyan-surface)] border-2 border-[var(--sb-border)] text-xs font-bold"
                  >
                    <span className="text-[var(--sb-ink)]">Event: {e.title}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Rolling 7 Days */}
        <div className="neo-box p-5 bg-[var(--sb-surface)]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-[var(--sb-border)]">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[var(--sb-ok)]" />
              <h3 className="font-bold text-xs uppercase tracking-wide text-[var(--sb-ink)]">
                Upcoming (Next 7 Days)
              </h3>
            </div>
          </div>

          <div className="space-y-2">
            {(next7Days.tasks?.length || 0) + (next7Days.events?.length || 0) === 0 ? (
              <p className="text-[11px] text-[var(--sb-muted)] font-medium">No items in the next 7 days.</p>
            ) : (
              <>
                {next7Days.tasks?.map((t: any) => (
                  <div
                    key={t.id}
                    className="p-2.5 rounded bg-[var(--sb-surface)] border-2 border-[var(--sb-border)] text-xs font-bold shadow-[2px_2px_0px_var(--sb-shadow-color)]"
                  >
                    <div className="text-[var(--sb-ink)]">{t.title}</div>
                    <div className="text-[10px] text-[var(--sb-muted)] font-mono">
                      Due: {t.due_at ? new Date(t.due_at).toLocaleDateString() : 'Upcoming'}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSaved={loadDashboard}
      />
      <NoteModal
        isOpen={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        onSaved={loadDashboard}
      />
      <HabitModal
        isOpen={habitModalOpen}
        onClose={() => setHabitModalOpen(false)}
        onSaved={loadDashboard}
      />
      <ReminderModal
        isOpen={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        onSaved={loadDashboard}
      />
      <CalendarEventModal
        isOpen={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        onSaved={loadDashboard}
      />
    </div>
  );
}
