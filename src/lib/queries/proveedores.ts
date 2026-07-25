import { withUserContext, type UserContext } from '@/lib/db/context';
import { proveedores } from '@/lib/db/schema';

export async function getProveedores(ctx: UserContext) {
  return withUserContext(ctx, async (tx) =>
    tx.select().from(proveedores).orderBy(proveedores.nombre),
  );
}
