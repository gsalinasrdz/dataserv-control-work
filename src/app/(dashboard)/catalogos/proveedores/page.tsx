import { requireAuth } from '@/lib/auth/server';
import { getProveedores } from '@/lib/queries/proveedores';
import Link from 'next/link';
import { ProveedoresTabla } from './components/ProveedoresTabla';

export default async function ProveedoresPage() {
  const ctx = await requireAuth();
  const lista = await getProveedores(ctx);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Proveedores</h1>
        <Link
          href="/catalogos/proveedores/nuevo"
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
        >
          + Nuevo proveedor
        </Link>
      </div>

      {lista.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500 text-sm">
          Sin proveedores.{' '}
          <Link href="/catalogos/proveedores/nuevo" className="text-green-600 hover:underline">
            Agregar el primero
          </Link>
        </div>
      ) : (
        <ProveedoresTabla proveedores={lista} />
      )}
    </div>
  );
}
