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
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Materiales</h1>
        <Link
          href="/catalogos/materiales/nuevo"
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
        >
          + Nuevo material
        </Link>
      </div>
      <MaterialesTabla materiales={lista} />
    </div>
  );
}
