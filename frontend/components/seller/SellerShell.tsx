'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { sellerApi, getSellerToken, setSellerToken, SellerAuthError } from '@/lib/sellerApi';
import type { SellerProfile, SellerOrder, SellerOrderStatus, VerificationStatus, PayoutStatus } from '@/types/seller';
import type { Availability } from '@/types';
import { AVAILABILITY_META } from '@/lib/availability';
import { cn } from '@/lib/utils';

export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP || '919410903791';

export const inputClass =
  'w-full border border-zinc-200 bg-white px-3 py-2.5 min-h-[44px] text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 transition-colors disabled:bg-zinc-50 disabled:text-zinc-400';
export const labelClass = 'block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1.5';
export const btnPrimary =
  'inline-flex items-center justify-center gap-2 min-h-[44px] px-5 bg-zinc-900 text-white text-xs font-bold tracking-widest uppercase hover:bg-zinc-700 disabled:bg-zinc-400 disabled:cursor-not-allowed transition-colors';
export const btnSecondary =
  'inline-flex items-center justify-center gap-2 min-h-[44px] px-5 border border-zinc-900 bg-white text-zinc-900 text-xs font-bold tracking-widest uppercase hover:bg-zinc-900 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors';
export const btnGhost =
  'inline-flex items-center justify-center gap-2 min-h-[40px] px-3 text-xs font-bold tracking-widest uppercase text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors';
export const btnDanger =
  'inline-flex items-center justify-center gap-2 min-h-[44px] px-5 bg-red-600 text-white text-xs font-bold tracking-widest uppercase hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors';

interface SellerContextValue {
  seller: SellerProfile;
  refresh: () => Promise<void>;
  logout: () => void;
}

const SellerContext = createContext<SellerContextValue | null>(null);

export function useSeller(): SellerContextValue {
  const ctx = useContext(SellerContext);
  if (!ctx) throw new Error('useSeller must be used inside SellerShell');
  return ctx;
}

export function useHandleApiError() {
  const router = useRouter();
  return useCallback(
    (err: unknown): string => {
      if (err instanceof SellerAuthError) {
        setSellerToken(null);
        router.replace('/sellers/login');
        return 'Session expired. Please log in again.';
      }
      return err instanceof Error ? err.message : 'Something went wrong';
    },
    [router],
  );
}

export function formatDate(iso: string | null | undefined, withTime = false): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(
    'en-IN',
    withTime
      ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
      : { day: 'numeric', month: 'short', year: 'numeric' },
  );
}

export function sizeLabel(size: number | string): string {
  const s = String(size).trim();
  return s !== '' && Number.isFinite(Number(s)) ? `UK ${s}` : s;
}

export function needsAction(order: SellerOrder): 'photos' | 'tracking' | null {
  if (order.status !== 'confirmed') return null;
  const v = order.verification.status;
  if (v === 'none' || v === 'rejected') return 'photos';
  if (v === 'approved' && !order.trackingNumber) return 'tracking';
  return null;
}

export const DEFAULT_PENALTY_TEXT = 'Orders not shipped within the timeline attract a late-fulfilment penalty, deducted from the payout as per the SNKRS CART seller terms.';

export function shipByInfo(order: SellerOrder): { text: string; overdue: boolean; dueSoon: boolean } | null {
  if (!order.shipBy) return null;
  const due = new Date(order.shipBy).getTime();
  const shippedAt = order.trackingAddedAt ? new Date(order.trackingAddedAt).getTime() : null;
  if (shippedAt !== null) {
    const lateH = Math.round((shippedAt - due) / 3600000);
    return lateH > 0
      ? { text: `Shipped ${lateH >= 24 ? `${Math.round(lateH / 24)} day${Math.round(lateH / 24) === 1 ? '' : 's'}` : `${lateH}h`} after the deadline`, overdue: true, dueSoon: false }
      : { text: 'Shipped within the timeline', overdue: false, dueSoon: false };
  }
  if (order.status !== 'confirmed') return null;
  const diffH = Math.round((due - Date.now()) / 3600000);
  if (diffH < 0) {
    const h = Math.abs(diffH);
    return { text: `Overdue by ${h >= 24 ? `${Math.round(h / 24)} day${Math.round(h / 24) === 1 ? '' : 's'}` : `${h}h`}`, overdue: true, dueSoon: false };
  }
  if (diffH < 24) return { text: `Ship within ${Math.max(1, diffH)}h`, overdue: false, dueSoon: true };
  return { text: `Ship within ${Math.round(diffH / 24)} day${Math.round(diffH / 24) === 1 ? '' : 's'}`, overdue: false, dueSoon: false };
}

export function actionLabel(order: SellerOrder): string | null {
  const kind = needsAction(order);
  if (kind === 'photos') return 'Upload verification photos';
  if (kind === 'tracking') return 'Add tracking';
  return null;
}

const ORDER_STATUS: Record<SellerOrderStatus, { label: string; className: string }> = {
  pending_payment: { label: 'Pending payment', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  confirmed: { label: 'Confirmed', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  shipped: { label: 'Shipped', className: 'bg-violet-50 text-violet-700 border-violet-200' },
  delivered: { label: 'Delivered', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-700 border-red-200' },
};

const VERIFICATION_STATUS: Record<VerificationStatus, { label: string; className: string }> = {
  none: { label: 'Photos needed', className: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
  pending: { label: 'Photos in review', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved: { label: 'Photos verified', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Photos rejected', className: 'bg-red-50 text-red-700 border-red-200' },
};

const pillBase = 'inline-flex items-center gap-1.5 border px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase whitespace-nowrap';

export function StatusPill({ status, className }: { status: SellerOrderStatus; className?: string }) {
  const meta = ORDER_STATUS[status] ?? ORDER_STATUS.pending_payment;
  return <span className={cn(pillBase, meta.className, className)}>{meta.label}</span>;
}

export function VerificationPill({ status, className }: { status: VerificationStatus; className?: string }) {
  const meta = VERIFICATION_STATUS[status] ?? VERIFICATION_STATUS.none;
  return <span className={cn(pillBase, meta.className, className)}>{meta.label}</span>;
}

const PAYOUT_STATUS: Record<PayoutStatus, { label: string; className: string }> = {
  pending: { label: 'Payout after delivery', className: 'bg-zinc-50 text-zinc-500 border-zinc-200' },
  due: { label: 'Payout due', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  paid: { label: 'Paid out', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

export function PayoutPill({ status, className }: { status: PayoutStatus; className?: string }) {
  const meta = PAYOUT_STATUS[status] ?? PAYOUT_STATUS.pending;
  return <span className={cn(pillBase, meta.className, className)}>{meta.label}</span>;
}

export function AvailabilityBadge({ availability, showDescription = false, className }: { availability: Availability; showDescription?: boolean; className?: string }) {
  const meta = AVAILABILITY_META[availability] ?? AVAILABILITY_META.inhand;
  return (
    <span className={cn('inline-flex flex-col', className)}>
      <span className={cn(pillBase, meta.badgeClass)}>
        <span className={cn('w-1.5 h-1.5 rounded-full', meta.dotClass)} />
        {meta.label}
      </span>
      {showDescription && <span className="text-[11px] text-zinc-400 mt-1">{meta.description}</span>}
    </span>
  );
}

export function ProductThumb({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <div className={cn('relative shrink-0 bg-zinc-100 overflow-hidden', className ?? 'w-14 h-14')}>
      {src ? (
        <Image src={src} alt={alt} fill className="object-cover" sizes="96px" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold tracking-widest uppercase text-zinc-400">No image</div>
      )}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <div className={cn('w-5 h-5 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin', className)} aria-label="Loading" />;
}

export function LoadingBlock({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
      <Spinner />
      <p className="text-[10px] font-bold tracking-widest uppercase">{label}</p>
    </div>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="border border-red-200 bg-red-50 p-6 text-center">
      <p className="text-[10px] font-bold tracking-widest uppercase text-red-500 mb-2">Something went wrong</p>
      <p className="text-sm text-red-700 mb-4">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className={btnSecondary}>
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyBlock({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="border border-dashed border-zinc-200 bg-white px-6 py-12 text-center">
      <p className="text-sm font-bold text-zinc-900 mb-1">{title}</p>
      {body && <p className="text-sm text-zinc-500 max-w-md mx-auto">{body}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('bg-white border border-zinc-200', className)}>{children}</div>;
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 md:mb-8">
      <div>
        {eyebrow && <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-1.5">{eyebrow}</p>}
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900">{title}</h1>
        {description && <p className="text-sm text-zinc-500 mt-1.5 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export interface ToastState {
  message: string;
  type: 'success' | 'error';
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3500);
  }, []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return { toast, show };
}

export function Toast({ toast }: { toast: ToastState | null }) {
  if (!toast) return null;
  return (
    <div
      role="status"
      className={cn(
        'fixed left-1/2 -translate-x-1/2 bottom-20 md:bottom-6 z-[70] px-4 py-3 text-xs font-bold shadow-lg max-w-[calc(100vw-2rem)] text-center',
        toast.type === 'success' ? 'bg-zinc-900 text-white' : 'bg-red-600 text-white',
      )}
    >
      {toast.message}
    </div>
  );
}

type NavIconName = 'dashboard' | 'listings' | 'orders' | 'requests' | 'settings' | 'logout';

const NAV: Array<{ href: string; label: string; icon: NavIconName }> = [
  { href: '/sellers', label: 'Dashboard', icon: 'dashboard' },
  { href: '/sellers/listings', label: 'Listings', icon: 'listings' },
  { href: '/sellers/orders', label: 'Orders', icon: 'orders' },
  { href: '/sellers/requests', label: 'Requests', icon: 'requests' },
  { href: '/sellers/settings', label: 'Settings', icon: 'settings' },
];

export function NavIcon({ name, className }: { name: NavIconName; className?: string }) {
  const props = {
    className,
    fill: 'none',
    viewBox: '0 0 24 24',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (name) {
    case 'dashboard':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
      );
    case 'listings':
      return (
        <svg {...props}>
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
          <circle cx="7" cy="7" r="1.5" />
        </svg>
      );
    case 'orders':
      return (
        <svg {...props}>
          <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
          <path d="M3 8l9 5 9-5" />
          <path d="M12 13v8" />
        </svg>
      );
    case 'requests':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      );
    case 'logout':
      return (
        <svg {...props}>
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
      );
  }
}

function isActive(pathname: string, href: string) {
  return href === '/sellers' ? pathname === '/sellers' : pathname.startsWith(href);
}

export default function SellerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === '/sellers/login';
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [error, setError] = useState('');

  const logout = useCallback(() => {
    setSellerToken(null);
    setSeller(null);
    router.replace('/sellers/login');
  }, [router]);

  const load = useCallback(async () => {
    if (!getSellerToken()) {
      router.replace('/sellers/login');
      return;
    }
    setError('');
    try {
      setSeller(await sellerApi.me());
    } catch (err) {
      if (err instanceof SellerAuthError) {
        router.replace('/sellers/login');
        return;
      }
      setError(err instanceof Error ? err.message : 'Could not load your profile');
    }
  }, [router]);

  useEffect(() => {
    if (!isLogin) load();
  }, [isLogin, load]);

  const mustReset = !!seller?.mustChangePassword && pathname !== '/sellers/settings';

  useEffect(() => {
    if (mustReset) router.replace('/sellers/settings?reset=1');
  }, [mustReset, router]);

  if (isLogin) return <>{children}</>;

  if (!seller || mustReset) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        {error ? (
          <div className="w-full max-w-sm">
            <ErrorBlock message={error} onRetry={load} />
            <button type="button" onClick={logout} className={cn(btnGhost, 'w-full mt-3')}>
              Log out
            </button>
          </div>
        ) : (
          <Spinner />
        )}
      </div>
    );
  }

  return (
    <SellerContext.Provider value={{ seller, refresh: load, logout }}>
      <div className="min-h-screen bg-zinc-50 text-zinc-900">
        <aside className="hidden md:flex fixed inset-y-0 left-0 z-30 w-56 flex-col bg-white border-r border-zinc-200">
          <Link href="/sellers" className="block px-5 py-6 border-b border-zinc-100">
            <p className="text-base font-black tracking-tight text-zinc-900 leading-none">SNKRS CART</p>
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400 mt-1.5">Seller Portal</p>
          </Link>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 text-xs font-bold tracking-widest uppercase transition-colors',
                    active ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
                  )}
                >
                  <NavIcon name={item.icon} className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="px-3 py-4 border-t border-zinc-100">
            <div className="px-3 pb-3">
              <p className="text-sm font-bold text-zinc-900 truncate">{seller.name}</p>
              <p className="text-[11px] text-zinc-400 truncate">{seller.email}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold tracking-widest uppercase text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
            >
              <NavIcon name="logout" className="w-4 h-4 shrink-0" />
              Logout
            </button>
          </div>
        </aside>

        <header className="md:hidden sticky top-0 z-30 bg-white border-b border-zinc-200 px-4 h-14 flex items-center justify-between gap-3">
          <Link href="/sellers" className="block">
            <p className="text-sm font-black tracking-tight text-zinc-900 leading-none">SNKRS CART</p>
            <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-zinc-400 mt-1">Seller Portal</p>
          </Link>
          <p className="text-xs font-bold text-zinc-700 truncate max-w-[50%]">{seller.name}</p>
        </header>

        <main className="md:pl-56 pb-24 md:pb-0">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6 md:py-10">{children}</div>
        </main>

        <nav
          className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-zinc-200 grid grid-cols-5"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn('flex flex-col items-center justify-center gap-1 h-16', active ? 'text-zinc-900' : 'text-zinc-400')}
              >
                <NavIcon name={item.icon} className="w-5 h-5" />
                <span className="text-[9px] font-bold tracking-widest uppercase">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </SellerContext.Provider>
  );
}
