'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Proveedor {
  id: string;
  nombre: string;
  rfc: string | null;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
}

interface Props {
  proveedores: Proveedor[];
}

export function ProveedoresTabla({ proveedores }: Props) {
  const [busqueda, setBusqueda] = useState('');

  const lista = proveedores.filter((p) => {
    const q = busqueda.toLowerCase();
    return (
      !q ||
      p.nombre.toLowerCase().includes(q) ||
      (p.rfc ?? '').toLowerCase().includes(q) ||
      (p.contacto ?? '').toLowerCase().includes(q) ||
      (p.email ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <input
        type="search"
        placeholder="Buscar por nombre, RFC, contacto o email…"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full sm:max-w-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {lista.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400 text-sm">
          {busqueda ? 'Sin resultados para el filtro actual.' : 'Sin proveedores registrados.'}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Nombre', 'RFC', 'Contacto', 'Teléfono', 'Email', ''].map((h) => (
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
              {lista.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 text-sm">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.nombre}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.rfc ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{p.contacto ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{p.telefono ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{p.email ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/catalogos/proveedores/${p.id}`}
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
            {lista.length} de {proveedores.length} proveedores
          </div>
        </div>
      )}
    </div>
  );
}
