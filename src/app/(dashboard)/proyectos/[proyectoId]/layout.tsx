import { requireAuth } from '@/lib/auth/server';
import { getResumenProyecto } from '@/lib/queries/proyectos';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { NavLink } from '@/app/(dashboard)/components/NavLink';

function barColor(pct: number): string {
  if (pct >= 100) return 'bg-red-500';
  if (pct >= 75) return 'bg-orange-400';
  return 'bg-blue-500';
}

function fmt(n: number): string {
  return '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2 });
}

export default async function ProyectoLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ proyectoId: string }>;
}) {
  const { proyectoId } = await params;
  const ctx = await requireAuth();
  const resumen = await getResumenProyecto(ctx, proyectoId);
  if (!resumen) notFound();

  const rawPct =
    resumen.presupuestoTotal > 0
      ? (resumen.ejercidoTotal / resumen.presupuestoTotal) * 100
      : 0;
  const pct = Math.min(100, rawPct);
  const disponible = resumen.presupuestoTotal - resumen.ejercidoTotal;

  return (
    <div className="space-y-6">
      {/* Header compartido */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href="/proyectos" className="hover:text-gray-700">
                Proyectos
              </Link>
              <span>/</span>
              <span className="font-mono">{resumen.clave}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{resumen.nombre}</h1>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span className="capitalize">{resumen.estado}</span>
              {resumen.fechaInicio && <span>Inicio: {resumen.fechaInicio}</span>}
              {resumen.fechaFinEstimada && <span>Fin est.: {resumen.fechaFinEstimada}</span>}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              href={`/proyectos/${proyectoId}/importar`}
              className="text-sm text-blue-600 border border-blue-200 px-3 py-1.5 rounded-md hover:bg-blue-50"
            >
              Importar CSV
            </Link>
            <Link
              href={`/proyectos/${proyectoId}/editar`}
              className="text-sm text-gray-600 border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-50"
            >
              Editar
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Presupuesto</div>
            <div className="font-semibold tabular-nums">{fmt(resumen.presupuestoTotal)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Ejercido</div>
            <div className="font-semibold tabular-nums text-blue-600">{fmt(resumen.ejercidoTotal)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Disponible</div>
            <div className={`font-semibold tabular-nums ${disponible < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {fmt(disponible)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">% Avance</div>
            <div className="font-semibold tabular-nums">{pct.toFixed(1)}%</div>
          </div>
        </div>

        {/* Barra de progreso global */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor(rawPct)}`}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          <NavLink href={`/proyectos/${proyectoId}`} exact>
            Trabajos
          </NavLink>
          <NavLink href={`/proyectos/${proyectoId}/facturas`}>Facturas</NavLink>
          <NavLink href={`/proyectos/${proyectoId}/reporte`}>Reporte</NavLink>
        </nav>
      </div>

      {children}
    </div>
  );
}
