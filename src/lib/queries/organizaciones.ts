import { db } from '@/lib/db';
import { withUserContext, type UserContext } from '@/lib/db/context';
import { organizaciones } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function getOrganizacion(ctx: UserContext) {
  const rows = await withUserContext(ctx, async (tx) => {
    return tx
      .select({
        id: organizaciones.id,
        nombre: organizaciones.nombre,
        rfc: organizaciones.rfc,
      })
      .from(organizaciones)
      .where(eq(organizaciones.id, ctx.organizacionId))
      .limit(1);
  });
  return rows[0] ?? null;
}

export async function getResumenDashboard(ctx: UserContext) {
  type PresupRow = {
    proyectos_activos: number;
    presupuesto_total: string;
    ejercido_total: string;
  };

  const presupRows = await withUserContext(ctx, async (tx) =>
    tx.execute(sql`
      SELECT
        COUNT(DISTINCT p.id) FILTER (WHERE p.estado = 'activo')::int AS proyectos_activos,
        COALESCE(SUM(t.presupuesto_cantidad * t.presupuesto_unitario), 0)::text AS presupuesto_total,
        COALESCE(SUM(mc.importe * mc.signo), 0)::text AS ejercido_total
      FROM proyectos p
      LEFT JOIN frentes f ON f.proyecto_id = p.id AND f.organizacion_id = p.organizacion_id
      LEFT JOIN trabajos t ON t.frente_id = f.id
      LEFT JOIN movimientos_costo mc ON mc.trabajo_id = t.id
    `),
  ) as unknown as PresupRow[];

  const presupRow = presupRows[0];

  type EstadoRow = { estado: string; total: string };
  const facturasRows = await withUserContext(ctx, async (tx) =>
    tx.execute(sql`
      SELECT estado, COUNT(*)::text AS total FROM facturas GROUP BY estado
    `),
  ) as unknown as EstadoRow[];

  return {
    proyectosActivos: Number(presupRow?.proyectos_activos ?? 0),
    presupuestoTotal: Number(presupRow?.presupuesto_total ?? 0),
    ejercidoTotal: Number(presupRow?.ejercido_total ?? 0),
    facturasPorEstado: Object.fromEntries(
      facturasRows.map((r) => [r.estado, Number(r.total)]),
    ) as Record<string, number>,
  };
}
