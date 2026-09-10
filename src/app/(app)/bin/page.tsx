'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ToastContext';
import { ConfirmModal } from '@/components/ConfirmModal';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Clock,
  CheckSquare,
  StickyNote,
  Flame,
  Calendar,
  Bell,
  ArchiveRestore,
} from 'lucide-react';

export default function BinPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [permanentDeleteId, setPermanentDeleteId] = useState<string | null>(null);

  const loadBin = useCallback(async () => {
    try {
      const data = await apiFetch('/bin');
      setItems(data.entries || data.bin || []);
    } catch (err: any) {
      showToast(err?.message || 'Failed to fetch recycle bin', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadBin();
  }, [loadBin]);

  async function handleRestore(id: string) {
    try {
      await apiFetch(`/bin/${id}/restore`, { method: 'POST' });
      showToast('Item restored successfully! 🎉', 'success');
      loadBin();
    } catch (err: any) {
      showToast(err?.message || 'Failed to restore item', 'error');
    }
  }

  async function handlePermanentDelete() {
    if (!permanentDeleteId) return;
    try {
      await apiFetch(`/bin/${permanentDeleteId}`, { method: 'DELETE' });
      showToast('Item permanently deleted', 'info');
      loadBin();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete item', 'error');
    } finally {
      setPermanentDeleteId(null);
    }
  }

  function getEntityIcon(type: string) {
    switch (type) {
      case 'task':
        return <CheckSquare className="w-4 h-4 text-[var(--sb-primary)]" />;
      case 'note':
        return <StickyNote className="w-4 h-4 text-[var(--sb-accent-cyan)]" />;
      case 'habit':
        return <Flame className="w-4 h-4 text-[var(--sb-accent-orange)]" />;
      case 'calendar_event':
        return <Calendar className="w-4 h-4 text-[var(--sb-accent-purple)]" />;
      case 'reminder':
        return <Bell className="w-4 h-4 text-[var(--sb-alert)]" />;
      default:
        return <Trash2 className="w-4 h-4 text-[var(--sb-muted)]" />;
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-black text-[var(--sb-ink)] tracking-tight flex items-center gap-2">
          <Trash2 className="w-6 h-6 text-[var(--sb-alert)]" />
          Recycle Bin
        </h1>
        <p className="text-xs text-[var(--sb-muted)] font-medium mt-1">
          Deleted items are kept here for 30 days before being automatically purged forever.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="neo-skeleton p-4 h-16 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="neo-skeleton-line w-8 h-8 rounded-md" />
                <div className="space-y-1.5 flex-1">
                  <div className="neo-skeleton-line h-4 w-1/3" />
                  <div className="neo-skeleton-line h-3 w-1/4" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="neo-skeleton-line h-8 w-20 rounded" />
                <div className="neo-skeleton-line h-8 w-20 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="neo-box p-12 text-center bg-[var(--sb-surface)]">
          <ArchiveRestore className="w-12 h-12 text-[var(--sb-muted)] mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-[var(--sb-ink)]">Recycle Bin is Empty</h3>
          <p className="text-xs text-[var(--sb-muted)] mt-1">No deleted notes, tasks, or habits found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const title = item.title || item.content || `Deleted ${item.entity_type}`;
            const autoPurgeDate = item.auto_purge_at
              ? new Date(item.auto_purge_at).toLocaleDateString()
              : 'in 30 days';

            return (
              <div
                key={item.id}
                className="neo-box p-4 bg-[var(--sb-surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="p-2 rounded bg-[var(--sb-surface-alt)] border-2 border-[var(--sb-border)] shrink-0">
                    {getEntityIcon(item.entity_type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="neo-badge bg-[var(--sb-surface-alt)] text-[var(--sb-ink)] text-[10px] uppercase font-mono">
                        {item.entity_type}
                      </span>
                      <h3 className="text-xs font-bold text-[var(--sb-ink)] truncate">{title}</h3>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono text-[var(--sb-muted)]">
                      <Clock className="w-3 h-3" />
                      <span>Auto-purges on: {autoPurgeDate}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleRestore(item.id)}
                    className="neo-btn neo-btn-outline py-1.5 px-3 text-xs"
                    title="Restore item"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[var(--sb-ok)]" />
                    <span>Restore</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPermanentDeleteId(item.id)}
                    className="neo-btn neo-btn-danger py-1.5 px-3 text-xs"
                    title="Delete permanently"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Forever</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Permanent Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(permanentDeleteId)}
        title="Permanently Delete Item?"
        message="This action CANNOT be undone. The item will be erased from the database permanently."
        confirmLabel="Delete Forever"
        isDanger
        onConfirm={handlePermanentDelete}
        onClose={() => setPermanentDeleteId(null)}
      />
    </div>
  );
}
