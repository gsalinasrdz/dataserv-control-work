'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Proyecto {
  id: string;
  clave: string;
  nombre: string;
  empresa: string | null;
  estado: string;
  fechaInicio: string | null;
  fechaFinEstimada: string | null;
}

const ESTADO_BADGE: Record<string, string> = {
  activo: 'bg-green-100 text-green-800',
  pausado: 'bg-yellow-100 text-yellow-800',
  cerrado: 'bg-gray-100 text-gray-600',
};

const ESTADOS = ['todos', 'activo', 'pausado', 'cerrado'] as const;

interface Props {
  proyectos: Proyecto[];
}

function formatDate(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function ProyectosTabla({ proyectos }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('todos');

  const lista = proyectos.filter((p) => {
    const matchEstado = estadoFiltro === 'todos' || p.estado === estadoFiltro;
    const q = busqueda.toLowerCase();
    const matchBusqueda =
      !q ||
      p.clave.toLowerCase().includes(q) ||
      p.nombre.toLowerCase().includes(q) ||
      (p.empresa ?? '').toLowerCase().includes(q);
    return matchEstado && matchBusqueda;
  });

  return (
    <div className="space-y-4">
      {/* Barra de filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          placeholder="Buscar por clave, nombre o empresa…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-1">
          {ESTADOS.map((e) => (
            <button
              key={e}
              onClick={() => setEstadoFiltro(e)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                estadoFiltro === e
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {e.charAt(0).toUpperCase() + e.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {lista.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400 text-sm">
          {busqueda || estadoFiltro !== 'todos'
            ? 'Sin resultados para el filtro actual.'
            : 'Sin proyectos registrados.'}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Clave', 'Nombre', 'Empresa', 'Estado', 'Inicio', 'Fin est.'].map((h) => (
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
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">
                    <Link
                      href={`/proyectos/${p.id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {p.clave}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{p.nombre}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.empresa ?? '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        ESTADO_BADGE[p.estado] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {p.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(p.fechaInicio)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(p.fechaFinEstimada)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
            {lista.length} de {proyectos.length} proyectos
          </div>
        </div>
      )}
    </div>
  );
}
