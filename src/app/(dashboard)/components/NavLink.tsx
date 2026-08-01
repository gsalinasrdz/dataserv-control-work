// src/app/(dashboard)/components/NavLink.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  exact?: boolean;
}

export function NavLink({ href, children, exact = false }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = exact
    ? pathname === href
    : pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={cn(
        'text-sm px-4 py-1.5 rounded-full transition-colors font-medium',
        isActive
          ? 'bg-green-600 text-white'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900',
      )}
    >
      {children}
    </Link>
  );
}
