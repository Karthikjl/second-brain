'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ToastContext';
import { ConfirmModal } from '@/components/ConfirmModal';
import {
  ShieldAlert,
  Users,
  UserPlus,
  Key,
  Trash2,
  Edit2,
  Lock,
  Unlock,
  CheckCircle2,
  UserCheck,
  Shield,
  Save,
  RotateCcw,
  Settings,
} from 'lucide-react';

import { NeoSelect } from '@/components/NeoSelect';

export default function AdminPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [lockedAccounts, setLockedAccounts] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<any>({
    self_signup_enabled: 1,
    rate_limit_enabled: 1,
    rate_limit_window_minutes: 15,
    rate_limit_max_attempts: 20,
  });
  const [loading, setLoading] = useState(true);

  // User creation modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('USER');
  const [createLoading, setCreateLoading] = useState(false);

  // User editing modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserIsFirst, setEditingUserIsFirst] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('USER');
  const [editStatus, setEditStatus] = useState('active');
  const [editMustReset, setEditMustReset] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // Modals & Action targets
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [resetPassUserId, setResetPassUserId] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState('');

  const loadAdminData = useCallback(async () => {
    try {
      const [usersRes, settingsRes, lockedRes] = await Promise.all([
        apiFetch('/admin/users'),
        apiFetch('/admin/settings'),
        apiFetch('/admin/locked-accounts'),
      ]);
      setUsers(usersRes.users || []);
      if (settingsRes) setSystemSettings(settingsRes.settings || settingsRes);
      setLockedAccounts(lockedRes.lockedAccounts || []);
    } catch (err: any) {
      showToast(err?.message || 'Failed to load admin data (Admin privileges required)', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await apiFetch('/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          name: newUserName.trim(),
          username: newUserUsername.trim(),
          email: newUserEmail.trim(),
          password: newUserPassword,
          role: newUserRole,
        }),
      });
      showToast('User created successfully!', 'success');
      setCreateModalOpen(false);
      setNewUserName('');
      setNewUserUsername('');
      setNewUserEmail('');
      setNewUserPassword('');
      loadAdminData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to create user', 'error');
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleResetPassword() {
    if (!resetPassUserId || !tempPassword) return;
    try {
      await apiFetch(`/admin/users/${resetPassUserId}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ tempPassword, newPassword: tempPassword }),
      });
      showToast('Password reset! User must change password on next login.', 'success');
      setResetPassUserId(null);
      setTempPassword('');
    } catch (err: any) {
      showToast(err?.message || 'Failed to reset password', 'error');
    }
  }

  async function handleDeleteUser() {
    if (!deleteUserId) return;
    try {
      await apiFetch(`/admin/users/${deleteUserId}`, { method: 'DELETE' });
      showToast('User deleted successfully', 'info');
      loadAdminData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete user', 'error');
    } finally {
      setDeleteUserId(null);
    }
  }

  async function handleToggleStatus(userId: string, currentStatus: string) {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await apiFetch(`/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      showToast(`User status updated to ${nextStatus}`, 'success');
      loadAdminData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update user status', 'error');
    }
  }

  async function handleToggleRole(userId: string, currentRole: string) {
    const nextRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      await apiFetch(`/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: nextRole }),
      });
      showToast(`User role updated to ${nextRole}`, 'success');
      loadAdminData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update user role', 'error');
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify(systemSettings),
      });
      showToast('System settings saved successfully!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update system settings', 'error');
    }
  }

  async function handleResetLockout(identifier: string) {
    try {
      await apiFetch('/admin/reset-lockout', {
        method: 'POST',
        body: JSON.stringify({ identifier }),
      });
      showToast(`Lockout cleared for ${identifier}!`, 'success');
      loadAdminData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to clear lockout', 'error');
    }
  }

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  async function autoSaveSetting(updatedFields: Partial<typeof systemSettings>) {
    setSaveStatus('saving');
    const newSettings = { ...systemSettings, ...updatedFields };
    setSystemSettings(newSettings);

    try {
      await apiFetch('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify(newSettings),
      });
      setSaveStatus('saved');
    } catch (err: any) {
      setSaveStatus('saved');
      showToast(err?.message || 'Failed to auto-save settings', 'error');
    }
  }

  async function handleSingleResetLockout() {
    if (!resetIdentifier.trim()) {
      showToast('Please enter an email or username to reset.', 'error');
      return;
    }
    setResetLoading(true);
    try {
      await apiFetch('/admin/reset-lockout', {
        method: 'POST',
        body: JSON.stringify({ identifier: resetIdentifier.trim() }),
      });
      showToast(`Lockout cleared for ${resetIdentifier}!`, 'success');
      setResetIdentifier('');
      loadAdminData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to clear lockout', 'error');
    } finally {
      setResetLoading(false);
    }
  }

  const roleOptions = [
    { value: 'USER', label: 'User', icon: '👤' },
    { value: 'ADMIN', label: 'Admin', icon: '🛡️' },
  ];

  const statusOptions = [
    { value: 'active', label: 'Active', icon: '🟢' },
    { value: 'inactive', label: 'Inactive', icon: '🔴' },
  ];

  function handleOpenEdit(u: any) {
    setEditingUserId(u.id);
    setEditingUserIsFirst(Boolean(u.is_first_user));
    setEditName(u.name || '');
    setEditUsername(u.username || '');
    setEditEmail(u.email || '');
    setEditRole(u.role || 'USER');
    setEditStatus(u.status || 'active');
    setEditMustReset(Boolean(u.must_reset_password));
    setEditModalOpen(true);
  }

  async function handleUpdateRole(userId: string, newRole: string) {
    try {
      await apiFetch(`/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      showToast(`User role updated to ${newRole}`, 'success');
      loadAdminData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update user role', 'error');
    }
  }

  async function handleUpdateStatus(userId: string, newStatus: string) {
    try {
      await apiFetch(`/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      showToast(`User status updated to ${newStatus}`, 'success');
      loadAdminData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update user status', 'error');
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUserId) return;
    setEditLoading(true);
    try {
      await apiFetch(`/admin/users/${editingUserId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editName.trim(),
          username: editUsername.trim(),
          email: editEmail.trim(),
          role: editingUserIsFirst ? 'ADMIN' : editRole,
          status: editingUserIsFirst ? 'active' : editStatus,
          must_reset_password: editMustReset,
        }),
      });
      showToast('User updated successfully!', 'success');
      setEditModalOpen(false);
      loadAdminData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update user', 'error');
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--sb-ink)] tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-[var(--sb-alert)]" />
            Super Admin Control Center
          </h1>
          <p className="text-xs text-[var(--sb-muted)] font-medium mt-1">
            Manage user accounts, roles, registration policies, and security lockouts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="neo-btn neo-btn-primary text-xs py-2 px-4 shadow-[2px_2px_0px_var(--sb-shadow-color)]"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* System Configuration Cards Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Local Self Sign-up Card */}
        <div className="neo-box p-6 bg-[var(--sb-surface)] border-2 border-[var(--sb-border)] rounded-xl shadow-[4px_4px_0px_var(--sb-shadow-color)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-[var(--sb-surface-alt)] border-2 border-[var(--sb-border)] flex items-center justify-center shrink-0 shadow-[2px_2px_0px_var(--sb-shadow-color)]">
                <UserCheck className="w-5 h-5 text-[var(--sb-ink)]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-[var(--sb-ink)] tracking-tight leading-snug">
                  Local Self Sign-up
                </h2>
                <p className="text-xs text-[var(--sb-muted)] font-medium mt-0.5">
                  Allow new users to register their own accounts locally without super admin intervention. Changes are saved automatically.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 self-end sm:self-center">
              <span className="text-xs font-bold text-[var(--sb-muted)] whitespace-nowrap">
                {saveStatus === 'saving' ? 'Saving...' : 'All changes saved'}
              </span>
              <button
                type="button"
                onClick={() =>
                  autoSaveSetting({
                    self_signup_enabled: !systemSettings.self_signup_enabled,
                  })
                }
                className={`py-2 px-5 rounded-lg border-2 border-[var(--sb-border)] text-xs sm:text-sm font-black transition-all text-center min-w-[110px] ${
                  systemSettings.self_signup_enabled
                    ? 'bg-[var(--sb-ok-surface)] text-[var(--sb-ok)] shadow-[2px_2px_0px_var(--sb-shadow-color)]'
                    : 'bg-[var(--sb-surface-alt)] text-[var(--sb-muted)]'
                }`}
              >
                {systemSettings.self_signup_enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        </div>

        {/* Login Rate Limiting Card */}
        <div className="neo-box p-6 bg-[var(--sb-surface)] border-2 border-[var(--sb-border)] rounded-xl shadow-[4px_4px_0px_var(--sb-shadow-color)]">
          {/* Card Header */}
          <div className="flex items-start gap-3.5 mb-6">
            <div className="w-10 h-10 rounded-lg bg-[var(--sb-surface-alt)] border-2 border-[var(--sb-border)] flex items-center justify-center shrink-0 shadow-[2px_2px_0px_var(--sb-shadow-color)]">
              <Settings className="w-5 h-5 text-[var(--sb-ink)]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[var(--sb-ink)] tracking-tight leading-snug">
                Login Rate Limiting
              </h2>
              <p className="text-xs text-[var(--sb-muted)] font-medium mt-0.5">
                Reduce brute-force attacks; disable only for trusted environments. Changes are saved automatically.
              </p>
            </div>
          </div>

          {/* 3 Columns Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            {/* Rate Limiting Toggle */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--sb-ink)] mb-1.5">
                Rate Limiting
              </label>
              <button
                type="button"
                onClick={() =>
                  autoSaveSetting({
                    rate_limit_enabled: !systemSettings.rate_limit_enabled,
                  })
                }
                className={`w-full py-2.5 px-4 rounded-lg border-2 border-[var(--sb-border)] text-xs sm:text-sm font-black transition-all text-center ${
                  systemSettings.rate_limit_enabled
                    ? 'bg-[var(--sb-ok-surface)] text-[var(--sb-ok)] shadow-[2px_2px_0px_var(--sb-shadow-color)]'
                    : 'bg-[var(--sb-surface-alt)] text-[var(--sb-muted)]'
                }`}
              >
                {systemSettings.rate_limit_enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {/* Window (minutes) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--sb-ink)] mb-1.5">
                Window (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="1440"
                value={systemSettings.rate_limit_window_minutes || 15}
                onChange={(e) =>
                  setSystemSettings({
                    ...systemSettings,
                    rate_limit_window_minutes: Number(e.target.value),
                  })
                }
                onBlur={(e) =>
                  autoSaveSetting({
                    rate_limit_window_minutes: Number(e.target.value),
                  })
                }
                className="w-full bg-[var(--sb-surface)] text-[var(--sb-ink)] border-2 border-[var(--sb-border)] rounded-lg px-4 py-2 text-xs sm:text-sm font-bold focus:outline-none focus:bg-[var(--sb-surface-alt)] transition"
              />
            </div>

            {/* Max attempts */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--sb-ink)] mb-1.5">
                Max attempts
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={systemSettings.rate_limit_max_attempts || 20}
                onChange={(e) =>
                  setSystemSettings({
                    ...systemSettings,
                    rate_limit_max_attempts: Number(e.target.value),
                  })
                }
                onBlur={(e) =>
                  autoSaveSetting({
                    rate_limit_max_attempts: Number(e.target.value),
                  })
                }
                className="w-full bg-[var(--sb-surface)] text-[var(--sb-ink)] border-2 border-[var(--sb-border)] rounded-lg px-4 py-2 text-xs sm:text-sm font-bold focus:outline-none focus:bg-[var(--sb-surface-alt)] transition"
              />
            </div>
          </div>

          {/* Reset lockout Row */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--sb-ink)] mb-1.5">
              Reset lockout (email/username)
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-3.5">
              <div className="flex-1 w-full">
                <input
                  type="text"
                  value={resetIdentifier}
                  onChange={(e) => setResetIdentifier(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-[var(--sb-surface)] text-[var(--sb-ink)] border-2 border-[var(--sb-border)] rounded-lg px-4 py-2.5 text-xs sm:text-sm font-medium placeholder:text-[var(--sb-muted)] focus:outline-none focus:bg-[var(--sb-surface-alt)] transition"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSingleResetLockout();
                    }
                  }}
                />
              </div>

              <div className="flex items-center gap-3.5 w-full sm:w-auto justify-end">
                <span className="text-xs font-bold text-[var(--sb-muted)] whitespace-nowrap">
                  {saveStatus === 'saving' ? 'Saving...' : 'All changes saved'}
                </span>

                <button
                  type="button"
                  onClick={handleSingleResetLockout}
                  disabled={resetLoading}
                  className="neo-btn neo-btn-outline py-2 px-5 text-xs sm:text-sm rounded-lg font-black disabled:opacity-50 shrink-0"
                >
                  {resetLoading ? 'Resetting...' : 'Reset'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="neo-box bg-[var(--sb-surface)] overflow-hidden">
        <div className="p-4 border-b-2 border-[var(--sb-border)] flex items-center justify-between bg-[var(--sb-surface-alt)]">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[var(--sb-ink)]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-[var(--sb-ink)]">
              All Users ({users.length})
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-[var(--sb-border)] bg-[var(--sb-surface-alt)]/50 font-bold uppercase text-[10px] text-[var(--sb-muted)]">
                <th className="p-3">User</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--sb-border-light)] font-medium">
              {loading ? (
                [1, 2, 3, 4].map((i) => (
                  <tr key={i}>
                    <td className="p-3"><div className="neo-skeleton-line h-4 w-28" /></td>
                    <td className="p-3"><div className="neo-skeleton-line h-4 w-36" /></td>
                    <td className="p-3"><div className="neo-skeleton-line h-4 w-16" /></td>
                    <td className="p-3"><div className="neo-skeleton-line h-4 w-16" /></td>
                    <td className="p-3"><div className="neo-skeleton-line h-6 w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : (
                users.map((u) => (
                <tr key={u.id} className="hover:bg-[var(--sb-surface-alt)]/40 transition-colors">
                  <td className="p-3 font-bold text-[var(--sb-ink)] flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[var(--sb-primary)] text-xs font-black flex items-center justify-center border border-[var(--sb-border)]">
                      {(u.name || u.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div>{u.name || 'Anonymous'}</div>
                      <div className="text-[10px] font-mono text-[var(--sb-muted)]">@{u.username || 'user'}</div>
                    </div>
                  </td>
                  <td className="p-3 font-mono text-xs">{u.email}</td>
                  <td className="p-3">
                    {u.is_first_user ? (
                      <span
                        title="Primary Super Admin role is permanently locked"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-black bg-[var(--sb-accent-purple-surface)] text-[var(--sb-accent-purple)] border border-[var(--sb-accent-purple)]/30 select-none shadow-[2px_2px_0px_var(--sb-shadow-color)]"
                      >
                        <span>👑</span> Super Admin (Root)
                      </span>
                    ) : (
                      <div className="w-32">
                        <NeoSelect
                          value={u.role}
                          onChange={(val) => handleUpdateRole(u.id, String(val))}
                          options={roleOptions}
                          className="py-1 px-2.5 text-xs"
                        />
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    {u.is_first_user ? (
                      <span
                        title="Primary Super Admin account is permanently active"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-black bg-[var(--sb-ok-surface)] text-[var(--sb-ok)] border border-[var(--sb-ok)]/30 select-none shadow-[2px_2px_0px_var(--sb-shadow-color)]"
                      >
                        <span>🟢</span> Active (Root)
                      </span>
                    ) : (
                      <div className="w-32">
                        <NeoSelect
                          value={u.status}
                          onChange={(val) => handleUpdateStatus(u.id, String(val))}
                          options={statusOptions}
                          className="py-1 px-2.5 text-xs"
                        />
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 rounded hover:bg-[var(--sb-surface-alt)] text-[var(--sb-muted)] hover:text-[var(--sb-ink)] transition-colors"
                        title="Edit User Account"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setResetPassUserId(u.id);
                          setTempPassword('TempPass123!');
                        }}
                        className="p-1.5 rounded hover:bg-[var(--sb-surface-alt)] text-[var(--sb-muted)] hover:text-[var(--sb-ink)] transition-colors"
                        title="Force Password Reset"
                      >
                        <Key className="w-3.5 h-3.5" />
                      </button>
                      {u.is_first_user ? (
                        <button
                          type="button"
                          disabled
                          className="p-1.5 rounded text-[var(--sb-muted)] opacity-25 cursor-not-allowed"
                          title="Primary Super Admin cannot be deleted"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteUserId(u.id)}
                          className="p-1.5 rounded hover:bg-[var(--sb-alert-surface)] text-[var(--sb-alert)] transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Locked Accounts Section */}
      {lockedAccounts.length > 0 && (
        <div className="neo-box p-5 bg-[var(--sb-surface)] border-2 border-[var(--sb-alert)]">
          <h3 className="text-xs font-black uppercase tracking-wider text-[var(--sb-alert)] flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4" />
            Locked Accounts ({lockedAccounts.length})
          </h3>

          <div className="space-y-2">
            {lockedAccounts.map((item) => (
              <div
                key={item.id || item.identifier}
                className="p-3 rounded bg-[var(--sb-alert-surface)] flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-[var(--sb-ink)]">{item.identifier}</span>
                  <span className="text-[10px] text-[var(--sb-muted)] ml-2">
                    Failed Attempts: {item.failed_count}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleResetLockout(item.identifier)}
                  className="neo-btn neo-btn-outline text-[10px] py-1 px-2"
                >
                  <Unlock className="w-3 h-3 text-[var(--sb-ok)]" />
                  <span>Unlock</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="neo-box w-full max-w-md bg-[var(--sb-surface)] p-6 relative animate-scale-up shadow-[8px_8px_0px_var(--sb-shadow-color)]">
            <h2 className="text-lg font-black text-[var(--sb-ink)] mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[var(--sb-primary)]" />
              Create New User
            </h2>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="John Doe"
                  className="neo-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={newUserUsername}
                  onChange={(e) => setNewUserUsername(e.target.value)}
                  placeholder="johndoe"
                  className="neo-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="neo-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="••••••••"
                  className="neo-input text-xs"
                />
              </div>

              <div>
                <NeoSelect
                  label="Role"
                  value={newUserRole}
                  onChange={(val) => setNewUserRole(String(val))}
                  options={roleOptions}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="neo-btn neo-btn-outline text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="neo-btn neo-btn-primary text-xs px-5 py-2"
                >
                  {createLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="neo-box w-full max-w-md bg-[var(--sb-surface)] p-6 relative animate-scale-up shadow-[8px_8px_0px_var(--sb-shadow-color)]">
            <h2 className="text-lg font-black text-[var(--sb-ink)] mb-1 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-[var(--sb-primary)]" />
              Edit User Account
            </h2>
            <p className="text-xs text-[var(--sb-muted)] mb-4">
              Update user profile, username, email, role permissions, and status.
            </p>

            {editingUserIsFirst && (
              <div className="p-2.5 rounded-lg bg-[var(--sb-accent-purple-surface)] border border-[var(--sb-accent-purple)]/40 text-[var(--sb-accent-purple)] text-xs font-black flex items-center gap-2 mb-3 select-none">
                <span>👑</span>
                <span>Primary Super Admin Account: Role and status are permanently locked.</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="neo-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="neo-input text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="neo-input text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1">Role</label>
                  <NeoSelect
                    value={editRole}
                    disabled={editingUserIsFirst}
                    onChange={(val) => setEditRole(val)}
                    options={roleOptions}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1">Status</label>
                  <NeoSelect
                    value={editStatus}
                    disabled={editingUserIsFirst}
                    onChange={(val) => setEditStatus(val)}
                    options={statusOptions}
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editMustReset}
                    onChange={(e) => setEditMustReset(e.target.checked)}
                    className="w-4 h-4 rounded border-2 border-[var(--sb-border)] text-[var(--sb-primary)] focus:ring-0"
                  />
                  <span className="text-xs font-bold text-[var(--sb-ink)]">
                    Require password change on next login
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="neo-btn neo-btn-outline text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="neo-btn neo-btn-primary text-xs px-5 py-2"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {Boolean(resetPassUserId) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="neo-box w-full max-w-md bg-[var(--sb-surface)] p-6 relative animate-scale-up shadow-[8px_8px_0px_var(--sb-shadow-color)]">
            <h2 className="text-lg font-black text-[var(--sb-ink)] mb-3 flex items-center gap-2">
              <Key className="w-5 h-5 text-[var(--sb-accent-orange)]" />
              Force Password Reset
            </h2>
            <p className="text-xs text-[var(--sb-muted)] mb-4">
              Enter a temporary password. The user will be required to change it immediately upon logging in.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1">Temporary Password</label>
                <input
                  type="text"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  className="neo-input text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetPassUserId(null)}
                  className="neo-btn neo-btn-outline text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="neo-btn neo-btn-primary text-xs px-5 py-2"
                >
                  Confirm Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteUserId)}
        title="Delete User Account?"
        message="This will permanently delete the user account and all associated profiles and data."
        confirmLabel="Delete User"
        isDanger
        onConfirm={handleDeleteUser}
        onClose={() => setDeleteUserId(null)}
      />
    </div>
  );
}
