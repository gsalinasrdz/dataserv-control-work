import { requireAuth } from '@/lib/auth/server';
import { getFacturaConDetalles } from '@/lib/queries/facturas';
import { getTrabajosFlat } from '@/lib/queries/trabajos';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ConceptoRow } from './components/ConceptoRow';

export default async function FacturaDetailPage({
  params,
}: {
  params: Promise<{ facturaId: string }>;
}) {
  const { facturaId } = await params;
  const ctx = await requireAuth();

  const [factura, trabajosList] = await Promise.all([
    getFacturaConDetalles(ctx, facturaId),
    getTrabajosFlat(ctx),
  ]);

  if (!factura) notFound();

  type ConceptoWithAsignaciones = (typeof factura.conceptos)[number] & {
    asignaciones: {
      id: string;
      trabajoId: string;
      trabajoClave: string | null;
      trabajoNombre: string | null;
      importe: string;
      categoria: string;
      fechaDevengo: string;
      estado: string;
    }[];
  };

  const conceptos = factura.conceptos as ConceptoWithAsignaciones[];

  const totalAsignado = conceptos.reduce((sum, c) => {
    const asignado = c.asignaciones
      .filter((a) => a.estado === 'autorizada')
      .reduce((s, a) => s + parseFloat(a.importe), 0);
    return sum + asignado;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
        <Link href="/facturas" className="hover:text-gray-700">Facturas</Link>
        <span>/</span>
        <span className="font-mono text-gray-700">
          {factura.serie ? `${factura.serie}-` : ''}{factura.folio ?? factura.uuidFiscal.substring(0, 8)}
        </span>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">Emisor</div>
          <div className="font-medium text-gray-900 text-sm mt-0.5">{factura.nombreEmisor}</div>
          <div className="text-xs text-gray-400 font-mono">{factura.rfcEmisor}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">UUID Fiscal</div>
          <div className="font-mono text-xs text-gray-700 mt-0.5 break-all">{factura.uuidFiscal}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">Fecha emisión</div>
          <div className="text-sm text-gray-700 mt-0.5">
            {new Date(factura.fechaEmision).toLocaleDateString('es-MX')}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Total factura</div>
          <div className="text-xl font-bold text-gray-900 tabular-nums mt-0.5">
            {factura.moneda} ${parseFloat(factura.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-green-600 tabular-nums">
            Asignado: ${totalAsignado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-orange-500 tabular-nums">
            Disponible: ${(parseFloat(factura.subtotal) - totalAsignado).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700">
            Conceptos ({conceptos.length})
          </h2>
        </div>
        {conceptos.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400 text-center">Sin conceptos registrados.</p>
        ) : (
          conceptos.map((c) => (
            <ConceptoRow key={c.id} concepto={c} trabajos={trabajosList} />
          ))
        )}
      </div>
    </div>
  );
}
