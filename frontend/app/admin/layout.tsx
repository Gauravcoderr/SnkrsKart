'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import {
  OrdersIcon,
  UsersIcon,
  ProductsIcon,
  InquiriesIcon,
  StarIcon,
  BannersIcon,
  SellersIcon,
  BlogsIcon,
  ChatLeadsIcon,
  PagesIcon,
  LogoutIcon,
  SearchIcon,
  DealVerifIcon,
  MailIcon,
} from '@/components/ui/Icons';
import { Spinner } from '@/app/admin/_components/AdminLoader';

const NAV = [
  { href: '/admin/orders',    label: 'Orders',    Icon: OrdersIcon },
  { href: '/admin/users',     label: 'Users',     Icon: UsersIcon },
  { href: '/admin/dashboard', label: 'Products',  Icon: ProductsIcon },
  { href: '/admin/inquiries', label: 'Inquiries', Icon: InquiriesIcon },
  { href: '/admin/reviews',   label: 'Reviews',   Icon: StarIcon },
  { href: '/admin/banners',   label: 'Banners',   Icon: BannersIcon },
  { href: '/admin/sellers',   label: 'Sellers',   Icon: SellersIcon },
  { href: '/admin/seller-orders', label: 'Seller Orders', Icon: OrdersIcon },
  { href: '/admin/product-requests', label: 'Product Requests', Icon: InquiriesIcon },
  { href: '/admin/payouts', label: 'Payouts', Icon: DealVerifIcon },
  { href: '/admin/blogs',             label: 'Blogs',           Icon: BlogsIcon },
  { href: '/admin/sneaker-profiles',  label: 'Sneaker Profiles', Icon: ProductsIcon },
  { href: '/admin/drops',             label: 'Drops',            Icon: StarIcon },
  { href: '/admin/coupons',           label: 'Coupons',          Icon: BannersIcon },
  { href: '/admin/scraped-products',   label: 'Scraped Products', Icon: SearchIcon },
  { href: '/admin/chat-leads',           label: 'Chat Leads',    Icon: ChatLeadsIcon },
  { href: '/admin/deal-verifications',   label: 'Deal Checks',   Icon: DealVerifIcon },
  { href: '/admin/newsletter',           label: 'Newsletter',    Icon: MailIcon },
  { href: '/admin/email-blast',          label: 'Email Blast',   Icon: BlogsIcon },
  { href: '/admin/pages',             label: 'Pages & SEO',      Icon: PagesIcon },
];

const AUTH_EXEMPT = ['/admin/login'];

function SideTip({ label, children }: { label: string; children: React.ReactElement }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="right"
          sideOffset={8}
          className="bg-zinc-800 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl border border-zinc-700 z-50"
        >
          {label}
          <Tooltip.Arrow className="fill-zinc-800" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function Brand({ collapsed = false, onClick }: { collapsed?: boolean; onClick?: () => void }) {
  return (
    <Link
      href="/admin/orders"
      onClick={onClick}
      className={`flex items-center gap-3 min-w-0 ${collapsed ? 'justify-center' : ''}`}
      aria-label="SNKRS CART admin home"
    >
      <span className="w-9 h-9 shrink-0 rounded-lg bg-white p-0.5 flex items-center justify-center overflow-hidden">
        <Image src="/logo.png" alt="" width={36} height={36} className="w-full h-full object-contain" priority />
      </span>
      {!collapsed && (
        <span className="min-w-0">
          <span className="block text-sm font-black tracking-tight text-white leading-none">SNKRS CART</span>
          <span className="block text-[10px] font-semibold tracking-widest uppercase text-zinc-500 mt-1">Admin</span>
        </span>
      )}
    </Link>
  );
}

function NavLinks({
  pathname,
  collapsed,
  onNavigate,
  onLogout,
}: {
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  const linkClass = (active: boolean) =>
    `flex items-center rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
      active ? 'bg-white text-zinc-900' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
    } ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'}`;

  return (
    <>
      <nav className={`flex-1 py-3 space-y-0.5 overflow-y-auto ${collapsed ? 'px-2' : 'px-3'}`}>
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          const link = (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              aria-label={collapsed ? label : undefined}
              className={linkClass(active)}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-zinc-900' : 'text-zinc-500'}`} />
              {!collapsed && label}
            </Link>
          );
          return collapsed ? <SideTip key={href} label={label}>{link}</SideTip> : link;
        })}
      </nav>

      <div className={`border-t border-zinc-800 py-3 ${collapsed ? 'px-2' : 'px-3'}`}>
        {(() => {
          const btn = (
            <button type="button" onClick={onLogout} aria-label="Logout" className={`w-full ${linkClass(false)}`}>
              <LogoutIcon className="w-4 h-4 shrink-0" />
              {!collapsed && 'Logout'}
            </button>
          );
          return collapsed ? <SideTip label="Logout">{btn}</SideTip> : btn;
        })()}
      </div>
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isExempt = AUTH_EXEMPT.includes(pathname);

  useEffect(() => {
    try {
      if (localStorage.getItem('admin_sidebar_collapsed') === 'true') setCollapsed(true);
    } catch {}
  }, []);

  useEffect(() => {
    if (isExempt) { setReady(true); return; }
    const token = localStorage.getItem('admin_token');
    if (!token) { router.push('/admin/login'); return; }
    setReady(true);
  }, [isExempt, router]);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [drawerOpen]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      try {
        localStorage.setItem('admin_sidebar_collapsed', String(!prev));
      } catch {}
      return !prev;
    });
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Spinner className="w-5 h-5" />
      </div>
    );
  }

  if (isExempt) return <>{children}</>;

  function handleLogout() {
    localStorage.removeItem('admin_token');
    router.push('/admin/login');
  }

  const sidebarW = collapsed ? 'md:w-14' : 'md:w-56';
  const mainML = collapsed ? 'md:ml-14' : 'md:ml-56';
  const pageTitle = NAV.find((n) => pathname.startsWith(n.href))?.label ?? 'Admin';

  return (
    <Tooltip.Provider delayDuration={200}>
      <div className="min-h-screen bg-zinc-950 flex overflow-hidden">
        <aside className={`hidden md:flex fixed top-0 left-0 h-full ${sidebarW} bg-zinc-900 border-r border-zinc-800 flex-col z-30 transition-all duration-200`}>
          <div className={`border-b border-zinc-800 ${collapsed ? 'flex flex-col items-center gap-2 py-4' : 'flex items-center justify-between gap-2 px-4 py-4'}`}>
            <Brand collapsed={collapsed} />
            <button
              type="button"
              onClick={toggleCollapsed}
              className="shrink-0 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!collapsed}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {collapsed
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
                }
              </svg>
            </button>
          </div>
          <NavLinks pathname={pathname} collapsed={collapsed} onLogout={handleLogout} />
        </aside>

        <div
          className={`md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={closeDrawer}
          aria-hidden="true"
        />
        <aside
          id="admin-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Admin menu"
          aria-hidden={!drawerOpen}
          className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] flex flex-col bg-zinc-900 border-r border-zinc-800 shadow-2xl transition-transform duration-200 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex items-center justify-between gap-2 px-4 h-14 border-b border-zinc-800">
            <Brand onClick={closeDrawer} />
            <button
              type="button"
              onClick={closeDrawer}
              aria-label="Close menu"
              className="w-11 h-11 -mr-2 inline-flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <NavLinks pathname={pathname} collapsed={false} onNavigate={closeDrawer} onLogout={handleLogout} />
        </aside>

        <div className={`${mainML} flex-1 min-h-screen flex flex-col min-w-0 transition-all duration-200`}>
          <header className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur border-b border-zinc-800 h-14 flex items-center gap-1 px-2 sm:px-6">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              aria-controls="admin-drawer"
              className="md:hidden w-11 h-11 inline-flex items-center justify-center rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors shrink-0"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <p className="text-sm text-zinc-400 font-medium truncate">{pageTitle}</p>
          </header>

          <main className="flex-1 p-4 sm:p-6 overflow-x-auto min-w-0">
            {children}
          </main>
        </div>
      </div>
    </Tooltip.Provider>
  );
}
