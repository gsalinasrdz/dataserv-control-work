'use client';

import { useState, useTransition } from 'react';
import type { ConceptoReporte } from '@/lib/queries/reporte';

type Agrupacion = 'frente' | 'categoria' | 'plano';

const AGRUPACION_LABEL: Record<Agrupacion, string> = {
  frente: 'Frente',
  categoria: 'Categoría',
  plano: 'Sin agrupar',
};

const CATEGORIA_LABEL: Record<string, string> = {
  materiales: 'Materiales',
  mano_obra: 'Mano de obra',
  subcontratos: 'Subcontratos',
  equipo_renta: 'Equipo/Renta',
  fletes: 'Fletes',
  indirectos: 'Indirectos',
  otros: 'Otros',
};

function fmt(n: number): string {
  return '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2 });
}

function groupByKey(
  conceptos: ConceptoReporte[],
  agrupacion: Agrupacion,
): { label: string; items: ConceptoReporte[] }[] {
  if (agrupacion === 'plano') {
    return [{ label: 'Todos los conceptos', items: conceptos }];
  }
  const map = new Map<string, ConceptoReporte[]>();
  for (const c of conceptos) {
    const key = agrupacion === 'frente' ? c.frenteNombre : c.categoria;
    const list = map.get(key);
    if (list) list.push(c);
    else map.set(key, [c]);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

interface Props {
  conceptosIniciales: ConceptoReporte[];
  proyectoId: string;
}

export function ReporteEditor({ conceptosIniciales, proyectoId }: Props) {
  const [conceptos, setConceptos] = useState<ConceptoReporte[]>(conceptosIniciales);
  const [agrupacion, setAgrupacion] = useState<Agrupacion>('frente');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editImporte, setEditImporte] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const grupos = groupByKey(conceptos, agrupacion);
  const total = conceptos.reduce((s, c) => s + (Number(c.importe) || 0), 0);

  function startEdit(c: ConceptoReporte) {
    setEditingId(c.asignacionId);
    setEditDesc(c.descripcion);
    setEditImporte(c.importe);
  }

  function saveEdit(id: string) {
    setConceptos((prev) =>
      prev.map((c) =>
        c.asignacionId === id
          ? { ...c, descripcion: editDesc, importe: editImporte }
          : c,
      ),
    );
    setEditingId(null);
  }

  function handleExport() {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/proyectos/${proyectoId}/reporte.pdf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conceptos, agrupacion }),
        });
        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error ?? 'Error al generar PDF');
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-${proyectoId}-${new Date().toISOString().split('T')[0]}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al exportar');
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Agrupar por:</span>
          {(['frente', 'categoria', 'plano'] as Agrupacion[]).map((a) => (
            <button
              key={a}
              onClick={() => setAgrupacion(a)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                agrupacion === a
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {AGRUPACION_LABEL[a]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            onClick={handleExport}
            disabled={pending}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {pending ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generando…
              </>
            ) : (
              'Exportar PDF'
            )}
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {grupos.map((grupo) => (
          <div key={grupo.label}>
            {agrupacion !== 'plano' && (
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  {grupo.label}
                </span>
              </div>
            )}
            <table className="min-w-full">
              <thead>
                <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                  <th className="px-4 py-2 text-left w-28">ClaveProdServ</th>
                  <th className="px-4 py-2 text-left">Descripción</th>
                  <th className="px-4 py-2 text-left w-32">Categoría</th>
                  <th className="px-4 py-2 text-right w-32">Importe</th>
                  <th className="px-4 py-2 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {grupo.items.map((c) =>
                  editingId === c.asignacionId ? (
                    <tr key={c.asignacionId} className="bg-blue-50 text-sm">
                      <td className="px-4 py-2 text-xs font-mono text-gray-500">
                        {c.claveProdServ ?? '—'}
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="border rounded px-2 py-1 text-xs w-full"
                        />
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-500">
                        {CATEGORIA_LABEL[c.categoria] ?? c.categoria}
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={editImporte}
                          onChange={(e) => setEditImporte(e.target.value)}
                          className="border rounded px-2 py-1 text-xs w-28 text-right"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1">
                          <button
                            onClick={() => saveEdit(c.asignacionId)}
                            className="text-xs bg-blue-600 text-white px-2 py-1 rounded"
                          >
                            OK
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-xs text-gray-500 px-2"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={c.asignacionId} className="hover:bg-gray-50 text-sm group">
                      <td className="px-4 py-2 text-xs font-mono text-gray-400">
                        {c.claveProdServ ?? '—'}
                      </td>
                      <td className="px-4 py-2 text-gray-900">{c.descripcion}</td>
                      <td className="px-4 py-2 text-xs text-gray-500">
                        {CATEGORIA_LABEL[c.categoria] ?? c.categoria}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums font-medium">
                        {fmt(Number(c.importe) || 0)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => startEdit(c)}
                          className="text-xs text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 bg-gray-50">
                  <td colSpan={3} className="px-4 py-2 text-xs font-semibold text-gray-600">
                    {agrupacion !== 'plano' ? `Subtotal ${grupo.label}` : 'Total'}
                  </td>
                  <td className="px-4 py-2 text-right text-sm font-semibold tabular-nums">
                    {fmt(grupo.items.reduce((s, c) => s + (Number(c.importe) || 0), 0))}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        ))}

        <div className="border-t-2 border-gray-300 px-4 py-3 flex justify-between items-center bg-gray-50">
          <span className="text-sm font-bold text-gray-900">TOTAL PROYECTO</span>
          <span className="text-lg font-bold tabular-nums text-gray-900">{fmt(total)}</span>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Los ajustes de descripción e importe son solo para el PDF — no modifican la base de datos.
      </p>
    </div>
  );
}
