import { withUserContext, type UserContext } from '@/lib/db/context';
import { frentes, trabajos, movimientosCosto } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function getFrentesConTrabajos(
  ctx: UserContext,
  proyectoId: string,
) {
  const [frentesList, trabajosList, ejercidosList] = await Promise.all([
    withUserContext(ctx, async (tx) =>
      tx
        .select()
        .from(frentes)
        .where(eq(frentes.proyectoId, proyectoId))
        .orderBy(frentes.orden, frentes.clave),
    ),
    withUserContext(ctx, async (tx) =>
      tx
        .select()
        .from(trabajos)
        .where(eq(trabajos.proyectoId, proyectoId))
        .orderBy(trabajos.clave),
    ),
    withUserContext(ctx, async (tx) =>
      tx
        .select({
          trabajoId: movimientosCosto.trabajoId,
          ejercido: sql<string>`COALESCE(SUM(${movimientosCosto.importe} * ${movimientosCosto.signo}), 0)::text`,
        })
        .from(movimientosCosto)
        .where(eq(movimientosCosto.proyectoId, proyectoId))
        .groupBy(movimientosCosto.trabajoId),
    ),
  ]);

  const ejercidoMap = new Map(ejercidosList.map((e) => [e.trabajoId, e.ejercido]));

  return frentesList.map((f) => ({
    ...f,
    trabajos: trabajosList
      .filter((t) => t.frenteId === f.id)
      .map((t) => ({ ...t, ejercido: ejercidoMap.get(t.id) ?? '0' })),
  }));
}
