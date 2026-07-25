import { withUserContext, type UserContext } from '@/lib/db/context';
import { proyectos, empresas } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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
