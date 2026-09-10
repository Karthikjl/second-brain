'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ToastContext';
import { HabitModal, HabitItem } from '@/components/HabitModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import {
  Flame,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Calendar,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

export default function HabitsPage() {
  const { showToast } = useToast();
  const [habits, setHabits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Generate past 7 days for the weekly check-in matrix
  const days: { dateStr: string; label: string; dayNum: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = d.getDate();
    days.push({ dateStr, label, dayNum });
  }

  const loadHabits = useCallback(async () => {
    try {
      const data = await apiFetch('/habits');
      setHabits(data.habits || []);
    } catch (err: any) {
      showToast(err?.message || 'Failed to fetch habits', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadHabits();
    const handleUpdate = () => loadHabits();
    window.addEventListener('sb-data-updated', handleUpdate);
    return () => window.removeEventListener('sb-data-updated', handleUpdate);
  }, [loadHabits]);

  async function toggleHabitLog(habitId: string, dateStr: string, isLogged: boolean) {
    try {
      if (isLogged) {
        await apiFetch(`/habits/${habitId}/logs/${dateStr}`, { method: 'DELETE' });
        showToast('Check-in removed', 'info');
      } else {
        await apiFetch(`/habits/${habitId}/logs`, {
          method: 'POST',
          body: JSON.stringify({ log_date: dateStr, completed: 1 }),
        });
        showToast('Habit completed! 🔥', 'success');
      }
      loadHabits();
    } catch (err: any) {
      showToast(err?.message || 'Failed to toggle habit log', 'error');
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await apiFetch(`/habits/${deleteId}`, { method: 'DELETE' });
      showToast('Habit moved to Recycle Bin', 'success');
      loadHabits();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete habit', 'error');
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--sb-ink)] tracking-tight flex items-center gap-2">
            <Flame className="w-6 h-6 text-[var(--sb-accent-orange)]" />
            Habit Tracker & Streaks
          </h1>
          <p className="text-xs text-[var(--sb-muted)] font-medium mt-1">
            Build consistency, hit weekly targets, and maintain your streak momentum.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingHabit(null);
            setModalOpen(true);
          }}
          className="neo-btn neo-btn-primary text-xs py-2 px-4 shadow-[2px_2px_0px_var(--sb-shadow-color)]"
        >
          <Plus className="w-4 h-4" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Main Habit Matrix Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="neo-skeleton p-5 h-24 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="neo-skeleton-line h-4 w-40" />
                <div className="neo-skeleton-line h-3 w-28" />
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <div key={d} className="neo-skeleton-line w-9 h-9 rounded-md" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : habits.length === 0 ? (
        <div className="neo-box p-12 text-center bg-[var(--sb-surface)]">
          <Flame className="w-12 h-12 text-[var(--sb-muted)] mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-bold text-[var(--sb-ink)]">No habits created yet</h3>
          <p className="text-xs text-[var(--sb-muted)] mt-1 max-w-sm mx-auto">
            Form life-changing habits! Click "+ New Habit" to track your first daily goal.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {habits.map((habit) => {
            const logsMap = new Set(habit.logs || []);

            return (
              <div
                key={habit.id}
                className="neo-box p-5 bg-[var(--sb-surface)] flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Habit info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[var(--sb-ink)]">{habit.title}</h3>
                    <span className="neo-badge bg-[var(--sb-accent-orange-surface)] text-[var(--sb-accent-orange)] text-[10px]">
                      🔥 {habit.current_streak ?? habit.streak ?? 0}d streak
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--sb-muted)] font-mono mt-1">
                    Target: {habit.target_per_week} days/week
                  </p>
                </div>

                {/* 7-Day Check-in Grid */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                  {days.map((day) => {
                    const isChecked = logsMap.has(day.dateStr);
                    const isToday = day.dateStr === new Date().toISOString().slice(0, 10);

                    return (
                      <div key={day.dateStr} className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold text-[var(--sb-muted)] uppercase">
                          {day.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleHabitLog(habit.id, day.dateStr, isChecked)}
                          className={`w-9 h-9 rounded-md border-2 border-[var(--sb-border)] flex items-center justify-center font-bold text-xs transition-all ${
                            isChecked
                              ? 'bg-[var(--sb-ok)] text-white shadow-[1px_1px_0px_var(--sb-shadow-color)]'
                              : isToday
                              ? 'bg-[var(--sb-surface-alt)] border-dashed hover:bg-[var(--sb-ok-surface)]'
                              : 'bg-[var(--sb-surface)] hover:bg-[var(--sb-surface-alt)]'
                          }`}
                          title={`${day.dateStr}: ${isChecked ? 'Completed' : 'Not completed'}`}
                        >
                          {isChecked ? <CheckCircle2 className="w-4 h-4" /> : day.dayNum}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 border-t-2 md:border-t-0 pt-2 md:pt-0 border-[var(--sb-border-light)] justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingHabit(habit);
                      setModalOpen(true);
                    }}
                    className="p-1.5 rounded hover:bg-[var(--sb-surface-alt)] text-[var(--sb-muted)] hover:text-[var(--sb-ink)] transition-colors"
                    title="Edit Habit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(habit.id)}
                    className="p-1.5 rounded hover:bg-[var(--sb-alert-surface)] text-[var(--sb-alert)] transition-colors"
                    title="Delete Habit"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Habit Modal */}
      <HabitModal
        isOpen={modalOpen}
        habit={editingHabit}
        onClose={() => {
          setModalOpen(false);
          setEditingHabit(null);
        }}
        onSaved={loadHabits}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteId)}
        title="Move Habit to Trash?"
        message="This habit will be moved to the Recycle Bin and can be restored within 30 days."
        confirmLabel="Move to Trash"
        isDanger
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
