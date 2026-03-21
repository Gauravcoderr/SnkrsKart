'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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
  LogoutIcon,
} from '@/components/ui/Icons';

const NAV = [
  { href: '/admin/orders',    label: 'Orders',    Icon: OrdersIcon },
  { href: '/admin/users',     label: 'Users',     Icon: UsersIcon },
  { href: '/admin/dashboard', label: 'Products',  Icon: ProductsIcon },
  { href: '/admin/inquiries', label: 'Inquiries', Icon: InquiriesIcon },
  { href: '/admin/reviews',   label: 'Reviews',   Icon: StarIcon },
  { href: '/admin/banners',   label: 'Banners',   Icon: BannersIcon },
  { href: '/admin/sellers',   label: 'Sellers',   Icon: SellersIcon },
  { href: '/admin/blogs',     label: 'Blogs',     Icon: BlogsIcon },
];

const AUTH_EXEMPT = ['/admin/login'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const isExempt = AUTH_EXEMPT.includes(pathname);

  useEffect(() => {
    const saved = localStorage.getItem('admin_sidebar_collapsed');
    if (saved === 'true') setCollapsed(true);
  }, []);

  useEffect(() => {
    if (isExempt) { setReady(true); return; }
    const token = localStorage.getItem('admin_token');
    if (!token) { router.push('/admin/login'); return; }
    setReady(true);
  }, [isExempt, router]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      localStorage.setItem('admin_sidebar_collapsed', String(!prev));
      return !prev;
    });
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (isExempt) return <>{children}</>;

  function handleLogout() {
    localStorage.removeItem('admin_token');
    router.push('/admin/login');
  }

  const sidebarW = collapsed ? 'w-14' : 'w-56';
  const mainML = collapsed ? 'ml-14' : 'ml-56';

  return (
    <Tooltip.Provider delayDuration={200}>
      <div className="min-h-screen bg-zinc-950 flex overflow-hidden">
        {/* Sidebar */}
        <aside className={`fixed top-0 left-0 h-full ${sidebarW} bg-zinc-900 border-r border-zinc-800 flex flex-col z-30 transition-all duration-200`}>
          {/* Brand + collapse toggle */}
          <div className={`border-b border-zinc-800 flex items-center ${collapsed ? 'justify-center py-4' : 'justify-between px-4 py-4'}`}>
            {!collapsed && (
              <div>
                <p className="text-sm font-black tracking-tight text-white">SNKRS CART</p>
                <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-500">Admin</span>
              </div>
            )}
            <button
              type="button"
              onClick={toggleCollapsed}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {collapsed
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
                }
              </svg>
            </button>
          </div>

          {/* Nav */}
          <nav className={`flex-1 py-3 space-y-0.5 ${collapsed ? 'px-2' : 'px-3'}`}>
            {NAV.map(({ href, label, Icon }) => {
              const active = pathname.startsWith(href);
              const linkClass = `flex items-center rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-white text-zinc-900' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              } ${collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'}`;

              return collapsed ? (
                <Tooltip.Root key={href}>
                  <Tooltip.Trigger asChild>
                    <Link href={href} className={linkClass}>
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-zinc-900' : 'text-zinc-500'}`} />
                    </Link>
                  </Tooltip.Trigger>
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
              ) : (
                <Link key={href} href={href} className={linkClass}>
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-zinc-900' : 'text-zinc-500'}`} />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className={`border-t border-zinc-800 py-3 ${collapsed ? 'px-2' : 'px-3'}`}>
            {collapsed ? (
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Logout"
                    aria-label="Logout"
                    className="w-full flex items-center justify-center p-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    <LogoutIcon className="w-4 h-4" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    side="right"
                    sideOffset={8}
                    className="bg-zinc-800 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl border border-zinc-700 z-50"
                  >
                    Logout
                    <Tooltip.Arrow className="fill-zinc-800" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            ) : (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <LogoutIcon className="w-4 h-4" />
                Logout
              </button>
            )}
          </div>
        </aside>

        {/* Main content */}
        <div className={`${mainML} flex-1 min-h-screen flex flex-col min-w-0 transition-all duration-200`}>
          {/* Top bar */}
          <header className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur border-b border-zinc-800 h-14 flex items-center px-6">
            <p className="text-sm text-zinc-400 font-medium">
              {NAV.find((n) => pathname.startsWith(n.href))?.label ?? 'Admin'}
            </p>
          </header>

          <main className="flex-1 p-6 overflow-x-auto min-w-0">
            {children}
          </main>
        </div>
      </div>
    </Tooltip.Provider>
  );
}
