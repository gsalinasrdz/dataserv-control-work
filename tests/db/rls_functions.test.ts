import { describe, it, expect, afterAll } from 'vitest';
import { db, pool } from '@/lib/db';
import { sql } from 'drizzle-orm';

describe('funciones de contexto RLS', () => {
  afterAll(async () => { await pool.end(); });

  it('app.usuario_actual() devuelve null sin contexto establecido', async () => {
    const result = await db.execute(sql`SELECT app.usuario_actual()::text AS uid`);
    expect(result.rows[0]).toEqual({ uid: null });
  });

  it('app.organizacion_actual() devuelve null sin contexto establecido', async () => {
    const result = await db.execute(sql`SELECT app.organizacion_actual()::text AS org`);
    expect(result.rows[0]).toEqual({ org: null });
  });
});
