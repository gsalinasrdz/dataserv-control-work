import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { NavLink } from './components/NavLink';
import { Toaster } from 'sonner';

const NAV_LINKS = [
  { href: '/proyectos', label: 'Proyectos' },
  { href: '/facturas', label: 'Facturas' },
  { href: '/catalogos/proveedores', label: 'Proveedores' },
  { href: '/catalogos/materiales', label: 'Materiales' },
] as const;

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-bold text-gray-900 text-base tracking-tight">
              OpsCore
            </Link>
            <div className="hidden sm:flex items-center gap-6">
              {NAV_LINKS.map((link) => (
                <NavLink key={link.href} href={link.href}>
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400 hidden sm:block truncate max-w-40">
              {session.user?.email}
            </span>
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/login' });
              }}
            >
              <button
                type="submit"
                className="text-xs text-gray-500 hover:text-red-600 transition-colors font-medium"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
        <div className="sm:hidden border-t border-gray-100 px-4 py-2 flex gap-4 overflow-x-auto">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} href={link.href}>
              {link.label}
            </NavLink>
          ))}
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
