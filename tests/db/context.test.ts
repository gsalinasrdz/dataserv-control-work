import { describe, it, expect, afterAll } from 'vitest';
import { db, pool } from '@/lib/db';
import { withUserContext } from '@/lib/db/context';
import { sql } from 'drizzle-orm';

const CTX_A = {
  usuarioId: '00000000-0000-0000-0000-000000000001',
  organizacionId: 'aaaaaaaa-0000-0000-0000-000000000001',
};
const CTX_B = {
  usuarioId: '00000000-0000-0000-0000-000000000002',
  organizacionId: 'bbbbbbbb-0000-0000-0000-000000000002',
};

afterAll(async () => { await pool.end(); });

describe('withUserContext', () => {
  it('establece usuario_id y organizacion_id dentro de la transacción', async () => {
    const result = await withUserContext(CTX_A, async (tx) => {
      return tx.execute(sql`
        SELECT app.usuario_actual()::text AS uid,
               app.organizacion_actual()::text AS org
      `);
    });
    expect(result.rows[0]).toEqual({
      uid: CTX_A.usuarioId,
      org: CTX_A.organizacionId,
    });
  });

  it('TRAMPA PGBOUNCER: el contexto NO persiste fuera de la transacción', async () => {
    await withUserContext(CTX_A, async (tx) => {
      await tx.execute(sql`SELECT 1`);
    });

    const result = await db.execute(sql`
      SELECT app.usuario_actual()::text AS uid,
             app.organizacion_actual()::text AS org
    `);
    expect(result.rows[0]).toEqual({ uid: null, org: null });
  });

  it('dos contextos simultáneos son completamente aislados', async () => {
    const [resA, resB] = await Promise.all([
      withUserContext(CTX_A, async (tx) => tx.execute(sql`SELECT app.organizacion_actual()::text AS org`)),
      withUserContext(CTX_B, async (tx) => tx.execute(sql`SELECT app.organizacion_actual()::text AS org`)),
    ]);
    expect(resA.rows[0]).toEqual({ org: CTX_A.organizacionId });
    expect(resB.rows[0]).toEqual({ org: CTX_B.organizacionId });
  });

  it('el contexto se propaga a todas las queries dentro del callback', async () => {
    let uidMitad: string | null = null;
    await withUserContext(CTX_A, async (tx) => {
      const r1 = await tx.execute(sql`SELECT app.usuario_actual()::text AS uid`);
      uidMitad = (r1.rows[0] as { uid: string }).uid;
      await tx.execute(sql`SELECT 1`);
      const r2 = await tx.execute(sql`SELECT app.usuario_actual()::text AS uid`);
      expect(r2.rows[0]).toEqual({ uid: CTX_A.usuarioId });
    });
    expect(uidMitad).toBe(CTX_A.usuarioId);
  });
});
