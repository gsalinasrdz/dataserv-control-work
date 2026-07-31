import { requireAuth } from '@/lib/auth/server';
import { getConceptosReporte } from '@/lib/queries/reporte';
import { ReporteEditor } from './components/ReporteEditor';
import Link from 'next/link';

export default async function ProyectoReportePage({
  params,
}: {
  params: Promise<{ proyectoId: string }>;
}) {
  const { proyectoId } = await params;
  const ctx = await requireAuth();
  const conceptos = await getConceptosReporte(ctx, proyectoId);

  if (conceptos.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-sm text-gray-500">
        Este proyecto no tiene costos asignados aún.{' '}
        <Link href="/facturas" className="text-blue-600 hover:underline">
          Asigna conceptos de facturas →
        </Link>
      </div>
    );
  }

  return <ReporteEditor conceptosIniciales={conceptos} proyectoId={proyectoId} />;
}
