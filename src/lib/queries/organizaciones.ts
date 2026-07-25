import { db } from '@/lib/db';
import { withUserContext, type UserContext } from '@/lib/db/context';
import { organizaciones } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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
