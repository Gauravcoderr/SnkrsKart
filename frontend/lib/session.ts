const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const TOKEN_KEY = 'snkrs_token';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function saveToken(token: string) {
  if (typeof window === 'undefined' || !token) return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export function authHeaders(): HeadersInit {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export { TOKEN_KEY };

export type RefreshResult =
  | { status: 'ok'; token: string | null }
  | { status: 'unauthenticated' }
  | { status: 'unavailable' };

let inflight: Promise<RefreshResult> | null = null;

async function doRefresh(): Promise<RefreshResult> {
  let res: Response;
  try {
    res = await fetch(`${API}/auth/refresh`, { method: 'POST', credentials: 'include' });
  } catch {
    return { status: 'unavailable' };
  }
  if (res.status === 401 || res.status === 403) {
    clearToken();
    return { status: 'unauthenticated' };
  }
  if (!res.ok) return { status: 'unavailable' };
  const data = await res.json().catch(() => ({}));
  if (data.accessToken) saveToken(data.accessToken);
  return { status: 'ok', token: data.accessToken ?? null };
}

export function refreshSession(): Promise<RefreshResult> {
  if (!inflight) {
    inflight = doRefresh().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}
