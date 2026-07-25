import { withUserContext, type UserContext } from '@/lib/db/context';
import { frentes, trabajos } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getFrentesConTrabajos(
  ctx: UserContext,
  proyectoId: string,
) {
  const [frentesList, trabajosList] = await Promise.all([
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
  ]);

  return frentesList.map((f) => ({
    ...f,
    trabajos: trabajosList.filter((t) => t.frenteId === f.id),
  }));
}
