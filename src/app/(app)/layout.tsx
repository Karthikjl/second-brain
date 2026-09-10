'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { ToastProvider } from '@/components/ToastContext';
import { TaskModal } from '@/components/TaskModal';
import { NoteModal } from '@/components/NoteModal';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [quickTaskOpen, setQuickTaskOpen] = useState(false);
  const [quickNoteOpen, setQuickNoteOpen] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
    } else {
      const savedCollapse = localStorage.getItem('sb_sidebar_collapsed') === 'true';
      setSidebarCollapsed(savedCollapse);
      setMounted(true);
    }
  }, [router]);

  function toggleSidebarCollapse() {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem('sb_sidebar_collapsed', String(next));
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--sb-bg)]">
        <div className="neo-box p-6 font-bold text-sm">Verifying session...</div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[var(--sb-bg)] flex">
        {/* Sidebar */}
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />

        {/* Main Content Area */}
        <div
          className={`flex-1 flex flex-col min-h-screen transition-all duration-200 ease-in-out ${
            sidebarCollapsed ? 'md:pl-[72px]' : 'md:pl-64'
          }`}
        >
          <Header
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
            onQuickCreateTask={() => setQuickTaskOpen(true)}
            onQuickCreateNote={() => setQuickNoteOpen(true)}
          />

          <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>

        <TaskModal
          isOpen={quickTaskOpen}
          onClose={() => setQuickTaskOpen(false)}
          onSaved={() => {
            window.dispatchEvent(new CustomEvent('sb-data-updated'));
          }}
        />

        <NoteModal
          isOpen={quickNoteOpen}
          onClose={() => setQuickNoteOpen(false)}
          onSaved={() => {
            window.dispatchEvent(new CustomEvent('sb-data-updated'));
          }}
        />
      </div>
    </ToastProvider>
  );
}
