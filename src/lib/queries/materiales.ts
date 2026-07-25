import { withUserContext, type UserContext } from '@/lib/db/context';
import { materiales } from '@/lib/db/schema';

export async function getMateriales(ctx: UserContext) {
  return withUserContext(ctx, async (tx) =>
    tx.select().from(materiales).orderBy(materiales.clave),
  );
}
