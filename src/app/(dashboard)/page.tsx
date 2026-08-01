// src/app/(dashboard)/page.tsx
export const dynamic = 'force-dynamic';

import { requireAuth } from '@/lib/auth/server';
import { getResumenDashboard } from '@/lib/queries/organizaciones';
import { estadoBadge } from '@/lib/badge';
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

export default async function DashboardPage() {
  const ctx = await requireAuth();
  const resumen = await getResumenDashboard(ctx);

  const pctEjercido =
    resumen.presupuestoTotal > 0
      ? Math.min(100, (resumen.ejercidoTotal / resumen.presupuestoTotal) * 100)
      : 0;

  const totalFacturas = Object.values(resumen.facturasPorEstado).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Panel de control</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Proyectos activos */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Proyectos activos
            </span>
            <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-base">
              🏗️
            </span>
          </div>
          <div className="text-3xl font-extrabold text-gray-900">{resumen.proyectosActivos}</div>
          {resumen.proyectosEnRiesgo > 0 && (
            <div className="text-xs text-amber-600 font-semibold">
              ⚠ {resumen.proyectosEnRiesgo} en riesgo presupuestal (&gt;85%)
            </div>
          )}
          <Link href="/proyectos" className="text-xs text-green-600 font-medium hover:underline">
            Ver proyectos →
          </Link>
        </div>

        {/* Presupuesto */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Presupuesto total
            </span>
            <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-base">
              💰
            </span>
          </div>
          <div className="text-2xl font-extrabold text-gray-900 tabular-nums">
            {fmt(resumen.presupuestoTotal)}
          </div>
          <div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-600 rounded-full transition-all"
                style={{ width: `${pctEjercido}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 mt-1 tabular-nums">
              Ejercido: {fmt(resumen.ejercidoTotal)}{' '}
              <span className="text-gray-300">({pctEjercido.toFixed(1)}%)</span>
            </div>
          </div>
        </div>

        {/* Facturas */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Facturas ({totalFacturas})
            </span>
            <span className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-base">
              📄
            </span>
          </div>
          <div className="space-y-1.5">
            {Object.entries(ESTADO_LABEL).map(([estado, label]) => {
              const count = resumen.facturasPorEstado[estado] ?? 0;
              if (count === 0) return null;
              return (
                <div key={estado} className="flex items-center justify-between">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${estadoBadge(estado)}`}>
                    {label}
                  </span>
                  <span className="text-sm font-bold text-gray-700">{count}</span>
                </div>
              );
            })}
            {totalFacturas === 0 && (
              <p className="text-xs text-gray-400">Sin facturas registradas</p>
            )}
          </div>
          <Link href="/facturas" className="text-xs text-green-600 font-medium hover:underline">
            Ver facturas →
          </Link>
        </div>
      </div>

      {/* Quick links catálogos */}
      <div>
        <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
          Catálogos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/catalogos/proveedores"
            className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 hover:border-green-300 hover:shadow-md transition-all text-sm font-semibold text-gray-700"
          >
            Proveedores →
          </Link>
          <Link
            href="/catalogos/materiales"
            className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 hover:border-green-300 hover:shadow-md transition-all text-sm font-semibold text-gray-700"
          >
            Materiales →
          </Link>
        </div>
      </div>
    </div>
  );
}
