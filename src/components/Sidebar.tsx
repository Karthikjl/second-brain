'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CheckSquare,
  StickyNote,
  Flame,
  Calendar as CalendarIcon,
  Bell,
  Trash2,
  Settings,
  ShieldAlert,
  LogOut,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { clearTokens, apiFetch } from '@/lib/api';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  mobileOpen,
  onCloseMobile,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string>('USER');
  const [userName, setUserName] = useState<string>('User');

  useEffect(() => {
    // Fetch profile / settings
    async function loadUser() {
      try {
        const data = await apiFetch('/profiles');
        if (data && data.profiles && data.profiles.length > 0) {
          const current = data.profiles[0];
          setUserName(current.name || 'User');
        }
        // Decode token for role
        const token = localStorage.getItem('accessToken');
        if (token) {
          const parts = token.split('.');
          if (parts[1]) {
            const payload = JSON.parse(atob(parts[1]));
            setUserRole(payload.role || 'USER');
            if (payload.name) setUserName(payload.name);
          }
        }
      } catch (err) {
        // user not authenticated
      }
    }
    loadUser();
  }, []);

  function handleLogout() {
    clearTokens();
    router.replace('/login');
  }

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'AI Assistant', href: '/ai', icon: Sparkles, badge: 'BETA' },
    { label: 'Tasks', href: '/tasks', icon: CheckSquare },
    { label: 'Notes', href: '/notes', icon: StickyNote },
    { label: 'Habits', href: '/habits', icon: Flame },
    { label: 'Calendar', href: '/calendar', icon: CalendarIcon },
    { label: 'Reminders', href: '/reminders', icon: Bell },
    { label: 'Recycle Bin', href: '/bin', icon: Trash2 },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  if (userRole === 'ADMIN') {
    navItems.push({ label: 'Admin Panel', href: '/admin', icon: ShieldAlert });
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-[var(--sb-surface)] border-r-2 border-[var(--sb-border)] flex flex-col justify-between transition-all duration-200 ease-in-out ${
          collapsed ? 'w-[72px]' : 'w-64'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand / Logo */}
        <div className="p-4 border-b-2 border-[var(--sb-border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/favicon.svg"
              alt="Second Brain Logo"
              className="w-8 h-8 rounded-lg object-contain border-2 border-[var(--sb-border)] shadow-[2px_2px_0px_var(--sb-shadow-color)] shrink-0"
            />
            {!collapsed && (
              <span className="font-black text-sm tracking-tight text-[var(--sb-ink)]">
                Second<span className="bg-[var(--sb-primary)] text-[var(--sb-primary-ink)] border border-[var(--sb-border)] px-1 py-0.5 rounded text-xs ml-1 font-black shadow-[1px_1px_0px_var(--sb-shadow-color)]">Brain</span>
              </span>
            )}
          </div>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

            return (
              <button
                key={item.href}
                type="button"
                onClick={() => {
                  router.push(item.href);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center ${
                  collapsed ? 'justify-center px-0 py-2.5' : 'justify-between px-3 py-2.5'
                } rounded text-xs font-bold transition-all text-left ${
                  isActive
                    ? 'bg-[var(--sb-primary)] text-[var(--sb-primary-ink)] border-2 border-[var(--sb-border)] shadow-[3px_3px_0px_var(--sb-shadow-color)]'
                    : 'text-[var(--sb-ink)] hover:bg-[var(--sb-surface-alt)] border-2 border-transparent'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>
                {!collapsed && item.badge && (
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
                      isActive
                        ? 'bg-[var(--sb-surface)] text-[var(--sb-ink)] border-[var(--sb-border)]'
                        : 'bg-[var(--sb-accent-orange)] text-[#121212] border-[var(--sb-border)]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Actions & User Footer */}
        <div className="p-3 border-t-2 border-[var(--sb-border)] bg-[var(--sb-surface-alt)] space-y-2">
          {/* Collapse/Expand Toggle Button at Bottom (Desktop) */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className={`hidden md:flex w-full items-center ${
                collapsed ? 'justify-center p-2' : 'justify-between px-3 py-2'
              } rounded-md border-2 border-[var(--sb-border)] bg-[var(--sb-surface)] text-[var(--sb-ink)] shadow-[2px_2px_0px_var(--sb-shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] transition-all text-xs font-bold`}
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <div className="flex items-center gap-2">
                {collapsed ? (
                  <PanelLeftOpen className="w-4 h-4 shrink-0" />
                ) : (
                  <>
                    <PanelLeftClose className="w-4 h-4 shrink-0" />
                    <span>Collapse Sidebar</span>
                  </>
                )}
              </div>
            </button>
          )}

          {/* User Account Bar */}
          <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'justify-between gap-2'} pt-1`}>
            <div className={`flex items-center gap-2 min-w-0 ${collapsed ? 'justify-center' : ''}`}>
              <div
                className="w-7 h-7 rounded-full bg-[var(--sb-primary)] text-[var(--sb-primary-ink)] border border-[var(--sb-border)] flex items-center justify-center font-black text-xs shrink-0"
                title={`${userName} (${userRole})`}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--sb-ink)] truncate leading-tight">{userName}</p>
                  <p className="text-[10px] font-mono text-[var(--sb-muted)] truncate">{userRole}</p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 text-[var(--sb-alert)] hover:bg-[var(--sb-alert-surface)] rounded border border-transparent hover:border-[var(--sb-alert)] transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
