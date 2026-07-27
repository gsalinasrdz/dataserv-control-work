import { withUserContext, type UserContext } from '@/lib/db/context';
import { proveedores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getProveedores(ctx: UserContext) {
  return withUserContext(ctx, async (tx) =>
    tx.select().from(proveedores).orderBy(proveedores.nombre),
  );
}

export async function getProveedor(ctx: UserContext, proveedorId: string) {
  return withUserContext(ctx, async (tx) => {
    const rows = await tx
      .select()
      .from(proveedores)
      .where(eq(proveedores.id, proveedorId))
      .limit(1);
    return rows[0] ?? null;
  });
}
