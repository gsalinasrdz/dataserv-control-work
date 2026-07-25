import { requireAuth } from '@/lib/auth/server';
import { getMateriales } from '@/lib/queries/materiales';
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

      {lista.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500 text-sm">
          Sin materiales.{' '}
          <Link href="/catalogos/materiales/nuevo" className="text-blue-600 hover:underline">
            Agregar el primero
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Clave', 'Nombre', 'Unidad', 'Descripción'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {lista.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 text-sm">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700 font-medium">{m.clave}</td>
                  <td className="px-4 py-3 text-gray-900">{m.nombre}</td>
                  <td className="px-4 py-3 text-gray-500">{m.unidad}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{m.descripcion ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
