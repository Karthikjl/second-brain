export const API_BASE_URL = '/api';

let refreshPromise: Promise<boolean> | null = null;

const AUTH_ENDPOINTS_NO_REFRESH = ['/auth/refresh', '/auth/login', '/auth/signup', '/auth/setup-status'];

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
}

export function setTokens(accessToken: string, refreshToken: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  document.cookie = `accessToken=${encodeURIComponent(accessToken)}; path=/; SameSite=Strict`;
}

export function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('sb_cached_settings');
  localStorage.removeItem('sb_cached_profiles');
  document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Strict';
}

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const accessToken = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && !AUTH_ENDPOINTS_NO_REFRESH.includes(endpoint)) {
    const refreshed = await tryRefresh();
    if (!refreshed) {
      if (typeof window !== 'undefined') {
        clearTokens();
        window.location.href = '/login';
      }
      return Promise.reject(new Error('Session expired'));
    }
    headers['Authorization'] = `Bearer ${getAccessToken()}`;
    res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 403 && body.must_reset_password) {
      if (typeof window !== 'undefined') {
        window.location.href = '/change-password';
      }
    }
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return null as unknown as T;
  return res.json();
}

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const rawRefreshToken = getRefreshToken();
    if (!rawRefreshToken) return false;

    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rawRefreshToken }),
      });

      if (!res.ok) {
        clearTokens();
        return false;
      }

      const data = await res.json();
      setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    }
  })();

  const result = await refreshPromise;
  refreshPromise = null;
  return result;
}

export const apiRequest = apiFetch;
