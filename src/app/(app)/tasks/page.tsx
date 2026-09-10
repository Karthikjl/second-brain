'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ToastContext';
import { TaskModal, TaskItem } from '@/components/TaskModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  AlertTriangle,
  Star,
  CheckCircle2,
} from 'lucide-react';

import { NeoInput } from '@/components/NeoInput';
import { NeoSelect } from '@/components/NeoSelect';

export default function TasksPage() {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'done'>('pending');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      const data = await apiFetch('/tasks');
      setTasks(data.tasks || []);
    } catch (err: any) {
      showToast(err?.message || 'Failed to fetch tasks', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadTasks();
    const handleUpdate = () => loadTasks();
    window.addEventListener('sb-data-updated', handleUpdate);
    return () => window.removeEventListener('sb-data-updated', handleUpdate);
  }, [loadTasks]);

  async function toggleStatus(task: any) {
    const nextStatus = task.status === 'done' ? 'pending' : 'done';
    try {
      await apiFetch(`/tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      loadTasks();
      showToast(`Task marked as ${nextStatus}!`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update status', 'error');
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await apiFetch(`/tasks/${deleteId}`, { method: 'DELETE' });
      showToast('Task moved to Recycle Bin', 'success');
      loadTasks();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete task', 'error');
    } finally {
      setDeleteId(null);
    }
  }

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'urgent', label: 'Urgent', icon: '🔥' },
    { value: 'important', label: 'Important', icon: '⭐' },
    { value: 'matrix', label: 'Urgent & Important (Do First)', icon: '⚡' },
  ];

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus === 'pending' && t.status === 'done') return false;
    if (filterStatus === 'done' && t.status !== 'done') return false;

    if (filterPriority === 'urgent' && !t.urgent) return false;
    if (filterPriority === 'important' && !t.important) return false;
    if (filterPriority === 'matrix' && (!t.urgent || !t.important)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title?.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--sb-ink)] tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-[var(--sb-primary)]" />
            Tasks
          </h1>
          <p className="text-xs text-[var(--sb-muted)] font-medium mt-1">
            Organize, prioritize, and check off your to-dos with the Eisenhower Matrix.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingTask(null);
            setModalOpen(true);
          }}
          className="neo-btn neo-btn-primary text-xs py-2 px-4 shadow-[2px_2px_0px_var(--sb-shadow-color)]"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="neo-box p-4 bg-[var(--sb-surface)] flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="w-full md:w-80">
          <NeoInput
            icon={<Search className="w-4 h-4" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
          />
        </div>

        {/* Status & Priority Filter */}
        <div className="flex items-center gap-3 w-full md:w-auto overflow-visible">
          <div className="flex bg-[var(--sb-surface-alt)] p-1 rounded-md border-2 border-[var(--sb-border)]">
            {(['pending', 'done', 'all'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 text-xs font-bold rounded transition-all capitalize ${
                  filterStatus === st
                    ? 'bg-[var(--sb-surface)] border-2 border-[var(--sb-border)] shadow-[1px_1px_0px_var(--sb-shadow-color)] text-[var(--sb-ink)]'
                    : 'text-[var(--sb-muted)] hover:text-[var(--sb-ink)]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Reusable NeoSelect */}
          <div className="w-56">
            <NeoSelect
              value={filterPriority}
              onChange={(val) => setFilterPriority(String(val))}
              options={priorityOptions}
            />
          </div>
        </div>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="neo-skeleton p-4 h-16 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="neo-skeleton-line w-5 h-5 rounded" />
                <div className="space-y-1.5 flex-1">
                  <div className="neo-skeleton-line h-4 w-1/3" />
                  <div className="neo-skeleton-line h-2.5 w-1/2" />
                </div>
              </div>
              <div className="neo-skeleton-line h-5 w-16 rounded" />
            </div>
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="neo-box p-12 text-center bg-[var(--sb-surface)]">
          <CheckCircle2 className="w-12 h-12 text-[var(--sb-muted)] mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-bold text-[var(--sb-ink)]">No tasks found</h3>
          <p className="text-xs text-[var(--sb-muted)] mt-1 max-w-sm mx-auto">
            {searchQuery ? 'No tasks match your search query.' : 'You have no tasks matching this filter. Click "+ New Task" to add one!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`neo-box p-4 bg-[var(--sb-surface)] flex items-start justify-between gap-4 transition-all hover:translate-x-[2px] ${
                task.status === 'done' ? 'opacity-60 bg-[var(--sb-surface-alt)]' : ''
              }`}
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={task.status === 'done'}
                  onChange={() => toggleStatus(task)}
                  className="w-5 h-5 mt-0.5 rounded border-2 border-[var(--sb-border)] accent-[var(--sb-primary)] cursor-pointer shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3
                      className={`text-sm font-bold text-[var(--sb-ink)] ${
                        task.status === 'done' ? 'line-through text-[var(--sb-muted)]' : ''
                      }`}
                    >
                      {task.title}
                    </h3>

                    {task.urgent === 1 && (
                      <span className="neo-badge bg-[var(--sb-alert-surface)] text-[var(--sb-alert)] text-[10px]">
                        URGENT
                      </span>
                    )}

                    {task.important === 1 && (
                      <span className="neo-badge bg-[var(--sb-accent-cyan-surface)] text-[var(--sb-accent-cyan)] text-[10px]">
                        IMPORTANT
                      </span>
                    )}
                  </div>

                  {task.description && (
                    <p className="text-xs text-[var(--sb-muted)] mt-1 whitespace-pre-wrap">
                      {task.description}
                    </p>
                  )}

                  {task.due_at && (
                    <div className="flex items-center gap-1.5 mt-2 text-[11px] font-mono text-[var(--sb-muted)]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Due: {new Date(task.due_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTask(task);
                    setModalOpen(true);
                  }}
                  className="p-1.5 rounded hover:bg-[var(--sb-surface-alt)] text-[var(--sb-muted)] hover:text-[var(--sb-ink)] transition-colors"
                  title="Edit Task"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteId(task.id)}
                  className="p-1.5 rounded hover:bg-[var(--sb-alert-surface)] text-[var(--sb-alert)] transition-colors"
                  title="Delete Task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Creation / Edit Modal */}
      <TaskModal
        isOpen={modalOpen}
        task={editingTask}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
        onSaved={loadTasks}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteId)}
        title="Move Task to Trash?"
        message="This task will be moved to the Recycle Bin and can be restored within 30 days."
        confirmLabel="Move to Trash"
        isDanger
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
