import { requireAuth } from '@/lib/auth/server';
import { getFacturasByProyecto } from '@/lib/queries/facturas';
import Link from 'next/link';

export default async function ProyectoFacturasPage({
  params,
}: {
  params: Promise<{ proyectoId: string }>;
}) {
  const { proyectoId } = await params;
  const ctx = await requireAuth();
  const facturas = await getFacturasByProyecto(ctx, proyectoId);

  if (facturas.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-sm text-gray-500">
        Sin facturas asignadas a este proyecto.{' '}
        <Link href="/facturas" className="text-blue-600 hover:underline">
          Carga facturas aquí →
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr className="text-xs text-gray-500 uppercase tracking-wide">
            <th className="px-4 py-3 text-left">UUID / Folio</th>
            <th className="px-4 py-3 text-left">Emisor</th>
            <th className="px-4 py-3 text-right">Total factura</th>
            <th className="px-4 py-3 text-right">Asignado a proyecto</th>
            <th className="px-4 py-3 text-left">Fecha</th>
            <th className="px-4 py-3 text-left">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {facturas.map((f) => (
            <tr key={f.id} className="hover:bg-gray-50 text-sm">
              <td className="px-4 py-3">
                <Link
                  href={`/facturas/${f.id}`}
                  className="font-mono text-xs text-blue-600 hover:underline"
                >
                  {f.serie ? `${f.serie}-` : ''}
                  {f.folio ?? ''}{' '}
                  <span className="text-gray-400">({f.uuidFiscal.substring(0, 8)}…)</span>
                </Link>
              </td>
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900">{f.nombreEmisor}</div>
                <div className="text-xs text-gray-400 font-mono">{f.rfcEmisor}</div>
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {f.moneda} ${parseFloat(f.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-green-700 font-medium">
                ${parseFloat(f.importeAsignado).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3 text-xs text-gray-500">
                {new Date(f.fechaEmision).toLocaleDateString('es-MX')}
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                  {f.estado.replace(/_/g, ' ')}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
        {facturas.length} {facturas.length === 1 ? 'factura' : 'facturas'} con costos asignados
      </div>
    </div>
  );
}
