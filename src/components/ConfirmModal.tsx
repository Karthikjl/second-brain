'use client';

import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDanger = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="neo-box w-full max-w-md bg-[var(--sb-surface)] p-6 relative animate-scale-up shadow-[8px_8px_0px_var(--sb-shadow-color)]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[var(--sb-muted)] hover:text-[var(--sb-ink)]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-lg border-2 border-[var(--sb-border)] shrink-0 ${
              isDanger
                ? 'bg-[var(--sb-alert-surface)] text-[var(--sb-alert)]'
                : 'bg-[var(--sb-primary)] text-[var(--sb-primary-ink)]'
            }`}
          >
            <AlertCircle className="w-6 h-6" />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-black text-[var(--sb-ink)] leading-snug">{title}</h3>
            <p className="mt-1.5 text-xs text-[var(--sb-muted)] leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="neo-btn neo-btn-outline text-xs px-4 py-2"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`neo-btn text-xs px-4 py-2 ${
              isDanger ? 'neo-btn-danger' : 'neo-btn-primary'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
