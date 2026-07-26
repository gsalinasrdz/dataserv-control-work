import { requireAuth } from '@/lib/auth/server';
import { getFacturas } from '@/lib/queries/facturas';
import { SubirXmlForm } from './components/SubirXmlForm';

const ESTADO_BADGE: Record<string, string> = {
  recibida: 'bg-yellow-100 text-yellow-800',
  parcialmente_asignada: 'bg-blue-100 text-blue-800',
  asignada: 'bg-green-100 text-green-800',
  cerrada: 'bg-gray-100 text-gray-700',
};

export default async function FacturasPage() {
  const ctx = await requireAuth();
  const facturasList = await getFacturas(ctx);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Facturas</h1>
        <SubirXmlForm />
      </div>

      {facturasList.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500 text-sm">
          Sin facturas. Carga un XML CFDI para comenzar.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr className="text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">UUID Fiscal</th>
                <th className="px-4 py-3 text-left">Emisor</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {facturasList.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50 text-sm">
                  <td className="px-4 py-3">
                    <a
                      href={`/facturas/${f.id}`}
                      className="font-mono text-xs text-blue-600 hover:underline"
                    >
                      {f.serie ? `${f.serie}-` : ''}{f.folio ?? ''}{' '}
                      <span className="text-gray-400">({f.uuidFiscal.substring(0, 8)}…)</span>
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <div className="font-medium">{f.nombreEmisor}</div>
                    <div className="text-xs text-gray-400 font-mono">{f.rfcEmisor}</div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    {f.moneda} ${parseFloat(f.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(f.fechaEmision).toLocaleDateString('es-MX')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ESTADO_BADGE[f.estado] ?? 'bg-gray-100 text-gray-700'}`}>
                      {f.estado.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
