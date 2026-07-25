import { auth } from '@/auth';
import { signOut } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-semibold text-gray-900">OpsCore</Link>
            <div className="hidden sm:flex items-center gap-6">
              <Link href="/proyectos" className="text-sm text-gray-600 hover:text-gray-900">
                Proyectos
              </Link>
              <Link href="/catalogos/proveedores" className="text-sm text-gray-600 hover:text-gray-900">
                Proveedores
              </Link>
              <Link href="/catalogos/materiales" className="text-sm text-gray-600 hover:text-gray-900">
                Materiales
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:block">{session.user?.email}</span>
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/login' });
              }}
            >
              <button type="submit" className="text-sm text-gray-500 hover:text-gray-900">
                Salir
              </button>
            </form>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
