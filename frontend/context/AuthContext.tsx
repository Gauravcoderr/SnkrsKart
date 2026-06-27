'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const TOKEN_KEY = 'snkrs_token';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string) {
  if (typeof window !== 'undefined') localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window !== 'undefined') localStorage.removeItem(TOKEN_KEY);
}

export function authHeaders(): HeadersInit {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  addresses: Array<{
    _id: string;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
    isDefault: boolean;
  }>;
}

interface AuthState {
  user: UserProfile | null;
  isLoggedIn: boolean;
  loading: boolean;
  authModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  loginWithData: (user: UserProfile, token: string) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  isLoggedIn: false,
  loading: true,
  authModalOpen: false,
  openAuthModal: () => {},
  closeAuthModal: () => {},
  loginWithData: () => {},
  refreshUser: async () => {},
  logout: () => {},
});

async function fetchMe(): Promise<UserProfile | null> {
  const token = getStoredToken();
  if (!token) return null;

  const res = await fetch(`${API}/auth/me`, { credentials: 'include', headers: { Authorization: `Bearer ${token}` } });
  if (res.ok) return res.json();

  if (res.status === 401) {
    const refreshRes = await fetch(`${API}/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (refreshRes.ok) {
      const refreshData = await refreshRes.json();
      if (refreshData.accessToken) saveToken(refreshData.accessToken);
      const newHeaders: HeadersInit = refreshData.accessToken
        ? { Authorization: `Bearer ${refreshData.accessToken}` }
        : {};
      const retry = await fetch(`${API}/auth/me`, { credentials: 'include', headers: newHeaders });
      if (retry.ok) return retry.json();
    }
    clearToken();
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const { data: user = null, isLoading } = useQuery<UserProfile | null>({
    queryKey: ['auth', 'me'],
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: true,
  });

  const loginWithData = useCallback((userData: UserProfile, token: string) => {
    saveToken(token);
    queryClient.setQueryData(['auth', 'me'], userData);
    queryClient.invalidateQueries({ queryKey: ['orders', 'my'] });
  }, [queryClient]);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include', headers: authHeaders() });
    },
    onSuccess: () => {
      clearToken();
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.invalidateQueries({ queryKey: ['orders', 'my'] });
    },
  });

  const refreshUser = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: ['auth', 'me'] });
    queryClient.invalidateQueries({ queryKey: ['orders', 'my'] });
  }, [queryClient]);

  // Sync login/logout across tabs — when another tab writes or removes the token,
  // refetch auth state so all tabs stay consistent.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== TOKEN_KEY) return;
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        loading: isLoading,
        authModalOpen,
        openAuthModal: () => setAuthModalOpen(true),
        closeAuthModal: () => setAuthModalOpen(false),
        loginWithData,
        refreshUser,
        logout: () => logoutMutation.mutate(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
