'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileUp, LayoutDashboard, List, MessageCircle, Settings } from 'lucide-react';
import clsx from 'clsx';
import { LogoMark } from './Logo';

const ITEMS = [
  { href: '', label: 'Panou', icon: LayoutDashboard },
  { href: '/tranzactii', label: 'Tranzacții', icon: List },
  { href: '/extrase', label: 'Extrase', icon: FileUp },
  { href: '/asistent', label: 'Asistent', icon: MessageCircle },
  { href: '/setari', label: 'Setări', icon: Settings },
];

export function AppNav({ base, householdName, demo = false }: { base: string; householdName: string; demo?: boolean }) {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href={base} className="flex items-center gap-2 font-display text-lg whitespace-nowrap">
          <LogoMark className="h-6 w-6" />
          {householdName}
        </Link>
        {demo && <span className="rounded-full bg-warn-soft px-2 py-0.5 text-xs font-semibold text-warn">Demo</span>}
        <nav className="ml-auto flex gap-1 overflow-x-auto">
          {ITEMS.filter((i) => !demo || i.href === '').map((i) => {
            const href = `${base}${i.href}`;
            const active = i.href === '' ? path === base : path.startsWith(href);
            return (
              <Link
                key={i.href}
                href={href}
                className={clsx(
                  'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm whitespace-nowrap',
                  active ? 'bg-ink text-paper' : 'text-muted hover:text-ink',
                )}
              >
                <i.icon className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">{i.label}</span>
              </Link>
            );
          })}
          {demo && (
            <Link href="/intra" className="btn btn-accent ml-2 py-2">
              Începe
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
