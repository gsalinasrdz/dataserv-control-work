import { withUserContext, type UserContext } from '@/lib/db/context';
import { materiales } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getMateriales(ctx: UserContext) {
  return withUserContext(ctx, async (tx) =>
    tx.select().from(materiales).orderBy(materiales.clave),
  );
}

export async function getMaterial(ctx: UserContext, materialId: string) {
  return withUserContext(ctx, async (tx) => {
    const rows = await tx.select().from(materiales).where(eq(materiales.id, materialId)).limit(1);
    return rows[0] ?? null;
  });
}
