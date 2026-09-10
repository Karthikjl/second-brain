'use client';

import React, { forwardRef } from 'react';

export interface NeoInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  containerClassName?: string;
}

export const NeoInput = forwardRef<HTMLInputElement, NeoInputProps>(
  ({ label, icon, rightIcon, error, className = '', containerClassName = '', ...props }, ref) => {
    return (
      <div className={`w-full ${containerClassName}`}>
        {label && (
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--sb-ink)] mb-1.5">
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-[var(--sb-muted)] pointer-events-none z-10 w-4 h-4">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            className={`neo-input text-xs ${
              icon ? 'has-icon-left !pl-10' : ''
            } ${rightIcon ? 'has-icon-right !pr-10' : ''} ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-[var(--sb-muted)] z-10 w-4 h-4">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-[11px] font-bold text-[var(--sb-alert)]">{error}</p>
        )}
      </div>
    );
  }
);

NeoInput.displayName = 'NeoInput';
