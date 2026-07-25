import { requireAuth } from '@/lib/auth/server';
import { getProyectos } from '@/lib/queries/proyectos';
import Link from 'next/link';

const estadoBadge: Record<string, string> = {
  activo: 'bg-green-100 text-green-800',
  pausado: 'bg-yellow-100 text-yellow-800',
  cerrado: 'bg-gray-100 text-gray-600',
};

export default async function ProyectosPage() {
  const ctx = await requireAuth();
  const lista = await getProyectos(ctx);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Proyectos</h1>
        <Link
          href="/proyectos/nuevo"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Nuevo proyecto
        </Link>
      </div>

      {lista.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500 text-sm">
          Sin proyectos registrados.{' '}
          <Link href="/proyectos/nuevo" className="text-blue-600 hover:underline">
            Crear el primero
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Clave', 'Nombre', 'Empresa', 'Estado', 'Inicio', 'Fin est.'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lista.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">
                    <Link href={`/proyectos/${p.id}`} className="text-blue-600 hover:underline font-medium">
                      {p.clave}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{p.nombre}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.empresa ?? '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${estadoBadge[p.estado] ?? ''}`}>
                      {p.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.fechaInicio ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.fechaFinEstimada ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
