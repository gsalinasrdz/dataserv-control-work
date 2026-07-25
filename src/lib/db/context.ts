import { db } from './index';
import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

type Transaction = Parameters<Parameters<NodePgDatabase['transaction']>[0]>[0];

export interface UserContext {
  usuarioId: string;
  organizacionId: string;
}

/**
 * Envuelve cualquier operación de BD en una transacción con contexto de usuario.
 *
 * CRÍTICO: set_config(..., true) hace el valor LOCAL a la transacción.
 * Sin el tercer parámetro `true`, el valor persiste en la conexión del pool
 * y con PgBouncer en modo transacción filtraría datos entre usuarios.
 */
export async function withUserContext<T>(
  ctx: UserContext,
  fn: (tx: Transaction) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.usuario_id', ${ctx.usuarioId}, true)`);
    await tx.execute(sql`SELECT set_config('app.organizacion_id', ${ctx.organizacionId}, true)`);
    return fn(tx);
  });
}
