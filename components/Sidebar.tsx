'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import {
  LayoutGrid, Sparkles, BarChart2, Settings,
  Newspaper, LogOut, ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { label: 'Deal Room',        href: '/deal-room',    icon: LayoutGrid },
  { label: 'Smart Matches',    href: '/my-matches',   icon: Sparkles   },
  { label: 'Market Analytics', href: '/analytics',    icon: BarChart2  },
  { label: 'News & Events',    href: '/news-events',  icon: Newspaper  },
  { label: 'My Criteria',      href: '/my-criteria',  icon: Settings   },
];

export default function Sidebar() {
  const pathname    = usePathname();
  const { user }    = useUser();
  const { signOut } = useClerk();

  const initials = user?.firstName?.[0] && user?.lastName?.[0]
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.emailAddresses?.[0]?.emailAddress?.slice(0, 2).toUpperCase() || 'TV';

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-[#1a1f2e] flex flex-col z-50">
      {/* Logo */}
      <div className="px-4 pt-5 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
            TV
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-tight">Techosystem</p>
            <p className="text-gray-400 text-xs">VCC Hub</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href}>
            <div className={clsx('nav-item', pathname.startsWith(href) && 'nav-item-active')}>
              <Icon size={16} />
              <span>{label}</span>
            </div>
          </Link>
        ))}
      </nav>

      {/* User + Sign Out */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3 space-y-2">
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-7 h-7 rounded-full bg-blue-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-medium truncate">
              {user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0]}
            </p>
            <p className="text-gray-400 text-xs truncate">
              {user?.publicMetadata?.fund as string || 'VCC Member'}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
