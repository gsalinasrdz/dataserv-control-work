import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { db, pool } from '@/lib/db';
import { withUserContext } from '@/lib/db/context';
import { sql } from 'drizzle-orm';

const ORG_A_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const ORG_B_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const USER_A_ID = 'a0000000-0000-0000-0000-000000000000';
const USER_B_ID = 'b0000000-0000-0000-0000-000000000000';

beforeAll(async () => {
  await db.execute(sql`
    INSERT INTO organizaciones (id, nombre, created_by)
    VALUES
      (${ORG_A_ID}, 'Org Alpha', ${USER_A_ID}),
      (${ORG_B_ID}, 'Org Beta', ${USER_B_ID})
    ON CONFLICT (id) DO NOTHING
  `);
});

afterAll(async () => {
  await db.execute(sql`DELETE FROM organizaciones WHERE id IN (${ORG_A_ID}, ${ORG_B_ID})`);
  await pool.end();
});

describe('RLS — organizaciones', () => {
  it('usuario A solo ve su organización', async () => {
    const rows = await withUserContext(
      { usuarioId: USER_A_ID, organizacionId: ORG_A_ID },
      async (tx) => tx.execute(sql`SELECT id FROM organizaciones`),
    );
    const ids = rows.rows.map((r: Record<string, unknown>) => r['id']);
    expect(ids).toContain(ORG_A_ID);
    expect(ids).not.toContain(ORG_B_ID);
  });

  it('usuario B solo ve su organización', async () => {
    const rows = await withUserContext(
      { usuarioId: USER_B_ID, organizacionId: ORG_B_ID },
      async (tx) => tx.execute(sql`SELECT id FROM organizaciones`),
    );
    const ids = rows.rows.map((r: Record<string, unknown>) => r['id']);
    expect(ids).toContain(ORG_B_ID);
    expect(ids).not.toContain(ORG_A_ID);
  });

  it('consulta SIN contexto devuelve cero filas', async () => {
    const rows = await db.execute(sql`SELECT id FROM organizaciones`);
    expect(rows.rows).toHaveLength(0);
  });
});
