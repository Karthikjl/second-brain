'use client';

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

interface NeoDateTimePickerProps {
  label?: string;
  value: string; // "YYYY-MM-DDTHH:mm" or ISO string
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  align?: 'left' | 'right';
}

export function NeoDateTimePicker({
  label,
  value,
  onChange,
  placeholder = 'Select date & time...',
  required = false,
  className = '',
  align = 'left',
}: NeoDateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');
  const [activeTab, setActiveTab] = useState<'date' | 'time'>('date');
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Parse initial date & time from value
  const initialDate = value ? new Date(value) : null;
  const validInitialDate = initialDate && !isNaN(initialDate.getTime()) ? initialDate : null;

  const [viewDate, setViewDate] = useState<Date>(
    validInitialDate || new Date()
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(validInitialDate);

  // Time state (12-hour format)
  const initialHour24 = validInitialDate ? validInitialDate.getHours() : 9;
  const initialMinute = validInitialDate ? validInitialDate.getMinutes() : 0;

  const [hour12, setHour12] = useState<number>(
    initialHour24 % 12 === 0 ? 12 : initialHour24 % 12
  );
  const [minute, setMinute] = useState<number>(initialMinute);
  const [period, setPeriod] = useState<'AM' | 'PM'>(initialHour24 >= 12 ? 'PM' : 'AM');

  // Sync state if external value changes
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setSelectedDate(d);
        setViewDate(d);
        const h24 = d.getHours();
        setHour12(h24 % 12 === 0 ? 12 : h24 % 12);
        setMinute(d.getMinutes());
        setPeriod(h24 >= 12 ? 'PM' : 'AM');
      }
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  // Dynamically compute popover placement (flip to top if bottom has no room)
  useLayoutEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Popover is compact ~260px tall
      if (spaceBelow < 280 && spaceAbove > spaceBelow) {
        setPlacement('top');
      } else {
        setPlacement('bottom');
      }
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Helper to commit date and time to parent in YYYY-MM-DDTHH:mm format
  function commitDateTime(date: Date | null, h12: number, min: number, ampm: 'AM' | 'PM') {
    if (!date) {
      onChange('');
      return;
    }
    let h24 = h12 % 12;
    if (ampm === 'PM') h24 += 12;

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(h24).padStart(2, '0');
    const mm = String(min).padStart(2, '0');

    onChange(`${y}-${m}-${d}T${hh}:${mm}`);
  }

  function handleSelectDay(day: number) {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    setSelectedDate(newDate);
    commitDateTime(newDate, hour12, minute, period);
  }

  function handleTimeChange(newHour: number, newMin: number, newPeriod: 'AM' | 'PM') {
    setHour12(newHour);
    setMinute(newMin);
    setPeriod(newPeriod);
    const dateToUse = selectedDate || new Date();
    setSelectedDate(dateToUse);
    commitDateTime(dateToUse, newHour, newMin, newPeriod);
  }

  function handleQuickPreset(type: 'today' | 'tomorrow' | 'clear') {
    if (type === 'clear') {
      setSelectedDate(null);
      onChange('');
      setIsOpen(false);
      return;
    }

    const d = new Date();
    if (type === 'tomorrow') {
      d.setDate(d.getDate() + 1);
    }

    setSelectedDate(d);
    setViewDate(d);
    commitDateTime(d, hour12, minute, period);
  }

  // Month navigation
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const formattedDisplay = selectedDate
    ? `${selectedDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}, ${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`
    : '';

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-[var(--sb-ink)] mb-1">
          {label} {required && <span className="text-[var(--sb-alert)]">*</span>}
        </label>
      )}

      {/* Input Trigger Button */}
      <button
        type="button"
        onClick={() => {
          if (!isOpen) setActiveTab('date');
          setIsOpen(!isOpen);
        }}
        className={`w-full bg-[var(--sb-surface)] text-[var(--sb-ink)] border-2 border-[var(--sb-border)] rounded-md px-3 py-2 text-xs font-bold shadow-[2px_2px_0px_var(--sb-shadow-color)] flex items-center justify-between cursor-pointer select-none transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] focus:outline-none focus:ring-2 focus:ring-[var(--sb-primary)] ${
          isOpen ? 'ring-2 ring-[var(--sb-primary)] bg-[var(--sb-surface-alt)]' : ''
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon className="w-4 h-4 text-[var(--sb-accent-orange)] shrink-0" />
          <span className={formattedDisplay ? 'text-[var(--sb-ink)] font-bold' : 'text-[var(--sb-muted)] font-medium'}>
            {formattedDisplay || placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedDate ? (
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleQuickPreset('clear');
              }}
              className="p-1 text-[var(--sb-muted)] hover:text-[var(--sb-alert)] hover:bg-[var(--sb-surface-alt)] rounded transition cursor-pointer"
              title="Clear date"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          ) : (
            <Clock className="w-3.5 h-3.5 text-[var(--sb-muted)]" />
          )}
        </div>
      </button>

      {/* Compact Dropdown Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          style={{ zIndex: 9999 }}
          className={`absolute ${
            placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          } ${
            align === 'right' ? 'right-0' : 'left-0'
          } w-[290px] sm:w-[310px] max-w-[calc(100vw-2rem)] bg-[var(--sb-surface)] border-2 border-[var(--sb-border)] rounded-xl shadow-[8px_8px_0px_var(--sb-shadow-color)] p-3 animate-in fade-in zoom-in-95 duration-100 select-none`}
        >
          {/* Top Switcher Tabs (Date vs Time) */}
          <div className="flex items-center gap-1.5 p-1 bg-[var(--sb-surface-alt)] border-2 border-[var(--sb-border)] rounded-lg mb-2.5">
            <button
              type="button"
              onClick={() => setActiveTab('date')}
              className={`flex-1 py-1 px-2 rounded text-[11px] font-black flex items-center justify-center gap-1.5 transition ${
                activeTab === 'date'
                  ? 'bg-[var(--sb-primary)] text-[var(--sb-primary-ink)] shadow-[1px_1px_0px_var(--sb-shadow-color)] border border-[var(--sb-border)]'
                  : 'text-[var(--sb-muted)] hover:text-[var(--sb-ink)]'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>
                {selectedDate
                  ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : 'Date'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('time')}
              className={`flex-1 py-1 px-2 rounded text-[11px] font-black flex items-center justify-center gap-1.5 transition ${
                activeTab === 'time'
                  ? 'bg-[var(--sb-primary)] text-[var(--sb-primary-ink)] shadow-[1px_1px_0px_var(--sb-shadow-color)] border border-[var(--sb-border)]'
                  : 'text-[var(--sb-muted)] hover:text-[var(--sb-ink)]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                {String(hour12).padStart(2, '0')}:{String(minute).padStart(2, '0')} {period}
              </span>
            </button>
          </div>

          {/* TAB 1: DATE PICKER */}
          {activeTab === 'date' && (
            <div>
              {/* Month / Year header */}
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[var(--sb-border-light)]">
                <button
                  type="button"
                  onClick={() => setViewDate(new Date(year, month - 1, 1))}
                  className="p-1 rounded border border-[var(--sb-border)] bg-[var(--sb-surface-alt)] hover:bg-[var(--sb-primary)] hover:text-[var(--sb-primary-ink)] text-[var(--sb-ink)] transition"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-1">
                  <span className="text-xs font-black text-[var(--sb-ink)]">
                    {monthNames[month]}
                  </span>
                  <span className="text-xs font-bold text-[var(--sb-muted)]">
                    {year}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setViewDate(new Date(year, month + 1, 1))}
                  className="p-1 rounded border border-[var(--sb-border)] bg-[var(--sb-surface-alt)] hover:bg-[var(--sb-primary)] hover:text-[var(--sb-primary-ink)] text-[var(--sb-ink)] transition"
                  title="Next Month"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                  <span key={d} className="text-[10px] font-black text-[var(--sb-muted)] uppercase">
                    {d}
                  </span>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-1 text-center mb-2.5">
                {/* Prev month fill */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div
                    key={`prev-${i}`}
                    className="h-6 flex items-center justify-center text-[10px] text-[var(--sb-muted)]/30 font-medium"
                  >
                    {daysInPrevMonth - firstDayOfMonth + i + 1}
                  </div>
                ))}

                {/* Current month days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const isSelected =
                    selectedDate &&
                    selectedDate.getDate() === day &&
                    selectedDate.getMonth() === month &&
                    selectedDate.getFullYear() === year;

                  const isToday =
                    new Date().getDate() === day &&
                    new Date().getMonth() === month &&
                    new Date().getFullYear() === year;

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleSelectDay(day)}
                      className={`h-6 rounded text-xs font-bold flex items-center justify-center transition ${
                        isSelected
                          ? 'bg-[var(--sb-primary)] text-[var(--sb-primary-ink)] border-2 border-[var(--sb-border)] font-black shadow-[1px_1px_0px_var(--sb-shadow-color)]'
                          : isToday
                          ? 'border border-dashed border-[var(--sb-accent-orange)] text-[var(--sb-ink)] bg-[var(--sb-surface-alt)] font-black'
                          : 'text-[var(--sb-ink)] hover:bg-[var(--sb-surface-alt)]'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Quick Presets & Switch to Time */}
              <div className="pt-2 border-t border-[var(--sb-border-light)] flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('today')}
                    className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--sb-surface-alt)] hover:bg-[var(--sb-primary)] hover:text-[var(--sb-primary-ink)] border border-[var(--sb-border)] text-[var(--sb-ink)] transition"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('tomorrow')}
                    className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--sb-surface-alt)] hover:bg-[var(--sb-primary)] hover:text-[var(--sb-primary-ink)] border border-[var(--sb-border)] text-[var(--sb-ink)] transition"
                  >
                    Tomorrow
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('time')}
                  className="text-[10px] font-black text-[var(--sb-ink)] hover:text-[var(--sb-primary-hover)] flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[var(--sb-surface-alt)] transition"
                >
                  <span>Set Time</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: TIME PICKER */}
          {activeTab === 'time' && (
            <div className="py-1">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-black uppercase text-[var(--sb-muted)] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[var(--sb-accent-cyan)]" /> Choose Time
                </span>

                {/* AM/PM Toggle */}
                <div className="flex border-2 border-[var(--sb-border)] rounded-md overflow-hidden bg-[var(--sb-surface-alt)]">
                  <button
                    type="button"
                    onClick={() => handleTimeChange(hour12, minute, 'AM')}
                    className={`px-3 py-1 text-xs font-black transition ${
                      period === 'AM'
                        ? 'bg-[var(--sb-primary)] text-[var(--sb-primary-ink)]'
                        : 'text-[var(--sb-muted)] hover:text-[var(--sb-ink)]'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTimeChange(hour12, minute, 'PM')}
                    className={`px-3 py-1 text-xs font-black transition ${
                      period === 'PM'
                        ? 'bg-[var(--sb-primary)] text-[var(--sb-primary-ink)]'
                        : 'text-[var(--sb-muted)] hover:text-[var(--sb-ink)]'
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>

              {/* Hour & Minute Selectors */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1">
                  <label className="block text-[9px] font-black uppercase text-[var(--sb-muted)] mb-0.5">
                    Hour
                  </label>
                  <select
                    value={hour12}
                    onChange={(e) => handleTimeChange(Number(e.target.value), minute, period)}
                    className="w-full bg-[var(--sb-surface-alt)] text-[var(--sb-ink)] border-2 border-[var(--sb-border)] rounded-md px-2 py-1.5 text-xs font-bold cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--sb-primary)]"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                      <option key={h} value={h}>
                        {String(h).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>

                <span className="font-black text-[var(--sb-ink)] text-base mt-4">:</span>

                <div className="flex-1">
                  <label className="block text-[9px] font-black uppercase text-[var(--sb-muted)] mb-0.5">
                    Minute
                  </label>
                  <select
                    value={minute}
                    onChange={(e) => handleTimeChange(hour12, Number(e.target.value), period)}
                    className="w-full bg-[var(--sb-surface-alt)] text-[var(--sb-ink)] border-2 border-[var(--sb-border)] rounded-md px-2 py-1.5 text-xs font-bold cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--sb-primary)]"
                  >
                    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                      <option key={m} value={m}>
                        {String(m).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-4 gap-1 mb-3">
                {[
                  { label: '9 AM', h: 9, m: 0, p: 'AM' as const },
                  { label: '12 PM', h: 12, m: 0, p: 'PM' as const },
                  { label: '5 PM', h: 5, m: 0, p: 'PM' as const },
                  { label: '8 PM', h: 8, m: 0, p: 'PM' as const },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => handleTimeChange(chip.h, chip.m, chip.p)}
                    className={`text-[10px] font-bold py-1 rounded border ${
                      hour12 === chip.h && minute === chip.m && period === chip.p
                        ? 'bg-[var(--sb-primary)] text-[var(--sb-primary-ink)] border-[var(--sb-border)] font-black'
                        : 'bg-[var(--sb-surface-alt)] text-[var(--sb-muted)] hover:text-[var(--sb-ink)] border-[var(--sb-border-light)]'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Back to Date button */}
              <div className="pt-2 border-t border-[var(--sb-border-light)] flex justify-start">
                <button
                  type="button"
                  onClick={() => setActiveTab('date')}
                  className="text-[10px] font-black text-[var(--sb-ink)] hover:text-[var(--sb-primary-hover)] flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[var(--sb-surface-alt)] transition"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Back to Date</span>
                </button>
              </div>
            </div>
          )}

          {/* Bottom Global Footer (Apply / Clear) */}
          <div className="mt-2 pt-2 border-t-2 border-[var(--sb-border-light)] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => handleQuickPreset('clear')}
              className="text-[11px] font-bold text-[var(--sb-alert)] hover:underline px-1 py-1"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="neo-btn neo-btn-primary text-xs py-1 px-4 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Done</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
