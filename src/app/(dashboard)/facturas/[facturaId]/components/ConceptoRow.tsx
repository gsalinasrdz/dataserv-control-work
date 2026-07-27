'use client';

import { useState, useTransition } from 'react';
import { asignarConcepto } from '@/lib/actions/asignaciones';

interface Asignacion {
  id: string;
  trabajoId: string;
  importe: string;
  categoria: string;
  fechaDevengo: string;
  estado: string;
}

interface Concepto {
  id: string;
  descripcion: string;
  claveProdServ: string | null;
  noIdentificacion: string | null;
  unidad: string | null;
  cantidad: string;
  importe: string;
  descuento: string;
  asignaciones: Asignacion[];
}

interface TrabajoFlat {
  id: string;
  clave: string;
  nombre: string;
  proyectoNombre: string | null;
  frenteNombre: string | null;
}

const CATEGORIAS = [
  { value: 'materiales', label: 'Materiales' },
  { value: 'mano_obra', label: 'Mano de obra' },
  { value: 'subcontratos', label: 'Subcontratos' },
  { value: 'equipo_renta', label: 'Equipo/Renta' },
  { value: 'fletes', label: 'Fletes' },
  { value: 'indirectos', label: 'Indirectos' },
  { value: 'otros', label: 'Otros' },
] as const;

const CATEGORIA_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIAS.map((c) => [c.value, c.label]),
);

export function ConceptoRow({
  concepto,
  trabajos,
}: {
  concepto: Concepto;
  trabajos: TrabajoFlat[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const importeConcepto = parseFloat(concepto.importe);
  const importeAsignado = concepto.asignaciones
    .filter((a) => a.estado === 'autorizada')
    .reduce((sum, a) => sum + parseFloat(a.importe), 0);
  const importeDisponible = importeConcepto - importeAsignado;

  async function handleAsignar(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await asignarConcepto({
        facturaConceptoId: concepto.id,
        trabajoId: formData.get('trabajo_id') as string,
        importe: formData.get('importe') as string,
        categoria: formData.get('categoria') as 'materiales',
        fechaDevengo: formData.get('fecha_devengo') as string,
      });
      if (result.ok) {
        setShowForm(false);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="border-b border-gray-100 last:border-0">
      <div className="px-4 py-3 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 font-medium truncate">{concepto.descripcion}</p>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">
            {concepto.claveProdServ ?? '—'} · {concepto.noIdentificacion ?? '—'} ·{' '}
            {parseFloat(concepto.cantidad).toLocaleString('es-MX')} {concepto.unidad ?? ''}
          </p>
        </div>
        <div className="text-right shrink-0 space-y-0.5">
          <div className="text-sm font-semibold tabular-nums">
            ${importeConcepto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs tabular-nums">
            <span className="text-green-600">
              Asignado: ${importeAsignado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
            {importeDisponible > 0 && (
              <span className="text-orange-500 ml-2">
                Disponible: ${importeDisponible.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </div>
        {importeDisponible > 0 && (
          <button
            onClick={() => { setShowForm(!showForm); setError(null); }}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium shrink-0"
          >
            {showForm ? 'Cancelar' : 'Asignar'}
          </button>
        )}
      </div>

      {showForm && (
        <form
          action={handleAsignar}
          className="px-4 pb-3 bg-blue-50 border-t border-blue-100 flex gap-2 flex-wrap items-end"
        >
          {error && (
            <p className="w-full text-xs text-red-600 pt-2">{error}</p>
          )}
          <div>
            <label className="block text-xs text-gray-500 mb-1 mt-2">Trabajo</label>
            <select
              name="trabajo_id"
              required
              className="border rounded px-2 py-1.5 text-xs min-w-48"
            >
              <option value="">— seleccionar —</option>
              {trabajos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.proyectoNombre ?? ''} › {t.frenteNombre ?? ''} › {t.clave} {t.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 mt-2">Categoría</label>
            <select name="categoria" required className="border rounded px-2 py-1.5 text-xs">
              {CATEGORIAS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 mt-2">Importe</label>
            <input
              name="importe"
              type="number"
              step="0.0001"
              min="0.0001"
              max={importeDisponible.toFixed(4)}
              defaultValue={importeDisponible.toFixed(4)}
              required
              className="border rounded px-2 py-1.5 text-xs w-28 text-right tabular-nums"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 mt-2">Fecha devengo</label>
            <input
              name="fecha_devengo"
              type="date"
              required
              defaultValue={new Date().toISOString().split('T')[0]}
              className="border rounded px-2 py-1.5 text-xs"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="mt-auto bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-medium disabled:opacity-50"
          >
            {pending ? '…' : 'Asignar'}
          </button>
        </form>
      )}

      {concepto.asignaciones.length > 0 && (
        <div className="px-4 pb-2 space-y-1">
          {concepto.asignaciones.map((a) => {
            const trabajo = trabajos.find((t) => t.id === a.trabajoId);
            const trabajoLabel = trabajo
              ? `${trabajo.proyectoNombre ?? ''} › ${trabajo.frenteNombre ?? ''} › ${trabajo.clave}`
              : a.trabajoId.substring(0, 8) + '…';
            return (
              <div key={a.id} className="flex items-center gap-2 text-xs text-gray-500 pl-2 border-l-2 border-green-200">
                <span className="max-w-52 truncate" title={trabajoLabel}>{trabajoLabel}</span>
                <span>{CATEGORIA_LABEL[a.categoria] ?? a.categoria}</span>
                <span className="tabular-nums font-medium text-green-700">
                  ${parseFloat(a.importe).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
                <span>{a.fechaDevengo}</span>
                {a.estado === 'cancelada' && <span className="text-red-500 line-through">cancelada</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
