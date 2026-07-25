import { requireAuth } from '@/lib/auth/server';
import { getProveedores } from '@/lib/queries/proveedores';
import Link from 'next/link';

export default async function ProveedoresPage() {
  const ctx = await requireAuth();
  const lista = await getProveedores(ctx);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
        <Link
          href="/catalogos/proveedores/nuevo"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Nuevo proveedor
        </Link>
      </div>

      {lista.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500 text-sm">
          Sin proveedores.{' '}
          <Link href="/catalogos/proveedores/nuevo" className="text-blue-600 hover:underline">
            Agregar el primero
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Nombre', 'RFC', 'Contacto', 'Teléfono', 'Email'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {lista.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 text-sm">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.nombre}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.rfc ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{p.contacto ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{p.telefono ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{p.email ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
