'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, setTokens } from '@/lib/api';
import { KeyRound, ShieldAlert, ArrowRight } from 'lucide-react';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError('Password must be at least 8 characters long and contain both letters and numbers.');
      return;
    }

    setLoading(true);

    try {
      const res = await apiFetch('/auth/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res?.accessToken && res?.refreshToken) {
        setTokens(res.accessToken, res.refreshToken);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[var(--sb-bg)]">
      <div className="w-full max-w-md">
        <div className="neo-box p-8 bg-[var(--sb-surface)]">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-xl bg-[var(--sb-accent-orange-surface)] text-[var(--sb-accent-orange)] border-2 border-[var(--sb-border)] mb-3">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-[var(--sb-ink)]">Update Password</h1>
            <p className="text-xs text-[var(--sb-muted)] mt-1">
              Please enter your current password and choose a new secure password.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-[var(--sb-alert-surface)] text-[var(--sb-alert)] border-2 border-[var(--sb-alert)] rounded text-xs font-bold">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-[var(--sb-ok-surface)] text-[var(--sb-ok)] border-2 border-[var(--sb-ok)] rounded text-xs font-bold">
              Password updated successfully! Redirecting...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--sb-ink)] mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="neo-input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--sb-ink)] mb-1">
                New Password (min 8 chars)
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="neo-input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--sb-ink)] mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="neo-input text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full neo-btn neo-btn-primary py-2.5 mt-2 text-sm flex items-center justify-center gap-2"
            >
              {loading ? 'Updating...' : 'Change Password'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
