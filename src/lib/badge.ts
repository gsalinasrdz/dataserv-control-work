/** Clases Tailwind para badges de estado de proyecto o factura */
export function estadoBadge(estado: string): string {
  const map: Record<string, string> = {
    activo:                  'bg-green-100 text-green-800',
    pausado:                 'bg-amber-100 text-amber-800',
    cerrado:                 'bg-gray-100 text-gray-600',
    recibida:                'bg-amber-100 text-amber-800',
    parcialmente_asignada:   'bg-blue-100 text-blue-800',
    asignada:                'bg-green-100 text-green-800',
  };
  return map[estado] ?? 'bg-gray-100 text-gray-600';
}

/** Colores para la barra de riesgo presupuestal */
export function riesgoColor(pct: number): { bar: string; text: string } {
  if (pct > 85) return { bar: 'bg-red-500',   text: 'text-red-600' };
  if (pct > 70) return { bar: 'bg-amber-400', text: 'text-amber-600' };
  return              { bar: 'bg-green-500', text: 'text-green-600' };
}
