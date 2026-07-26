import { withUserContext, type UserContext } from '@/lib/db/context';
import { trabajos, frentes, proyectos } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getTrabajosFlat(ctx: UserContext) {
  return withUserContext(ctx, async (tx) =>
    tx
      .select({
        id: trabajos.id,
        clave: trabajos.clave,
        nombre: trabajos.nombre,
        proyectoId: trabajos.proyectoId,
        proyectoNombre: proyectos.nombre,
        frenteNombre: frentes.nombre,
      })
      .from(trabajos)
      .leftJoin(frentes, eq(trabajos.frenteId, frentes.id))
      .leftJoin(proyectos, eq(trabajos.proyectoId, proyectos.id))
      .orderBy(proyectos.clave, frentes.clave, trabajos.clave),
  );
}
