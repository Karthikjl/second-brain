'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ToastContext';
import { CalendarEventModal, CalendarEventItem } from '@/components/CalendarEventModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckSquare,
  Flame,
  Bell,
  Trash2,
} from 'lucide-react';

export default function CalendarPage() {
  const { showToast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState<{
    calendarEvents: any[];
    tasks: any[];
    habitLogs: any[];
    reminders: any[];
  }>({
    calendarEvents: [],
    tasks: [],
    habitLogs: [],
    reminders: [],
  });
  const [loading, setLoading] = useState(true);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [editingEvent, setEditingEvent] = useState<CalendarEventItem | null>(null);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const loadMonthData = useCallback(async () => {
    setLoading(true);
    const start = new Date(year, month, 1).toISOString().slice(0, 10);
    const end = new Date(year, month + 1, 0).toISOString().slice(0, 10);

    try {
      const res = await apiFetch(`/calendar?start=${start}&end=${end}`);
      setData({
        calendarEvents: res.calendarEvents || [],
        tasks: res.tasks || [],
        habitLogs: res.habitLogs || [],
        reminders: res.reminders || [],
      });
    } catch (err: any) {
      showToast(err?.message || 'Failed to fetch calendar data', 'error');
    } finally {
      setLoading(false);
    }
  }, [year, month, showToast]);

  useEffect(() => {
    loadMonthData();
    const handleUpdate = () => loadMonthData();
    window.addEventListener('sb-data-updated', handleUpdate);
    return () => window.removeEventListener('sb-data-updated', handleUpdate);
  }, [loadMonthData]);

  // Calendar matrix calculations
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const gotoToday = () => setCurrentDate(new Date());

  async function handleDeleteEvent() {
    if (!deleteEventId) return;
    try {
      await apiFetch(`/calendar-events/${deleteEventId}`, { method: 'DELETE' });
      showToast('Event moved to Recycle Bin', 'success');
      loadMonthData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete event', 'error');
    } finally {
      setDeleteEventId(null);
    }
  }

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--sb-ink)] tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-[var(--sb-accent-purple)]" />
            Calendar & Schedule
          </h1>
          <p className="text-xs text-[var(--sb-muted)] font-medium mt-1">
            Month overview combining events, due tasks, habit check-ins, and reminders.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingEvent(null);
            setSelectedDate(new Date().toISOString().slice(0, 10));
            setModalOpen(true);
          }}
          className="neo-btn neo-btn-primary text-xs py-2 px-4 shadow-[2px_2px_0px_var(--sb-shadow-color)]"
        >
          <Plus className="w-4 h-4" />
          <span>New Event</span>
        </button>
      </div>

      {/* Month Navigator Bar */}
      <div className="neo-box p-4 bg-[var(--sb-surface)] flex items-center justify-between">
        <h2 className="text-lg font-black text-[var(--sb-ink)]">{monthName}</h2>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={gotoToday}
            className="neo-btn neo-btn-outline text-xs py-1 px-3"
          >
            Today
          </button>
          <button
            type="button"
            onClick={prevMonth}
            className="neo-btn neo-btn-outline p-1.5"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="neo-btn neo-btn-outline p-1.5"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="neo-box bg-[var(--sb-surface)] overflow-hidden border-2 border-[var(--sb-border)]">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b-2 border-[var(--sb-border)] bg-[var(--sb-surface-alt)]">
          {weekDays.map((d) => (
            <div
              key={d}
              className="py-2.5 text-center text-xs font-black uppercase tracking-wider text-[var(--sb-muted)]"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days Cells */}
        <div className="grid grid-cols-7 auto-rows-fr">
          {/* Empty cells for leading days */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="min-h-[110px] p-2 bg-[var(--sb-surface-alt)]/40 border-b border-r border-[var(--sb-border-light)]"
            />
          ))}

          {/* Actual days of month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isToday =
              new Date().toISOString().slice(0, 10) === dateStr;

            // Gather items for this day
            const dayEvents = data.calendarEvents.filter((e) =>
              e.starts_at?.startsWith(dateStr)
            );
            const dayTasks = data.tasks.filter((t) =>
              t.due_at?.startsWith(dateStr)
            );
            const dayReminders = data.reminders.filter((r) =>
              r.remind_at?.startsWith(dateStr)
            );
            const dayHabits = data.habitLogs.filter((h) =>
              h.log_date?.startsWith(dateStr)
            );

            return (
              <div
                key={dateStr}
                onClick={() => {
                  setSelectedDate(dateStr);
                  setEditingEvent(null);
                  setModalOpen(true);
                }}
                className={`min-h-[110px] p-2 border-b border-r border-[var(--sb-border-light)] cursor-pointer transition-colors hover:bg-[var(--sb-surface-alt)] flex flex-col justify-between ${
                  isToday ? 'bg-[var(--sb-primary)]/10' : ''
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday
                        ? 'bg-[var(--sb-primary)] text-[var(--sb-primary-ink)] border border-[var(--sb-border)]'
                        : 'text-[var(--sb-ink)]'
                    }`}
                  >
                    {dayNum}
                  </span>
                </div>

                {/* Day Items Container */}
                <div className="mt-1 space-y-1 overflow-hidden flex-1">
                  {dayEvents.map((evt) => (
                    <div
                      key={evt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingEvent(evt);
                        setModalOpen(true);
                      }}
                      className="px-1.5 py-0.5 rounded bg-[var(--sb-accent-purple-surface)] text-[var(--sb-accent-purple)] border border-[var(--sb-accent-purple)] text-[10px] font-bold truncate flex items-center justify-between group"
                    >
                      <span className="truncate">{evt.title}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteEventId(evt.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:text-[var(--sb-alert)] ml-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {dayTasks.map((t) => (
                    <div
                      key={t.id}
                      className="px-1.5 py-0.5 rounded bg-[var(--sb-primary)]/20 text-[var(--sb-ink)] border border-[var(--sb-primary)] text-[10px] font-bold truncate flex items-center gap-1"
                    >
                      <CheckSquare className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{t.title}</span>
                    </div>
                  ))}

                  {dayReminders.map((r) => (
                    <div
                      key={r.id}
                      className="px-1.5 py-0.5 rounded bg-[var(--sb-alert-surface)] text-[var(--sb-alert)] border border-[var(--sb-alert)] text-[10px] font-bold truncate flex items-center gap-1"
                    >
                      <Bell className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{r.title}</span>
                    </div>
                  ))}

                  {dayHabits.map((h) => (
                    <div
                      key={h.id}
                      className="px-1.5 py-0.5 rounded bg-[var(--sb-accent-orange-surface)] text-[var(--sb-accent-orange)] border border-[var(--sb-accent-orange)] text-[10px] font-bold truncate flex items-center gap-1"
                    >
                      <Flame className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{h.habits?.title || 'Habit completed'}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Calendar Event Modal */}
      <CalendarEventModal
        isOpen={modalOpen}
        event={editingEvent}
        initialDate={selectedDate}
        onClose={() => {
          setModalOpen(false);
          setEditingEvent(null);
        }}
        onSaved={loadMonthData}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteEventId)}
        title="Move Event to Trash?"
        message="This event will be moved to the Recycle Bin and can be restored within 30 days."
        confirmLabel="Move to Trash"
        isDanger
        onConfirm={handleDeleteEvent}
        onClose={() => setDeleteEventId(null)}
      />
    </div>
  );
}
