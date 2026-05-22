'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const TABS = [
  { href: '/', label: 'Hoy', icon: '◎' },
  { href: '/workout', label: 'Entreno', icon: '◫' },
  { href: '/nutrition', label: 'Comida', icon: '◐' },
  { href: '/body', label: 'Cuerpo', icon: '◇' },
  { href: '/progress', label: 'Progreso', icon: '◊' },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg/95 backdrop-blur border-t border-border safe-bottom z-40">
      <div className="max-w-md mx-auto grid grid-cols-5">
        {TABS.map((t) => {
          const active =
            t.href === '/'
              ? pathname === '/'
              : pathname === t.href || pathname.startsWith(t.href + '/');
          return (
            <Link
              key={t.href}
              href={t.href}
              className={clsx(
                'flex flex-col items-center justify-center py-2 text-[11px] gap-0.5 transition-colors',
                active ? 'text-white' : 'text-muted',
              )}
            >
              <span className="text-lg leading-none">{t.icon}</span>
              <span>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
