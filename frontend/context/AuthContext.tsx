'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
  refreshUser: async () => {},
  logout: () => {},
});

async function fetchMe(): Promise<UserProfile | null> {
  const res = await fetch(`${API}/auth/me`, { credentials: 'include' });
  if (res.ok) return res.json();

  if (res.status === 401) {
    // Try token refresh
    const refreshRes = await fetch(`${API}/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (refreshRes.ok) {
      const retry = await fetch(`${API}/auth/me`, { credentials: 'include' });
      if (retry.ok) return retry.json();
    }
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const { data: user = null, isLoading } = useQuery<UserProfile | null>({
    queryKey: ['auth', 'me'],
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000, // 5 min
    retry: false,
    refetchOnWindowFocus: true,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' });
    },
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.invalidateQueries({ queryKey: ['orders', 'my'] });
    },
  });

  const refreshUser = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: ['auth', 'me'] });
    queryClient.invalidateQueries({ queryKey: ['orders', 'my'] });
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
