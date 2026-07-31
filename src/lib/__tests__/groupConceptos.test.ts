import { describe, it, expect, vi } from 'vitest';

// Mock the DB layer so the pure helper can be tested without DATABASE_URL
vi.mock('@/lib/db/index', () => ({ pool: {}, db: {} }));

import { groupConceptos, type ConceptoReporte } from '../queries/reporte';

const base: ConceptoReporte = {
  asignacionId: '1',
  descripcion: 'Concepto A',
  claveProdServ: '10191509',
  importe: '1000',
  categoria: 'materiales',
  frenteNombre: 'Estructura',
  frenteClave: 'EST',
  frenteOrden: 1,
};

const conceptos: ConceptoReporte[] = [
  { ...base, asignacionId: '1', descripcion: 'A', importe: '1000', frenteNombre: 'Estructura', categoria: 'materiales' },
  { ...base, asignacionId: '2', descripcion: 'B', importe: '500', frenteNombre: 'Estructura', categoria: 'mano_obra' },
  { ...base, asignacionId: '3', descripcion: 'C', importe: '2000', frenteNombre: 'Acabados', categoria: 'materiales' },
];

describe('groupConceptos', () => {
  it('agrupa por frente', () => {
    const grupos = groupConceptos(conceptos, 'frente');
    expect(grupos).toHaveLength(2);
    expect(grupos[0]?.label).toBe('Estructura');
    expect(grupos[0]?.conceptos).toHaveLength(2);
    expect(grupos[0]?.subtotal).toBe(1500);
    expect(grupos[1]?.label).toBe('Acabados');
    expect(grupos[1]?.subtotal).toBe(2000);
  });

  it('agrupa por categoria', () => {
    const grupos = groupConceptos(conceptos, 'categoria');
    expect(grupos).toHaveLength(2);
    const materiales = grupos.find((g) => g.label === 'materiales');
    expect(materiales?.subtotal).toBe(3000);
    const manoObra = grupos.find((g) => g.label === 'mano_obra');
    expect(manoObra?.subtotal).toBe(500);
  });

  it('devuelve un solo grupo cuando agrupacion es plano', () => {
    const grupos = groupConceptos(conceptos, 'plano');
    expect(grupos).toHaveLength(1);
    expect(grupos[0]?.subtotal).toBe(3500);
  });

  it('devuelve array vacío para lista vacía', () => {
    expect(groupConceptos([], 'frente')).toEqual([]);
  });
});
