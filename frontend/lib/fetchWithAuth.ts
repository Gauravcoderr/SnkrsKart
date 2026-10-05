import { getStoredToken, refreshSession } from '@/lib/session';

function buildHeaders(options: RequestInit, token: string | null): Headers {
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return headers;
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: buildHeaders(options, getStoredToken()),
    credentials: 'include',
  });
  if (res.status !== 401) return res;

  const refreshed = await refreshSession();
  if (refreshed.status !== 'ok') return res;

  return fetch(url, {
    ...options,
    headers: buildHeaders(options, refreshed.token),
    credentials: 'include',
  });
}
