'use client';

import React, { useState, useEffect } from 'react';
import { Menu, Plus, Bot, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  title?: string;
  onOpenMobileSidebar: () => void;
  onQuickCreateTask?: () => void;
  onQuickCreateNote?: () => void;
}

export function Header({
  title = 'Second Brain',
  onOpenMobileSidebar,
  onQuickCreateTask,
  onQuickCreateNote,
}: HeaderProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const saved = (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    setTheme(saved);

    const handleThemeChange = () => {
      const current = (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
      setTheme(current);
    };

    window.addEventListener('theme-change', handleThemeChange);
    return () => window.removeEventListener('theme-change', handleThemeChange);
  }, []);

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
    window.dispatchEvent(new Event('theme-change'));
  }

  return (
    <header className="sticky top-0 z-30 h-16 bg-[var(--sb-surface)] border-b-2 border-[var(--sb-border)] px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="p-2 md:hidden neo-btn-outline rounded border-2 border-[var(--sb-border)] shadow-[2px_2px_0px_var(--sb-shadow-color)]"
        >
          <Menu className="w-5 h-5 text-[var(--sb-ink)]" />
        </button>
        <h1 className="text-lg md:text-xl font-black text-[var(--sb-ink)] tracking-tight">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2.5">
        {onQuickCreateNote && (
          <button
            type="button"
            onClick={onQuickCreateNote}
            className="hidden sm:inline-flex neo-btn neo-btn-outline py-1.5 px-3 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Note</span>
          </button>
        )}

        {onQuickCreateTask && (
          <button
            type="button"
            onClick={onQuickCreateTask}
            className="neo-btn neo-btn-primary py-1.5 px-3 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Task</span>
          </button>
        )}

        {/* Header Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-md border-2 border-[var(--sb-border)] bg-[var(--sb-surface-alt)] text-[var(--sb-ink)] shadow-[2px_2px_0px_var(--sb-shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] transition-all ml-1"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4 text-[var(--sb-primary)]" />
          )}
        </button>
      </div>
    </header>
  );
}
