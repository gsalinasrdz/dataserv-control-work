import { requireAuth } from '@/lib/auth/server';
import { getOrganizacion } from '@/lib/queries/organizaciones';
import { OrgCard } from './components/OrgCard';
import Link from 'next/link';

export default async function DashboardPage() {
  const ctx = await requireAuth();
  const org = await getOrganizacion(ctx);

  if (!org) {
    return (
      <div className="text-gray-500">
        No se encontró organización. Contacta al administrador.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Panel de control</h1>
      <OrgCard nombre={org.nombre} rfc={org.rfc} organizacionId={org.id} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/proyectos"
          className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 hover:shadow-sm transition-all"
        >
          <div className="text-sm font-medium text-gray-500 mb-1">Proyectos</div>
          <div className="text-gray-700 text-sm">Estructura y presupuesto</div>
        </Link>
        <Link
          href="/catalogos/proveedores"
          className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 hover:shadow-sm transition-all"
        >
          <div className="text-sm font-medium text-gray-500 mb-1">Proveedores</div>
          <div className="text-gray-700 text-sm">Catálogo de proveedores</div>
        </Link>
        <Link
          href="/catalogos/materiales"
          className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 hover:shadow-sm transition-all"
        >
          <div className="text-sm font-medium text-gray-500 mb-1">Materiales</div>
          <div className="text-gray-700 text-sm">Catálogo de materiales</div>
        </Link>
      </div>
    </div>
  );
}
