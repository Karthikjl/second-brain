'use client';

import React, { useState, useEffect } from 'react';
import { X, StickyNote, Tag, Check, ArrowRight } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from './ToastContext';

export interface NoteItem {
  id?: string;
  content: string;
  tags?: string[] | string;
  converted_task_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface NoteModalProps {
  isOpen: boolean;
  note?: NoteItem | null;
  onClose: () => void;
  onSaved: () => void;
}

export function NoteModal({ isOpen, note, onClose, onSaved }: NoteModalProps) {
  const { showToast } = useToast();
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (note) {
      setContent(note.content || '');
      let parsedTags: string[] = [];
      if (Array.isArray(note.tags)) {
        parsedTags = note.tags;
      } else if (typeof note.tags === 'string') {
        try {
          parsedTags = JSON.parse(note.tags);
        } catch {
          parsedTags = note.tags ? note.tags.split(',') : [];
        }
      }
      setTagsInput(parsedTags.join(', '));
    } else {
      setContent('');
      setTagsInput('');
    }
  }, [note, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    const tagsArray = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (note?.id) {
        await apiFetch(`/notes/${note.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            content: content.trim(),
            tags: tagsArray,
          }),
        });
        showToast('Note updated successfully!', 'success');
      } else {
        await apiFetch('/notes', {
          method: 'POST',
          body: JSON.stringify({
            content: content.trim(),
            tags: tagsArray,
          }),
        });
        showToast('Note created successfully!', 'success');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      showToast(err?.message || 'Failed to save note', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="neo-box w-full max-w-lg bg-[var(--sb-surface)] p-6 relative animate-scale-up shadow-[8px_8px_0px_var(--sb-shadow-color)]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[var(--sb-muted)] hover:text-[var(--sb-ink)]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded bg-[var(--sb-accent-cyan-surface)] text-[var(--sb-accent-cyan)] border-2 border-[var(--sb-border)] flex items-center justify-center shadow-[2px_2px_0px_var(--sb-shadow-color)]">
            <StickyNote className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-black text-[var(--sb-ink)]">
            {note?.id ? 'Edit Note' : 'Capture New Note'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--sb-ink)] mb-1">
              Note Content *
            </label>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Capture knowledge, ideas, meetings, thoughts..."
              rows={6}
              className="neo-input text-sm font-sans"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--sb-ink)] mb-1">
              Tags (comma separated)
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-[var(--sb-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="ideas, work, book, personal"
                className="neo-input pl-9 text-xs"
              />
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
              disabled={loading || !content.trim()}
              className="neo-btn neo-btn-primary text-xs px-5 py-2"
            >
              {loading ? 'Saving...' : note?.id ? 'Save Changes' : 'Create Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
