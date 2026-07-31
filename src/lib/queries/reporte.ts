import { withUserContext, type UserContext } from '@/lib/db/context';
import { sql } from 'drizzle-orm';

export type ConceptoReporte = {
  asignacionId: string;
  descripcion: string;
  claveProdServ: string | null;
  importe: string;
  categoria: string;
  frenteNombre: string;
  frenteClave: string;
  frenteOrden: number;
};

export type GrupoReporte = {
  label: string;
  conceptos: ConceptoReporte[];
  subtotal: number;
};

export async function getConceptosReporte(
  ctx: UserContext,
  proyectoId: string,
): Promise<ConceptoReporte[]> {
  return withUserContext(ctx, async (tx) =>
    tx.execute(sql`
      SELECT
        a.id                    AS "asignacionId",
        fc.descripcion,
        fc.clave_prod_serv      AS "claveProdServ",
        a.importe,
        a.categoria,
        fr.nombre               AS "frenteNombre",
        fr.clave                AS "frenteClave",
        fr.orden                AS "frenteOrden"
      FROM asignaciones a
      JOIN factura_conceptos fc ON fc.id = a.factura_concepto_id
      JOIN trabajos t ON t.id = a.trabajo_id
      JOIN frentes fr ON fr.id = t.frente_id
      WHERE a.proyecto_id = ${proyectoId}
        AND a.estado = 'autorizada'
      ORDER BY fr.orden, fr.clave, fc.descripcion
    `)
  ) as unknown as ConceptoReporte[];
}

export function groupConceptos(
  conceptos: ConceptoReporte[],
  agrupacion: 'frente' | 'categoria' | 'plano',
): GrupoReporte[] {
  if (agrupacion === 'plano') {
    return [
      {
        label: 'Todos los conceptos',
        conceptos,
        subtotal: conceptos.reduce((s, c) => s + (Number(c.importe) || 0), 0),
      },
    ];
  }

  const grupos = new Map<string, ConceptoReporte[]>();

  for (const c of conceptos) {
    const key = agrupacion === 'frente' ? c.frenteNombre : c.categoria;
    const existing = grupos.get(key);
    if (existing) {
      existing.push(c);
    } else {
      grupos.set(key, [c]);
    }
  }

  return Array.from(grupos.entries()).map(([label, items]) => ({
    label,
    conceptos: items,
    subtotal: items.reduce((s, c) => s + (Number(c.importe) || 0), 0),
  }));
}
