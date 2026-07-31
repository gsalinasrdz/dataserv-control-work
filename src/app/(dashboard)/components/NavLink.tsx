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
        'text-sm transition-colors',
        isActive
          ? 'text-gray-900 font-semibold border-b-2 border-blue-600 pb-0.5'
          : 'text-gray-500 hover:text-gray-900',
      )}
    >
      {children}
    </Link>
  );
}
