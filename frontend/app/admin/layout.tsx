'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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

  const isExempt = AUTH_EXEMPT.includes(pathname);

  useEffect(() => {
    if (isExempt) { setReady(true); return; }
    const token = localStorage.getItem('admin_token');
    if (!token) { router.push('/admin/login'); return; }
    setReady(true);
  }, [isExempt, router]);

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

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-56 bg-zinc-900 border-r border-zinc-800 flex flex-col z-30">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-zinc-800">
          <p className="text-base font-black tracking-tight text-white">SNKRS CART</p>
          <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-500">Admin Panel</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-white text-zinc-900'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-zinc-900' : 'text-zinc-500'}`} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <LogoutIcon className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="ml-56 flex-1 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur border-b border-zinc-800 h-14 flex items-center px-6">
          <p className="text-sm text-zinc-400 font-medium">
            {NAV.find((n) => pathname.startsWith(n.href))?.label ?? 'Admin'}
          </p>
        </header>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
