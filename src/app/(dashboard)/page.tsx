import { requireAuth } from '@/lib/auth/server';
import { getOrganizacion } from '@/lib/queries/organizaciones';
import { OrgCard } from './components/OrgCard';

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
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 text-sm text-gray-500">
        Fase 0 completa — el sistema de costos se construye encima de estos cimientos.
      </div>
    </div>
  );
}
