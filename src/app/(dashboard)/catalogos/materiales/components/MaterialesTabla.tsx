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
    <div className="space-y-4">
      <input
        type="search"
        placeholder="Buscar por clave, nombre, unidad o descripción…"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full sm:max-w-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {lista.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400 text-sm">
          {busqueda ? 'Sin resultados para el filtro actual.' : 'Sin materiales registrados.'}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Clave', 'Nombre', 'Unidad', 'Descripción', ''].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lista.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 text-sm">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700 font-medium">{m.clave}</td>
                  <td className="px-4 py-3 text-gray-900">{m.nombre}</td>
                  <td className="px-4 py-3 text-gray-500">{m.unidad}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{m.descripcion ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/catalogos/materiales/${m.id}`}
                      className="text-blue-600 hover:underline text-sm font-medium"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
            {lista.length} de {materiales.length} materiales
          </div>
        </div>
      )}
    </div>
  );
}
