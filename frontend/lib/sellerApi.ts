import type {
  SellerProfile, SellerDashboard, CatalogProduct, CatalogDetail, SellerListing, SellerOrder, ProductRequest, VerificationAngle,
} from '@/types/seller';
import type { Availability } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const PORTAL = `${BASE_URL}/seller-portal`;
export const SELLER_TOKEN_KEY = 'seller_token';

export class SellerAuthError extends Error {
  constructor() { super('Session expired'); this.name = 'SellerAuthError'; }
}

export function getSellerToken(): string | null {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem(SELLER_TOKEN_KEY); } catch { return null; }
}

export function setSellerToken(token: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (token) localStorage.setItem(SELLER_TOKEN_KEY, token);
    else localStorage.removeItem(SELLER_TOKEN_KEY);
  } catch {}
}

async function request<T>(path: string, init: RequestInit = {}, auth = true): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (auth) {
    const token = getSellerToken();
    if (!token) throw new SellerAuthError();
    headers.set('Authorization', `Bearer ${token}`);
  }
  const res = await fetch(`${PORTAL}${path}`, { ...init, headers, cache: 'no-store' });
  if (res.status === 401) {
    setSellerToken(null);
    throw new SellerAuthError();
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

export const sellerApi = {
  login: (email: string, password: string) =>
    request<{ token: string; seller: SellerProfile }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }, false),
  me: () => request<SellerProfile>('/me'),
  updateMe: (body: Partial<Pick<SellerProfile, 'name' | 'phone' | 'businessName' | 'addressLine' | 'city' | 'state' | 'pincode' | 'whatsapp' | 'upiId'>>) =>
    request<SellerProfile>('/me', { method: 'PUT', body: JSON.stringify(body) }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ success: true; seller: SellerProfile }>('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
  config: () => request<{ commissionPct: number; angles: VerificationAngle[]; shipDays: Record<Availability, number> }>('/config', {}, false),
  dashboard: () => request<SellerDashboard>('/dashboard'),
  catalogSearch: (search: string) => request<CatalogProduct[]>(`/catalog?search=${encodeURIComponent(search)}`),
  catalogProduct: (id: string) => request<CatalogDetail>(`/catalog/${id}`),
  listings: () => request<SellerListing[]>('/listings'),
  createListings: (productId: string, entries: Array<{ size: number | string; sellerPrice: number; availability: Availability; qty: number }>) =>
    request<SellerListing[]>('/listings', { method: 'POST', body: JSON.stringify({ productId, entries }) }),
  updateListing: (id: string, body: Partial<{ sellerPrice: number; availability: Availability; qty: number; status: 'active' | 'paused' }>) =>
    request<SellerListing>(`/listings/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteListing: (id: string) => request<{ success: true }>(`/listings/${id}`, { method: 'DELETE' }),
  orders: (status?: string) => request<SellerOrder[]>(`/orders${status ? `?status=${status}` : ''}`),
  order: (id: string) => request<SellerOrder>(`/orders/${id}`),
  submitVerification: (id: string, photos: Array<{ angle: string; url: string }>) =>
    request<SellerOrder>(`/orders/${id}/verification`, { method: 'POST', body: JSON.stringify({ photos }) }),
  addTracking: (id: string, deliveryService: string, trackingNumber: string) =>
    request<SellerOrder>(`/orders/${id}/tracking`, { method: 'POST', body: JSON.stringify({ deliveryService, trackingNumber }) }),
  requests: () => request<ProductRequest[]>('/requests'),
  createRequest: (body: { name: string; brand: string; colorway: string; sizes: string[]; supportingUrls: string[]; note: string }) =>
    request<ProductRequest>('/requests', { method: 'POST', body: JSON.stringify(body) }),
};
