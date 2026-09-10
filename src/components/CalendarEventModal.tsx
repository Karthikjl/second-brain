'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, MapPin } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from './ToastContext';
import { NeoDateTimePicker } from './NeoDateTimePicker';

export interface CalendarEventItem {
  id?: string;
  title: string;
  starts_at: string;
  ends_at?: string | null;
  location?: string | null;
}

interface CalendarEventModalProps {
  isOpen: boolean;
  event?: CalendarEventItem | null;
  initialDate?: string;
  onClose: () => void;
  onSaved: () => void;
}

export function CalendarEventModal({
  isOpen,
  event,
  initialDate,
  onClose,
  onSaved,
}: CalendarEventModalProps) {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setStartsAt(event.starts_at ? event.starts_at.slice(0, 16) : '');
      setEndsAt(event.ends_at ? event.ends_at.slice(0, 16) : '');
      setLocation(event.location || '');
    } else {
      setTitle('');
      const defaultStart = initialDate ? `${initialDate}T09:00` : '';
      const defaultEnd = initialDate ? `${initialDate}T10:00` : '';
      setStartsAt(defaultStart);
      setEndsAt(defaultEnd);
      setLocation('');
    }
  }, [event, initialDate, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !startsAt) return;

    setLoading(true);
    try {
      if (event?.id) {
        await apiFetch(`/calendar-events/${event.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            title: title.trim(),
            starts_at: new Date(startsAt).toISOString(),
            ends_at: endsAt ? new Date(endsAt).toISOString() : null,
            location: location.trim() || null,
          }),
        });
        showToast('Event updated successfully!', 'success');
      } else {
        await apiFetch('/calendar-events', {
          method: 'POST',
          body: JSON.stringify({
            title: title.trim(),
            starts_at: new Date(startsAt).toISOString(),
            ends_at: endsAt ? new Date(endsAt).toISOString() : null,
            location: location.trim() || null,
          }),
        });
        showToast('Event scheduled successfully!', 'success');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      showToast(err?.message || 'Failed to save event', 'error');
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
          <div className="w-8 h-8 rounded bg-[var(--sb-accent-purple-surface)] text-[var(--sb-accent-purple)] border-2 border-[var(--sb-border)] flex items-center justify-center shadow-[2px_2px_0px_var(--sb-shadow-color)]">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-black text-[var(--sb-ink)]">
            {event?.id ? 'Edit Event' : 'Schedule Event'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--sb-ink)] mb-1">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sprint Planning, Doctor Appointment"
              className="neo-input text-sm"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <NeoDateTimePicker
                label="Starts At"
                required
                value={startsAt}
                onChange={(val) => setStartsAt(val)}
                placeholder="Start date & time..."
                align="left"
              />
            </div>

            <div>
              <NeoDateTimePicker
                label="Ends At"
                value={endsAt}
                onChange={(val) => setEndsAt(val)}
                placeholder="Optional end date..."
                align="right"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--sb-ink)] mb-1">
              Location / Link
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[var(--sb-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Room 402, Google Meet, or Zoom Link"
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
              disabled={loading || !title.trim() || !startsAt}
              className="neo-btn neo-btn-primary text-xs px-5 py-2"
            >
              {loading ? 'Saving...' : event?.id ? 'Save Changes' : 'Schedule Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
