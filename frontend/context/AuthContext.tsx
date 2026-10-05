'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStoredToken, saveToken, clearToken, authHeaders, refreshSession, TOKEN_KEY } from '@/lib/session';

export { getStoredToken, saveToken, clearToken, authHeaders };

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

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

function getMe(token: string | null): Promise<Response> {
  return fetch(`${API}/auth/me`, {
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

async function fetchMe(): Promise<UserProfile | null> {
  const res = await getMe(getStoredToken());
  if (res.ok) return res.json();
  if (res.status !== 401) throw new Error(`auth/me ${res.status}`);

  const refreshed = await refreshSession();
  if (refreshed.status === 'unauthenticated') return null;
  if (refreshed.status === 'unavailable') throw new Error('auth/refresh unavailable');

  const retry = await getMe(refreshed.token);
  if (retry.ok) return retry.json();
  if (retry.status === 401) {
    clearToken();
    return null;
  }
  throw new Error(`auth/me ${retry.status}`);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const { data: user = null, isLoading } = useQuery<UserProfile | null>({
    queryKey: ['auth', 'me'],
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15000),
    refetchOnWindowFocus: true,
  });

  const loginWithData = useCallback((userData: UserProfile, token: string) => {
    saveToken(token);
    queryClient.setQueryData(['auth', 'me'], userData);
    queryClient.invalidateQueries({ queryKey: ['orders', 'my'] });
  }, [queryClient]);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include', headers: authHeaders() }).catch(() => {});
    },
    onSettled: () => {
      clearToken();
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.invalidateQueries({ queryKey: ['orders', 'my'] });
    },
  });

  const refreshUser = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: ['auth', 'me'] });
    queryClient.invalidateQueries({ queryKey: ['orders', 'my'] });
  }, [queryClient]);

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
