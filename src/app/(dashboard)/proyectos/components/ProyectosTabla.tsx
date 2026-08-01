// src/app/(dashboard)/proyectos/components/ProyectosTabla.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { estadoBadge } from '@/lib/badge';

interface Proyecto {
  id: string;
  clave: string;
  nombre: string;
  empresa: string | null;
  estado: string;
  fechaInicio: string | null;
  fechaFinEstimada: string | null;
}

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
    <div className="space-y-3">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          placeholder="Buscar por clave, nombre o empresa…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <div className="flex gap-1">
          {ESTADOS.map((e) => (
            <button
              key={e}
              onClick={() => setEstadoFiltro(e)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                estadoFiltro === e
                  ? 'bg-green-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {e.charAt(0).toUpperCase() + e.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {lista.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-gray-400 text-sm">
          {busqueda || estadoFiltro !== 'todos'
            ? 'Sin resultados para el filtro actual.'
            : 'Sin proyectos registrados.'}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Clave', 'Nombre', 'Empresa', 'Estado', 'Inicio', 'Fin est.', 'Ejercido'].map((h) => (
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
              {lista.map((p, i) => {
                return (
                  <tr
                    key={p.id}
                    className={`border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors ${
                      i % 2 === 0 ? '' : 'bg-gray-50/40'
                    }`}
                  >
                    <td className="px-5 py-3 font-mono text-xs">
                      <Link
                        href={`/proyectos/${p.id}`}
                        className="text-green-600 hover:underline font-semibold"
                      >
                        {p.clave}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-gray-900">{p.nombre}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{p.empresa ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${estadoBadge(p.estado)}`}>
                        {p.estado}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400">{formatDate(p.fechaInicio)}</td>
                    <td className="px-5 py-3 text-xs text-gray-400">{formatDate(p.fechaFinEstimada)}</td>
                    <td className="px-5 py-3">
                      <Link href={`/proyectos/${p.id}`} className="text-xs text-green-600 font-semibold hover:underline">
                        Ver →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-5 py-2 border-t border-gray-100 text-xs text-gray-400">
            {lista.length} de {proyectos.length} proyectos
          </div>
        </div>
      )}
    </div>
  );
}
