'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ToastContext';
import { NoteModal, NoteItem } from '@/components/NoteModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import {
  StickyNote,
  Plus,
  Search,
  Tag,
  Trash2,
  Edit2,
  ArrowRight,
  CheckSquare,
  Sparkles,
  Layers,
} from 'lucide-react';

import { NeoInput } from '@/components/NeoInput';

export default function NotesPage() {
  const { showToast } = useToast();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    try {
      const data = await apiFetch('/notes');
      setNotes(data.notes || []);
    } catch (err: any) {
      showToast(err?.message || 'Failed to fetch notes', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadNotes();
    const handleUpdate = () => loadNotes();
    window.addEventListener('sb-data-updated', handleUpdate);
    return () => window.removeEventListener('sb-data-updated', handleUpdate);
  }, [loadNotes]);

  // Extract all unique tags
  const allTags = Array.from(
    new Set(
      notes.flatMap((n) => {
        if (Array.isArray(n.tags)) return n.tags;
        try {
          return JSON.parse(n.tags || '[]');
        } catch {
          return [];
        }
      })
    )
  );

  async function handleConvertToTask(noteId: string) {
    try {
      await apiFetch(`/notes/${noteId}/convert`, { method: 'POST' });
      showToast('Note converted to task! Check Tasks tab.', 'success');
      loadNotes();
    } catch (err: any) {
      showToast(err?.message || 'Failed to convert note to task', 'error');
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await apiFetch(`/notes/${deleteId}`, { method: 'DELETE' });
      showToast('Note moved to Recycle Bin', 'success');
      loadNotes();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete note', 'error');
    } finally {
      setDeleteId(null);
    }
  }

  const filteredNotes = notes.filter((n) => {
    let noteTags: string[] = [];
    if (Array.isArray(n.tags)) noteTags = n.tags;
    else {
      try {
        noteTags = JSON.parse(n.tags || '[]');
      } catch {
        noteTags = [];
      }
    }

    if (selectedTag && !noteTags.includes(selectedTag)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchContent = n.content?.toLowerCase().includes(q);
      const matchTags = noteTags.some((t) => t.toLowerCase().includes(q));
      if (!matchContent && !matchTags) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--sb-ink)] tracking-tight flex items-center gap-2">
            <StickyNote className="w-6 h-6 text-[var(--sb-accent-cyan)]" />
            Notes & Knowledge
          </h1>
          <p className="text-xs text-[var(--sb-muted)] font-medium mt-1">
            Capture thoughts, meeting logs, reading summaries, and quickly convert ideas into tasks.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingNote(null);
            setModalOpen(true);
          }}
          className="neo-btn neo-btn-primary text-xs py-2 px-4 shadow-[2px_2px_0px_var(--sb-shadow-color)]"
        >
          <Plus className="w-4 h-4" />
          <span>New Note</span>
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
            placeholder="Search notes or tags..."
          />
        </div>

        {/* Tag Pills */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto py-1">
          <button
            type="button"
            onClick={() => setSelectedTag(null)}
            className={`px-3 py-1 text-xs font-bold rounded border-2 transition-all ${
              selectedTag === null
                ? 'bg-[var(--sb-primary)] text-[var(--sb-primary-ink)] border-[var(--sb-border)] shadow-[1px_1px_0px_var(--sb-shadow-color)]'
                : 'bg-[var(--sb-surface-alt)] border-transparent text-[var(--sb-muted)] hover:text-[var(--sb-ink)]'
            }`}
          >
            All ({notes.length})
          </button>

          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
              className={`px-2.5 py-1 text-xs font-bold rounded border-2 transition-all flex items-center gap-1 ${
                selectedTag === tag
                  ? 'bg-[var(--sb-accent-cyan)] text-[var(--sb-ink)] border-[var(--sb-border)] shadow-[1px_1px_0px_var(--sb-shadow-color)]'
                  : 'bg-[var(--sb-surface-alt)] border-transparent text-[var(--sb-muted)] hover:text-[var(--sb-ink)]'
              }`}
            >
              <Tag className="w-3 h-3" />
              <span>{tag}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notes Masonry / Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="neo-skeleton p-5 h-44 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="neo-skeleton-line h-3.5 w-full" />
                <div className="neo-skeleton-line h-3.5 w-4/5" />
                <div className="neo-skeleton-line h-3.5 w-2/3" />
              </div>
              <div className="flex justify-between items-center pt-2">
                <div className="neo-skeleton-line h-4 w-16 rounded" />
                <div className="neo-skeleton-line h-3 w-12" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="neo-box p-12 text-center bg-[var(--sb-surface)]">
          <StickyNote className="w-12 h-12 text-[var(--sb-muted)] mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-bold text-[var(--sb-ink)]">No notes found</h3>
          <p className="text-xs text-[var(--sb-muted)] mt-1 max-w-sm mx-auto">
            {searchQuery ? 'No notes match your search.' : 'Capture your first note by clicking "+ New Note"!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => {
            let noteTags: string[] = [];
            if (Array.isArray(note.tags)) noteTags = note.tags;
            else {
              try {
                noteTags = JSON.parse(note.tags || '[]');
              } catch {
                noteTags = [];
              }
            }

            return (
              <div
                key={note.id}
                className="neo-box p-5 bg-[var(--sb-surface)] flex flex-col justify-between gap-4 transition-all hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_var(--sb-shadow-color)]"
              >
                <div>
                  <p className="text-xs text-[var(--sb-ink)] whitespace-pre-wrap leading-relaxed font-sans">
                    {note.content}
                  </p>
                </div>

                <div className="pt-3 border-t-2 border-[var(--sb-border-light)] space-y-3">
                  {/* Tag Chips */}
                  {noteTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {noteTags.map((t) => (
                        <span
                          key={t}
                          onClick={() => setSelectedTag(t)}
                          className="neo-badge bg-[var(--sb-surface-alt)] text-[var(--sb-ink)] text-[10px] cursor-pointer hover:bg-[var(--sb-accent-cyan-surface)]"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions footer */}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleConvertToTask(note.id)}
                      disabled={Boolean(note.converted_task_id)}
                      className={`text-[11px] font-bold flex items-center gap-1 transition-colors ${
                        note.converted_task_id
                          ? 'text-[var(--sb-ok)] cursor-default'
                          : 'text-[var(--sb-muted)] hover:text-[var(--sb-ink)]'
                      }`}
                      title={note.converted_task_id ? 'Already converted to task' : 'Convert note into a task'}
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>{note.converted_task_id ? 'Converted ✓' : 'To Task'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNote(note);
                          setModalOpen(true);
                        }}
                        className="p-1 rounded hover:bg-[var(--sb-surface-alt)] text-[var(--sb-muted)] hover:text-[var(--sb-ink)] transition-colors"
                        title="Edit Note"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(note.id)}
                        className="p-1 rounded hover:bg-[var(--sb-alert-surface)] text-[var(--sb-alert)] transition-colors"
                        title="Delete Note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Note Creation / Edit Modal */}
      <NoteModal
        isOpen={modalOpen}
        note={editingNote}
        onClose={() => {
          setModalOpen(false);
          setEditingNote(null);
        }}
        onSaved={loadNotes}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteId)}
        title="Move Note to Trash?"
        message="This note will be moved to the Recycle Bin and can be restored within 30 days."
        confirmLabel="Move to Trash"
        isDanger
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
