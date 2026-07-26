'use client';

import { useState, useTransition } from 'react';
import { createTrabajo } from '@/lib/actions/trabajos';

interface Trabajo {
  id: string;
  clave: string;
  nombre: string;
  unidad: string;
  presupuestoCantidad: string;
  presupuestoUnitario: string;
  ejercido: string;
}

interface Props {
  frenteId: string;
  proyectoId: string;
  clave: string;
  nombre: string;
  trabajos: Trabajo[];
}

export function FrenteSection({ frenteId, proyectoId, clave, nombre, trabajos }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [pending, startTransition] = useTransition();

  const totalPresupuesto = trabajos.reduce(
    (sum, t) => sum + parseFloat(t.presupuestoCantidad) * parseFloat(t.presupuestoUnitario),
    0,
  );
  const totalEjercido = trabajos.reduce((sum, t) => sum + parseFloat(t.ejercido), 0);

  async function handleAddTrabajo(formData: FormData) {
    startTransition(async () => {
      try {
        await createTrabajo(proyectoId, frenteId, formData);
        setShowForm(false);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Error al agregar trabajo');
      }
    });
  }

  const fmt = (n: number) =>
    '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2 });

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200">
        <div>
          <span className="font-mono text-xs text-gray-500 mr-2">{clave}</span>
          <span className="font-semibold text-gray-900">{nombre}</span>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <span className="text-gray-500">Ppto: {fmt(totalPresupuesto)}</span>
          <span className="text-blue-600">Ejercido: {fmt(totalEjercido)}</span>
          {totalPresupuesto > 0 && (
            <span className={totalEjercido > totalPresupuesto ? 'text-red-600 font-semibold' : 'text-green-600'}>
              Desv: {fmt(totalPresupuesto - totalEjercido)}
            </span>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            + Trabajo
          </button>
        </div>
      </div>

      {trabajos.length > 0 && (
        <table className="min-w-full divide-y divide-gray-100">
          <thead>
            <tr className="text-xs text-gray-400 uppercase">
              <th className="px-4 py-2 text-left w-24">Clave</th>
              <th className="px-4 py-2 text-left">Nombre</th>
              <th className="px-4 py-2 text-right w-16">Unidad</th>
              <th className="px-4 py-2 text-right w-32">Presupuesto</th>
              <th className="px-4 py-2 text-right w-32">Ejercido</th>
              <th className="px-4 py-2 text-right w-32">Desviación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {trabajos.map((t) => {
              const presupuesto =
                parseFloat(t.presupuestoCantidad) * parseFloat(t.presupuestoUnitario);
              const ejercido = parseFloat(t.ejercido);
              const desviacion = presupuesto - ejercido;
              return (
                <tr key={t.id} className="hover:bg-gray-50 text-sm">
                  <td className="px-4 py-2 font-mono text-xs text-gray-500">{t.clave}</td>
                  <td className="px-4 py-2 text-gray-900">{t.nombre}</td>
                  <td className="px-4 py-2 text-right text-gray-500">{t.unidad}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{fmt(presupuesto)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-blue-600">{fmt(ejercido)}</td>
                  <td className={`px-4 py-2 text-right tabular-nums font-medium ${desviacion < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {fmt(desviacion)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {showForm && (
        <form action={handleAddTrabajo} className="p-4 border-t border-gray-100 bg-blue-50 flex gap-2 flex-wrap">
          <input name="clave" required placeholder="EST-001" className="border rounded px-2 py-1 text-xs font-mono w-24 uppercase" />
          <input name="nombre" required placeholder="Nombre del trabajo" className="border rounded px-2 py-1 text-xs flex-1 min-w-36" />
          <input name="unidad" required placeholder="m2" className="border rounded px-2 py-1 text-xs w-16" />
          <input name="cantidad" type="number" step="0.0001" defaultValue="0" className="border rounded px-2 py-1 text-xs w-24 text-right" />
          <input name="precio_unitario" type="number" step="0.0001" defaultValue="0" className="border rounded px-2 py-1 text-xs w-24 text-right" />
          <button type="submit" disabled={pending} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium disabled:opacity-50">
            {pending ? '...' : 'Agregar'}
          </button>
          <button type="button" onClick={() => setShowForm(false)} className="text-xs text-gray-500 px-2">
            Cancelar
          </button>
        </form>
      )}

      {trabajos.length === 0 && !showForm && (
        <p className="px-4 py-3 text-xs text-gray-400">Sin trabajos. Agrega uno o usa el importador CSV.</p>
      )}
    </div>
  );
}
