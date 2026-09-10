'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, setTokens, getAccessToken } from '@/lib/api';
import { Lock, Mail, User, Shield, ArrowRight, CheckCircle2, Moon, Sun, Info } from 'lucide-react';

import { NeoInput } from '@/components/NeoInput';

export default function LoginPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isLogin, setIsLogin] = useState(true);
  const [isFirstRun, setIsFirstRun] = useState(false);
  const [selfSignupEnabled, setSelfSignupEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    // Load theme
    const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    if (getAccessToken()) {
      router.replace('/dashboard');
      return;
    }

    async function checkSetup() {
      try {
        const status = await apiFetch('/auth/setup-status');
        if (!status.initialized) {
          setIsFirstRun(true);
          setIsLogin(false);
        } else {
          setIsFirstRun(false);
          setSelfSignupEnabled(status.selfSignupEnabled !== false);
        }
      } catch (err) {
        console.warn('Could not check setup status:', err);
      }
    }
    checkSetup();
  }, [router]);

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  }

  async function handleAuthSuccess(data: any) {
    setTokens(data.accessToken, data.refreshToken);
    if (data.user?.must_reset_password) {
      router.push('/change-password');
    } else {
      router.push('/dashboard');
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      await handleAuthSuccess(data);
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      const data = await apiFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim(),
          email: email.trim(),
          password,
        }),
      });
      await handleAuthSuccess(data);
    } catch (err: any) {
      setError(err?.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[var(--sb-bg)] relative overflow-hidden transition-colors duration-200">
      {/* Background Neo Accents */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-[var(--sb-primary)] opacity-20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[var(--sb-accent-cyan)] opacity-20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Right Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border-2 border-[var(--sb-border)] bg-[var(--sb-surface)] text-[var(--sb-ink)] shadow-[2px_2px_0px_var(--sb-shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-2 text-xs font-bold"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? (
            <>
              <Moon className="w-4 h-4" />
              <span className="hidden sm:inline">Dark</span>
            </>
          ) : (
            <>
              <Sun className="w-4 h-4 text-[var(--sb-primary)]" />
              <span className="hidden sm:inline">Light</span>
            </>
          )}
        </button>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Main Card */}
        <div className="neo-box p-8 bg-[var(--sb-surface)] border-2 border-[var(--sb-border)] rounded-2xl shadow-[4px_4px_0px_var(--sb-shadow-color)]">
          {/* Header & Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2.5 mb-2">
              <img
                src="/favicon.svg"
                alt="Second Brain Logo"
                className="w-10 h-10 rounded-xl object-contain border-2 border-[var(--sb-border)] shadow-[2px_2px_0px_var(--sb-shadow-color)]"
              />
              <h1 className="text-2xl font-black tracking-tight text-[var(--sb-ink)]">
                Second<span className="bg-[var(--sb-primary)] text-[var(--sb-primary-ink)] border border-[var(--sb-border)] px-1.5 py-0.5 rounded text-sm ml-1 font-black shadow-[1px_1px_0px_var(--sb-shadow-color)]">Brain</span>
              </h1>
            </div>
            <p className="text-sm font-medium text-[var(--sb-muted)]">
              {isFirstRun
                ? '⚡ Initial System Setup: Create Super Admin'
                : isLogin
                ? 'Welcome back! Log in to your personal hub.'
                : 'Create your account to organize knowledge & productivity.'}
            </p>
          </div>

          {/* First Run Notice Banner */}
          {isFirstRun && (
            <div className="mb-6 p-3.5 bg-[var(--sb-primary)] text-[var(--sb-primary-ink)] rounded-md border-2 border-[var(--sb-border)] text-xs font-bold flex items-start gap-2 shadow-[2px_2px_0px_var(--sb-shadow-color)]">
              <Shield className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <strong>Initial System Setup:</strong> You are creating the primary Super Admin account.
              </div>
            </div>
          )}

          {/* Tab Buttons */}
          {!isFirstRun && selfSignupEnabled && (
            <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-[var(--sb-surface-alt)] border-2 border-[var(--sb-border)] rounded-md">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setError('');
                }}
                className={`py-2 text-sm font-bold rounded transition-all ${
                  isLogin
                    ? 'bg-[var(--sb-surface)] border-2 border-[var(--sb-border)] shadow-[2px_2px_0px_var(--sb-shadow-color)] text-[var(--sb-ink)]'
                    : 'text-[var(--sb-muted)] hover:text-[var(--sb-ink)]'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setError('');
                }}
                className={`py-2 text-sm font-bold rounded transition-all ${
                  !isLogin
                    ? 'bg-[var(--sb-surface)] border-2 border-[var(--sb-border)] shadow-[2px_2px_0px_var(--sb-shadow-color)] text-[var(--sb-ink)]'
                    : 'text-[var(--sb-muted)] hover:text-[var(--sb-ink)]'
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3 bg-[var(--sb-alert-surface)] text-[var(--sb-alert)] border-2 border-[var(--sb-alert)] rounded text-xs font-bold">
              {error}
            </div>
          )}

          {/* Form */}
          {isLogin && !isFirstRun ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <NeoInput
                label="Email Address"
                type="email"
                required
                icon={<Mail className="w-4 h-4" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--sb-ink)]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs font-bold text-[var(--sb-muted)] hover:text-[var(--sb-ink)]"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <NeoInput
                  type={showPassword ? 'text' : 'password'}
                  required
                  icon={<Lock className="w-4 h-4" />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full neo-btn neo-btn-primary py-2.5 mt-2 text-sm flex items-center justify-center gap-2"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>

              {!isFirstRun && !selfSignupEnabled && (
                <div className="mt-4 p-3 bg-[var(--sb-surface-alt)] border border-[var(--sb-border-light)] rounded-xl flex items-center gap-2.5 text-xs text-[var(--sb-muted)] font-medium">
                  <Info className="w-4 h-4 text-[var(--sb-muted)] shrink-0" />
                  <span>Self sign-up is disabled by administrator. Contact your admin for account creation.</span>
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-3.5">
              <NeoInput
                label="Full Name"
                type="text"
                required
                icon={<User className="w-4 h-4" />}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
              />

              <NeoInput
                label="Username"
                type="text"
                required
                icon={<span className="text-xs font-bold font-mono">@</span>}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="alex"
              />

              <NeoInput
                label="Email Address"
                type="email"
                required
                icon={<Mail className="w-4 h-4" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
              />

              <NeoInput
                label="Password (min. 8 characters)"
                type="password"
                required
                icon={<Lock className="w-4 h-4" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />

              <NeoInput
                label="Confirm Password"
                type="password"
                required
                icon={<CheckCircle2 className="w-4 h-4" />}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full neo-btn neo-btn-primary py-2.5 mt-3 text-sm flex items-center justify-center gap-2"
              >
                {loading
                  ? 'Creating Account...'
                  : isFirstRun
                  ? '⚡ Initialize Super Admin'
                  : 'Create Account'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

