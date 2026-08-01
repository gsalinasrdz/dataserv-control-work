export const dynamic = 'force-dynamic';

import { requireAuth } from '@/lib/auth/server';
import { getResumenDashboard } from '@/lib/queries/organizaciones';
import Link from 'next/link';

function fmt(n: number) {
  return '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const ESTADO_LABEL: Record<string, string> = {
  recibida: 'Recibidas',
  parcialmente_asignada: 'Parciales',
  asignada: 'Asignadas',
  cerrada: 'Cerradas',
};

const ESTADO_COLOR: Record<string, string> = {
  recibida: 'text-yellow-700 bg-yellow-50',
  parcialmente_asignada: 'text-blue-700 bg-blue-50',
  asignada: 'text-green-700 bg-green-50',
  cerrada: 'text-gray-600 bg-gray-50',
};

export default async function DashboardPage() {
  const ctx = await requireAuth();
  const resumen = await getResumenDashboard(ctx);

  const pctEjercido =
    resumen.presupuestoTotal > 0
      ? Math.min(100, (resumen.ejercidoTotal / resumen.presupuestoTotal) * 100)
      : 0;

  const totalFacturas = Object.values(resumen.facturasPorEstado).reduce(
    (a, b) => a + b,
    0,
  );

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Panel de control</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Proyectos activos</div>
          <div className="text-3xl font-bold text-gray-900">{resumen.proyectosActivos}</div>
          {resumen.proyectosEnRiesgo > 0 && (
            <div className="text-xs text-orange-600 font-medium mt-1">
              ⚠ {resumen.proyectosEnRiesgo} en riesgo presupuestal (&gt;85%)
            </div>
          )}
          <Link href="/proyectos" className="text-xs text-blue-600 hover:underline mt-1 block">
            Ver proyectos →
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Presupuesto total</div>
          <div className="text-2xl font-bold text-gray-900 tabular-nums">
            {fmt(resumen.presupuestoTotal)}
          </div>
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${pctEjercido}%` }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-1 tabular-nums">
            Ejercido: {fmt(resumen.ejercidoTotal)}{' '}
            <span className="text-gray-300">({pctEjercido.toFixed(1)}%)</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">
            Facturas ({totalFacturas})
          </div>
          <div className="space-y-1">
            {Object.entries(ESTADO_LABEL).map(([estado, label]) => {
              const count = resumen.facturasPorEstado[estado] ?? 0;
              if (count === 0) return null;
              return (
                <div key={estado} className="flex items-center justify-between">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ESTADO_COLOR[estado]}`}>
                    {label}
                  </span>
                  <span className="text-sm font-semibold text-gray-700">{count}</span>
                </div>
              );
            })}
            {totalFacturas === 0 && (
              <p className="text-xs text-gray-400">Sin facturas registradas</p>
            )}
          </div>
          <Link href="/facturas" className="text-xs text-blue-600 hover:underline mt-2 block">
            Ver facturas →
          </Link>
        </div>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Catálogos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/catalogos/proveedores"
            className="bg-white rounded-lg border border-gray-200 px-4 py-3 hover:border-blue-300 hover:shadow-sm transition-all text-sm font-medium text-gray-700"
          >
            Proveedores →
          </Link>
          <Link
            href="/catalogos/materiales"
            className="bg-white rounded-lg border border-gray-200 px-4 py-3 hover:border-blue-300 hover:shadow-sm transition-all text-sm font-medium text-gray-700"
          >
            Materiales →
          </Link>
        </div>
      </div>
    </div>
  );
}
