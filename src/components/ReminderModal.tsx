'use client';

import React, { useState, useEffect } from 'react';
import { X, Bell } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from './ToastContext';
import { NeoDateTimePicker } from './NeoDateTimePicker';

export interface ReminderItem {
  id?: string;
  title: string;
  remind_at: string;
  is_done?: number | boolean;
}

interface ReminderModalProps {
  isOpen: boolean;
  reminder?: ReminderItem | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ReminderModal({ isOpen, reminder, onClose, onSaved }: ReminderModalProps) {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [remindAt, setRemindAt] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (reminder) {
      setTitle(reminder.title || '');
      setRemindAt(reminder.remind_at ? reminder.remind_at.slice(0, 16) : '');
    } else {
      setTitle('');
      // Default to 1 hour from now
      const d = new Date(Date.now() + 60 * 60 * 1000);
      setRemindAt(d.toISOString().slice(0, 16));
    }
  }, [reminder, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !remindAt) return;

    setLoading(true);
    try {
      if (reminder?.id) {
        await apiFetch(`/reminders/${reminder.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            title: title.trim(),
            remind_at: new Date(remindAt).toISOString(),
          }),
        });
        showToast('Reminder updated successfully!', 'success');
      } else {
        await apiFetch('/reminders', {
          method: 'POST',
          body: JSON.stringify({
            title: title.trim(),
            remind_at: new Date(remindAt).toISOString(),
          }),
        });
        showToast('Reminder set successfully!', 'success');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      showToast(err?.message || 'Failed to save reminder', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="neo-box w-full max-w-md bg-[var(--sb-surface)] p-6 relative animate-scale-up shadow-[8px_8px_0px_var(--sb-shadow-color)] my-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[var(--sb-muted)] hover:text-[var(--sb-ink)]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded bg-[var(--sb-primary)] border-2 border-[var(--sb-border)] flex items-center justify-center shadow-[2px_2px_0px_var(--sb-shadow-color)]">
            <Bell className="w-4 h-4 text-[var(--sb-ink)]" />
          </div>
          <h2 className="text-lg font-black text-[var(--sb-ink)]">
            {reminder?.id ? 'Edit Reminder' : 'Set New Reminder'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--sb-ink)] mb-1">
              Reminder Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Call dentist, Pay credit card bill"
              className="neo-input text-sm"
              autoFocus
            />
          </div>

          <div>
            <NeoDateTimePicker
              label="Remind At Date & Time"
              required
              value={remindAt}
              onChange={(val) => setRemindAt(val)}
              placeholder="Pick a reminder date & time..."
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
              disabled={loading || !title.trim() || !remindAt}
              className="neo-btn neo-btn-primary text-xs px-5 py-2"
            >
              {loading ? 'Saving...' : reminder?.id ? 'Save Changes' : 'Set Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
