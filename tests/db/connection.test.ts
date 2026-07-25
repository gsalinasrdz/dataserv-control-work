import { describe, it, expect, afterAll } from 'vitest';
import { db, pool } from '@/lib/db';
import { sql } from 'drizzle-orm';

describe('conexión a base de datos', () => {
  afterAll(async () => { await pool.end(); });

  it('responde a SELECT 1', async () => {
    const result = await db.execute(sql`SELECT 1 AS ok`);
    expect(result.rows[0]).toEqual({ ok: 1 });
  });
});
