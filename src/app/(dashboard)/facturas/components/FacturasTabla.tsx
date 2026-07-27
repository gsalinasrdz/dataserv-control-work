'use client';

import { useState } from 'react';
import Link from 'next/link';

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

const ESTADO_BADGE: Record<string, string> = {
  recibida: 'bg-yellow-100 text-yellow-800',
  parcialmente_asignada: 'bg-blue-100 text-blue-800',
  asignada: 'bg-green-100 text-green-800',
  cerrada: 'bg-gray-100 text-gray-700',
};

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
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          placeholder="Buscar por RFC, emisor o UUID…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-1 flex-wrap">
          {ESTADOS.map((e) => (
            <button
              key={e}
              onClick={() => setEstadoFiltro(e)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                estadoFiltro === e
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {ESTADO_LABEL[e]}
            </button>
          ))}
        </div>
      </div>

      {lista.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-400 text-sm">
          {busqueda || estadoFiltro !== 'todos'
            ? 'Sin facturas para el filtro actual.'
            : 'Sin facturas. Carga un XML CFDI para comenzar.'}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr className="text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">UUID Fiscal</th>
                <th className="px-4 py-3 text-left">Emisor</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lista.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50 text-sm">
                  <td className="px-4 py-3">
                    <Link
                      href={`/facturas/${f.id}`}
                      className="font-mono text-xs text-blue-600 hover:underline"
                    >
                      {f.serie ? `${f.serie}-` : ''}{f.folio ?? ''}{' '}
                      <span className="text-gray-400">({f.uuidFiscal.substring(0, 8)}…)</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <div className="font-medium">{f.nombreEmisor}</div>
                    <div className="text-xs text-gray-400 font-mono">{f.rfcEmisor}</div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    {f.moneda} ${parseFloat(f.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(f.fechaEmision).toLocaleDateString('es-MX')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        ESTADO_BADGE[f.estado] ?? 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {f.estado.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
            {lista.length} de {facturas.length} facturas
          </div>
        </div>
      )}
    </div>
  );
}
