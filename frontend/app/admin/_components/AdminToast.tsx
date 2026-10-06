'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

type ToastKind = 'success' | 'error';
export type ShowAdminToast = (message: string, kind?: ToastKind) => void;

interface ToastState {
  message: string;
  kind: ToastKind;
}

const AdminToastContext = createContext<ShowAdminToast | null>(null);

export function useAdminToast(): ShowAdminToast {
  const ctx = useContext(AdminToastContext);
  if (!ctx) throw new Error('useAdminToast must be used inside AdminToastProvider');
  return ctx;
}

export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback<ShowAdminToast>((message, kind = 'success') => {
    setToast({ message, kind });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), kind === 'error' ? 5000 : 3500);
  }, []);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <AdminToastContext.Provider value={show}>
      {children}
      {toast && (
        <div
          role="status"
          aria-live={toast.kind === 'error' ? 'assertive' : 'polite'}
          className={`fixed bottom-6 right-4 sm:right-6 z-[100] max-w-[calc(100vw-2rem)] px-4 py-3 rounded-lg text-sm font-medium shadow-lg border ${
            toast.kind === 'error' ? 'bg-red-950 border-red-800 text-red-200' : 'bg-zinc-900 border-zinc-700 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </AdminToastContext.Provider>
  );
}
