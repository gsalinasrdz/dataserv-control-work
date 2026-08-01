// src/app/(dashboard)/layout.tsx
import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { NavLink } from './components/NavLink';
import { CatalogosDropdown } from './components/CatalogosDropdown';
import { Toaster } from 'sonner';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[54px] flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="bg-green-600 text-white text-[11px] font-black px-2 py-1 rounded-md tracking-wide">
                PC
              </span>
              <span className="font-bold text-[14px] text-gray-900 tracking-tight hidden sm:block">
                Proyect Control
              </span>
            </Link>
            <div className="hidden sm:flex items-center gap-1">
              <NavLink href="/proyectos">Proyectos</NavLink>
              <NavLink href="/facturas">Facturas</NavLink>
              <CatalogosDropdown />
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
        {/* Mobile nav */}
        <div className="sm:hidden border-t border-gray-100 px-4 py-2 flex gap-1 overflow-x-auto">
          <NavLink href="/proyectos">Proyectos</NavLink>
          <NavLink href="/facturas">Facturas</NavLink>
          <NavLink href="/catalogos/proveedores">Proveedores</NavLink>
          <NavLink href="/catalogos/materiales">Materiales</NavLink>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
