'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Material {
  id: string;
  clave: string;
  nombre: string;
  unidad: string;
  descripcion: string | null;
}

interface Props {
  materiales: Material[];
}

export function MaterialesTabla({ materiales }: Props) {
  const [busqueda, setBusqueda] = useState('');

  const lista = materiales.filter((m) => {
    const q = busqueda.toLowerCase();
    return (
      !q ||
      m.clave.toLowerCase().includes(q) ||
      m.nombre.toLowerCase().includes(q) ||
      m.unidad.toLowerCase().includes(q) ||
      (m.descripcion ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-3">
      <input
        type="search"
        placeholder="Buscar por clave, nombre, unidad o descripción…"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full sm:max-w-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />

      {lista.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-gray-400 text-sm">
          {busqueda ? 'Sin resultados para el filtro actual.' : 'Sin materiales registrados.'}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Clave', 'Nombre', 'Unidad', 'Descripción', ''].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map((m) => (
                <tr key={m.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-gray-700 font-semibold">{m.clave}</td>
                  <td className="px-5 py-3 text-sm text-gray-900">{m.nombre}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{m.unidad}</td>
                  <td className="px-5 py-3 text-xs text-gray-400">{m.descripcion ?? '—'}</td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/catalogos/materiales/${m.id}`}
                      className="text-xs text-green-600 font-semibold hover:underline"
                    >
                      Editar →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-2 border-t border-gray-100 text-xs text-gray-400">
            {lista.length} de {materiales.length} materiales
          </div>
        </div>
      )}
    </div>
  );
}
