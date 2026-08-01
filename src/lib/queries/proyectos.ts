import { withUserContext, type UserContext } from '@/lib/db/context';
import { proyectos, empresas } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function getProyectos(ctx: UserContext) {
  return withUserContext(ctx, async (tx) =>
    tx
      .select({
        id: proyectos.id,
        nombre: proyectos.nombre,
        clave: proyectos.clave,
        estado: proyectos.estado,
        fechaInicio: proyectos.fechaInicio,
        fechaFinEstimada: proyectos.fechaFinEstimada,
        empresa: empresas.nombre,
      })
      .from(proyectos)
      .leftJoin(empresas, eq(proyectos.empresaId, empresas.id))
      .orderBy(proyectos.clave),
  );
}

export async function getProyecto(ctx: UserContext, proyectoId: string) {
  const rows = await withUserContext(ctx, async (tx) =>
    tx
      .select()
      .from(proyectos)
      .where(eq(proyectos.id, proyectoId))
      .limit(1),
  );
  return rows[0] ?? null;
}

export async function getResumenProyecto(ctx: UserContext, proyectoId: string) {
  type Row = {
    id: string;
    nombre: string;
    clave: string;
    estado: string;
    fecha_inicio: string | null;
    fecha_fin_estimada: string | null;
    presupuesto_total: string;
    ejercido_total: string;
  };

  const { rows } = await withUserContext(ctx, async (tx) =>
    tx.execute(sql`
      SELECT
        p.id,
        p.nombre,
        p.clave,
        p.estado,
        p.fecha_inicio,
        p.fecha_fin_estimada,
        COALESCE(SUM(t.presupuesto_cantidad * t.presupuesto_unitario), 0)::text AS presupuesto_total,
        COALESCE(SUM(mc.importe * mc.signo), 0)::text AS ejercido_total
      FROM proyectos p
      LEFT JOIN frentes f ON f.proyecto_id = p.id
      LEFT JOIN trabajos t ON t.frente_id = f.id
      LEFT JOIN movimientos_costo mc ON mc.trabajo_id = t.id
      WHERE p.id = ${proyectoId}
      GROUP BY p.id, p.nombre, p.clave, p.estado, p.fecha_inicio, p.fecha_fin_estimada
    `)
  ) as unknown as { rows: Row[] };

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    nombre: row.nombre,
    clave: row.clave,
    estado: row.estado,
    fechaInicio: row.fecha_inicio,
    fechaFinEstimada: row.fecha_fin_estimada,
    presupuestoTotal: Number(row.presupuesto_total),
    ejercidoTotal: Number(row.ejercido_total),
  };
}
