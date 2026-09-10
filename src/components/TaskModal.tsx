'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Calendar, AlertCircle, Sparkles } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from './ToastContext';
import { NeoSelect } from './NeoSelect';
import { NeoDateTimePicker } from './NeoDateTimePicker';

export interface TaskItem {
  id?: string;
  title: string;
  description?: string;
  status?: 'pending' | 'done';
  urgent?: boolean | number;
  important?: boolean | number;
  due_at?: string | null;
}

interface TaskModalProps {
  isOpen: boolean;
  task?: TaskItem | null;
  onClose: () => void;
  onSaved: () => void;
}

export function TaskModal({ isOpen, task, onClose, onSaved }: TaskModalProps) {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [important, setImportant] = useState(false);
  const [dueAt, setDueAt] = useState('');
  const [status, setStatus] = useState<'pending' | 'done'>('pending');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setUrgent(Boolean(task.urgent));
      setImportant(Boolean(task.important));
      setDueAt(task.due_at ? task.due_at.slice(0, 16) : '');
      setStatus(task.status || 'pending');
    } else {
      setTitle('');
      setDescription('');
      setUrgent(false);
      setImportant(false);
      setDueAt('');
      setStatus('pending');
    }
  }, [task, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      if (task?.id) {
        await apiFetch(`/tasks/${task.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            title: title.trim(),
            description,
            urgent: urgent ? 1 : 0,
            important: important ? 1 : 0,
            due_at: dueAt ? new Date(dueAt).toISOString() : null,
            status,
          }),
        });
        showToast('Task updated successfully!', 'success');
      } else {
        await apiFetch('/tasks', {
          method: 'POST',
          body: JSON.stringify({
            title: title.trim(),
            description,
            urgent: urgent ? 1 : 0,
            important: important ? 1 : 0,
            due_at: dueAt ? new Date(dueAt).toISOString() : null,
            status,
          }),
        });
        showToast('Task created successfully!', 'success');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      showToast(err?.message || 'Failed to save task', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="neo-box w-full max-w-lg bg-[var(--sb-surface)] p-6 relative animate-scale-up shadow-[8px_8px_0px_var(--sb-shadow-color)] my-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[var(--sb-muted)] hover:text-[var(--sb-ink)]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded bg-[var(--sb-primary)] border-2 border-[var(--sb-border)] flex items-center justify-center shadow-[2px_2px_0px_var(--sb-shadow-color)]">
            <CheckSquare className="w-4 h-4 text-[var(--sb-ink)]" />
          </div>
          <h2 className="text-lg font-black text-[var(--sb-ink)]">
            {task?.id ? 'Edit Task' : 'Create New Task'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--sb-ink)] mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="neo-input text-sm"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--sb-ink)] mb-1">
              Description / Notes
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details, context or steps..."
              rows={3}
              className="neo-input text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <NeoDateTimePicker
                label="Due Date & Time"
                value={dueAt}
                onChange={(val) => setDueAt(val)}
                placeholder="Set due date & time..."
              />
            </div>

            <div>
              <NeoSelect
                label="Status"
                value={status}
                onChange={(val) => setStatus(val as any)}
                options={[
                  { value: 'pending', label: 'Pending', icon: '⏳' },
                  { value: 'done', label: 'Completed', icon: '✅' },
                ]}
              />
            </div>
          </div>

          {/* Eisenhower Matrix toggles */}
          <div className="p-3 bg-[var(--sb-surface-alt)] border-2 border-[var(--sb-border)] rounded-md space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--sb-muted)] block">
              Priority Matrix (Eisenhower)
            </span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={urgent}
                  onChange={(e) => setUrgent(e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-[var(--sb-border)] accent-[var(--sb-primary)]"
                />
                <span className="text-[var(--sb-alert)]">Urgent</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={important}
                  onChange={(e) => setImportant(e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-[var(--sb-border)] accent-[var(--sb-primary)]"
                />
                <span className="text-[var(--sb-ok)]">Important</span>
              </label>
            </div>
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
              {loading ? 'Saving...' : task?.id ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
