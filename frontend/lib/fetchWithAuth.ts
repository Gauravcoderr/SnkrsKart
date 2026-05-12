import { getStoredToken, saveToken, clearToken } from '@/context/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

// Prevent multiple simultaneous refresh calls
let isRefreshing = false;
let queue: Array<(token: string | null) => void> = [];

async function doRefresh(): Promise<string | null> {
  try {
    const res = await fetch(`${API}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) { clearToken(); return null; }
    const data = await res.json();
    if (data.accessToken) { saveToken(data.accessToken); return data.accessToken; }
    clearToken();
    return null;
  } catch {
    clearToken();
    return null;
  }
}

function buildHeaders(options: RequestInit, token: string | null): Headers {
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return headers;
}

/**
 * Drop-in replacement for fetch() for authenticated API calls.
 * On 401: refreshes token once, retries request, then gives up.
 * Queues concurrent 401s so only one refresh call fires.
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getStoredToken();
  const res = await fetch(url, {
    ...options,
    headers: buildHeaders(options, token),
    credentials: 'include',
  });

  if (res.status !== 401) return res;

  // First 401 — do the refresh
  if (!isRefreshing) {
    isRefreshing = true;
    const newToken = await doRefresh();
    isRefreshing = false;
    queue.forEach((cb) => cb(newToken));
    queue = [];

    if (!newToken) return res;
    return fetch(url, {
      ...options,
      headers: buildHeaders(options, newToken),
      credentials: 'include',
    });
  }

  // Another request already refreshing — wait in queue
  return new Promise((resolve) => {
    queue.push((newToken) => {
      if (!newToken) { resolve(res); return; }
      resolve(
        fetch(url, {
          ...options,
          headers: buildHeaders(options, newToken),
          credentials: 'include',
        }),
      );
    });
  });
}
