import { requireAuth } from '@/lib/auth/server';
import { getMateriales } from '@/lib/queries/materiales';
import { MaterialesTabla } from './components/MaterialesTabla';
import Link from 'next/link';

export default async function MaterialesPage() {
  const ctx = await requireAuth();
  const lista = await getMateriales(ctx);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Materiales</h1>
        <Link
          href="/catalogos/materiales/nuevo"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Nuevo material
        </Link>
      </div>
      <MaterialesTabla materiales={lista} />
    </div>
  );
}
