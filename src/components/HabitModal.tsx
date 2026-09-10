'use client';

import React, { useState, useEffect } from 'react';
import { X, Flame } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from './ToastContext';
import { NeoSelect } from './NeoSelect';

export interface HabitItem {
  id?: string;
  title: string;
  target_per_week?: number;
}

interface HabitModalProps {
  isOpen: boolean;
  habit?: HabitItem | null;
  onClose: () => void;
  onSaved: () => void;
}

export function HabitModal({ isOpen, habit, onClose, onSaved }: HabitModalProps) {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [targetPerWeek, setTargetPerWeek] = useState(7);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (habit) {
      setTitle(habit.title || '');
      setTargetPerWeek(habit.target_per_week || 7);
    } else {
      setTitle('');
      setTargetPerWeek(7);
    }
  }, [habit, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      if (habit?.id) {
        await apiFetch(`/habits/${habit.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            title: title.trim(),
            target_per_week: Number(targetPerWeek),
          }),
        });
        showToast('Habit updated successfully!', 'success');
      } else {
        await apiFetch('/habits', {
          method: 'POST',
          body: JSON.stringify({
            title: title.trim(),
            target_per_week: Number(targetPerWeek),
          }),
        });
        showToast('Habit created successfully!', 'success');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      showToast(err?.message || 'Failed to save habit', 'error');
    } finally {
      setLoading(false);
    }
  }

  const weekOptions = [1, 2, 3, 4, 5, 6, 7].map((num) => ({
    value: num,
    label: `${num} ${num === 1 ? 'day' : 'days'} / week`,
    icon: '🎯',
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="neo-box w-full max-w-md bg-[var(--sb-surface)] p-6 relative animate-scale-up shadow-[8px_8px_0px_var(--sb-shadow-color)]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[var(--sb-muted)] hover:text-[var(--sb-ink)]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded bg-[var(--sb-accent-orange-surface)] text-[var(--sb-accent-orange)] border-2 border-[var(--sb-border)] flex items-center justify-center shadow-[2px_2px_0px_var(--sb-shadow-color)]">
            <Flame className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-black text-[var(--sb-ink)]">
            {habit?.id ? 'Edit Habit' : 'Create New Habit'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--sb-ink)] mb-1">
              Habit Name *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Read 20 pages, Workout, Meditate"
              className="neo-input text-sm"
              autoFocus
            />
          </div>

          <div>
            <NeoSelect
              label="Weekly Target"
              value={targetPerWeek}
              onChange={(val) => setTargetPerWeek(Number(val))}
              options={weekOptions}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="neo-btn neo-btn-outline text-xs px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="neo-btn neo-btn-primary text-xs px-5 py-2"
            >
              {loading ? 'Saving...' : habit?.id ? 'Save Changes' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
