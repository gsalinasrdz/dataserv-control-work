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
    <div className="space-y-3">
      <input
        type="search"
        placeholder="Buscar por nombre, RFC, contacto o email…"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full sm:max-w-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />

      {lista.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-gray-400 text-sm">
          {busqueda ? 'Sin resultados para el filtro actual.' : 'Sin proveedores registrados.'}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Nombre', 'RFC', 'Contacto', 'Teléfono', 'Email', ''].map((h) => (
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
              {lista.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-sm font-semibold text-gray-900">{p.nombre}</td>
                  <td className="px-5 py-3 text-xs text-gray-500 font-mono">{p.rfc ?? '—'}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{p.contacto ?? '—'}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{p.telefono ?? '—'}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{p.email ?? '—'}</td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/catalogos/proveedores/${p.id}`}
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
            {lista.length} de {proveedores.length} proveedores
          </div>
        </div>
      )}
    </div>
  );
}
