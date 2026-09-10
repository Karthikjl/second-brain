'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => {
          let bg = 'bg-[var(--sb-surface)]';
          let border = 'border-[var(--sb-border)]';
          let icon = <Info className="w-4 h-4 text-[var(--sb-accent-cyan)] shrink-0" />;

          if (toast.type === 'success') {
            bg = 'bg-[var(--sb-ok-surface)]';
            border = 'border-[var(--sb-ok)]';
            icon = <CheckCircle2 className="w-4 h-4 text-[var(--sb-ok)] shrink-0" />;
          } else if (toast.type === 'error') {
            bg = 'bg-[var(--sb-alert-surface)]';
            border = 'border-[var(--sb-alert)]';
            icon = <AlertTriangle className="w-4 h-4 text-[var(--sb-alert)] shrink-0" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto neo-box p-3.5 flex items-center justify-between gap-3 text-sm font-bold ${bg} ${border} shadow-[4px_4px_0px_var(--sb-shadow-color)] animate-bounce-short`}
            >
              <div className="flex items-center gap-2.5">
                {icon}
                <span className="text-xs text-[var(--sb-ink)] leading-snug">{toast.message}</span>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-[var(--sb-muted)] hover:text-[var(--sb-ink)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
