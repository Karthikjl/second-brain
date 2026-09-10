'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface NeoSelectOption {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
}

export interface NeoSelectProps {
  label?: string;
  value: string | number;
  onChange: (value: any) => void;
  options: NeoSelectOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export function NeoSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  icon,
  disabled = false,
  className = '',
  containerClassName = '',
  searchable,
  searchPlaceholder = 'Search...',
}: NeoSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Automatically enable search if options count is 6 or more unless explicitly set
  const isSearchable = searchable !== undefined ? searchable : options.length > 5;

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        String(opt.value).toLowerCase().includes(q)
    );
  }, [options, searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      // Auto focus search input
      if (isSearchable) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      }
    } else {
      setSearchQuery('');
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSearchable]);

  function handleSelect(optValue: string | number) {
    onChange(optValue);
    setIsOpen(false);
    setSearchQuery('');
  }

  return (
    <div className={`relative w-full ${containerClassName}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-[var(--sb-ink)] mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full bg-[var(--sb-surface)] text-[var(--sb-ink)] border-2 border-[var(--sb-border)] rounded-md px-3 py-2 text-xs font-bold flex items-center justify-between gap-2 shadow-[2px_2px_0px_var(--sb-shadow-color)] transition-all select-none hover:bg-[var(--sb-surface-alt)] ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${isOpen ? 'shadow-[3px_3px_0px_var(--sb-shadow-color)] translate-x-[-1px] translate-y-[-1px]' : ''} ${className}`}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="text-[var(--sb-muted)] shrink-0">{icon}</span>}
          {selectedOption ? (
            <div className="flex items-center gap-1.5 truncate">
              {selectedOption.icon && <span className="shrink-0">{selectedOption.icon}</span>}
              <span className="truncate">{selectedOption.label}</span>
              {selectedOption.badge && (
                <span className="neo-badge text-[9px] bg-[var(--sb-surface-alt)]">
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-[var(--sb-muted)] font-normal truncate">{placeholder}</span>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-[var(--sb-muted)] shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-[var(--sb-ink)]' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[var(--sb-surface)] border-2 border-[var(--sb-border)] rounded-md shadow-[4px_4px_0px_var(--sb-shadow-color)] max-h-64 flex flex-col p-1 animate-scale-up">
          {/* Search Input */}
          {isSearchable && (
            <div className="p-1 pb-1.5 border-b border-[var(--sb-border-light)] mb-1 sticky top-0 bg-[var(--sb-surface)] z-10">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-[var(--sb-muted)] absolute left-2.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-[var(--sb-surface-alt)] text-[var(--sb-ink)] placeholder-[var(--sb-muted)] text-xs font-medium pl-8 pr-7 py-1.5 rounded border border-[var(--sb-border)] focus:outline-none focus:ring-1 focus:ring-[var(--sb-primary)]"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filteredOptions.length > 0) {
                      e.preventDefault();
                      handleSelect(filteredOptions[0].value);
                    }
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-2 text-[var(--sb-muted)] hover:text-[var(--sb-ink)] p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="overflow-y-auto max-h-52 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-[var(--sb-muted)] font-medium">
                {searchQuery ? `No results for "${searchQuery}"` : 'No options available'}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);

                return (
                  <div
                    key={String(opt.value)}
                    onClick={() => handleSelect(opt.value)}
                    className={`px-2.5 py-1.5 rounded text-xs font-bold flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[var(--sb-primary)] text-[var(--sb-primary-ink)] shadow-[1px_1px_0px_var(--sb-shadow-color)] border border-[var(--sb-border)]'
                        : 'text-[var(--sb-ink)] hover:bg-[var(--sb-surface-alt)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <span className="truncate">{opt.label}</span>
                      {opt.badge && (
                        <span className="neo-badge text-[9px] bg-[var(--sb-surface-alt)] ml-1">
                          {opt.badge}
                        </span>
                      )}
                    </div>

                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
