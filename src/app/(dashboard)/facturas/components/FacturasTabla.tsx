'use client';

import { useState } from 'react';
import Link from 'next/link';
import { estadoBadge } from '@/lib/badge';

interface Factura {
  id: string;
  uuidFiscal: string;
  serie: string | null;
  folio: string | null;
  nombreEmisor: string;
  rfcEmisor: string;
  total: string;
  moneda: string;
  fechaEmision: string | Date;
  estado: string;
}

const ESTADOS = ['todos', 'recibida', 'parcialmente_asignada', 'asignada', 'cerrada'] as const;
const ESTADO_LABEL: Record<string, string> = {
  todos: 'Todos',
  recibida: 'Recibidas',
  parcialmente_asignada: 'Parciales',
  asignada: 'Asignadas',
  cerrada: 'Cerradas',
};

interface Props {
  facturas: Factura[];
}

export function FacturasTabla({ facturas }: Props) {
  const [estadoFiltro, setEstadoFiltro] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');

  const lista = facturas.filter((f) => {
    const matchEstado = estadoFiltro === 'todos' || f.estado === estadoFiltro;
    const q = busqueda.toLowerCase();
    const matchBusqueda =
      !q ||
      f.rfcEmisor.toLowerCase().includes(q) ||
      f.nombreEmisor.toLowerCase().includes(q) ||
      f.uuidFiscal.toLowerCase().includes(q) ||
      (f.folio ?? '').toLowerCase().includes(q);
    return matchEstado && matchBusqueda;
  });

  return (
    <div className="space-y-3">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          placeholder="Buscar por RFC, emisor o UUID…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <div className="flex gap-1 flex-wrap">
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
              {ESTADO_LABEL[e]}
            </button>
          ))}
        </div>
      </div>

      {lista.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-gray-400 text-sm">
          {busqueda || estadoFiltro !== 'todos'
            ? 'Sin facturas para el filtro actual.'
            : 'Sin facturas. Carga un XML CFDI para comenzar.'}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['UUID Fiscal', 'Emisor', 'Total', 'Fecha', 'Estado'].map((h, i) => (
                  <th
                    key={h}
                    className={`px-5 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide ${
                      i === 2 ? 'text-right' : 'text-left'
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map((f) => (
                <tr key={f.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <Link
                      href={`/facturas/${f.id}`}
                      className="font-mono text-xs text-green-600 hover:underline font-semibold"
                    >
                      {f.serie ? `${f.serie}-` : ''}{f.folio ?? ''}{' '}
                      <span className="text-gray-400">({f.uuidFiscal.substring(0, 8)}…)</span>
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <div className="text-sm font-semibold text-gray-900">{f.nombreEmisor}</div>
                    <div className="text-xs text-gray-400 font-mono">{f.rfcEmisor}</div>
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-bold tabular-nums text-gray-900">
                    {f.moneda} ${parseFloat(f.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400">
                    {new Date(f.fechaEmision).toLocaleDateString('es-MX')}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${estadoBadge(f.estado)}`}>
                      {ESTADO_LABEL[f.estado] ?? f.estado.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-2 border-t border-gray-100 text-xs text-gray-400">
            {lista.length} de {facturas.length} facturas
          </div>
        </div>
      )}
    </div>
  );
}
