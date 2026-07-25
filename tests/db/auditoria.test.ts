import { describe, it, expect, afterAll } from 'vitest';
import { db, pool } from '@/lib/db';
import { withUserContext } from '@/lib/db/context';
import { sql } from 'drizzle-orm';

const ORG_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const USER_ID = 'c0000000-0000-0000-0000-000000000000';

afterAll(async () => {
  await db.execute(sql`DELETE FROM organizaciones WHERE id = ${ORG_ID}`);
  await db.execute(sql`DELETE FROM auditoria WHERE registro_id = ${ORG_ID}`);
  await pool.end();
});

describe('trigger de auditoría', () => {
  it('INSERT en organizaciones genera registro en auditoria', async () => {
    await withUserContext({ usuarioId: USER_ID, organizacionId: ORG_ID }, async (tx) => {
      await tx.execute(sql`
        INSERT INTO organizaciones (id, nombre, created_by)
        VALUES (${ORG_ID}, 'Test Auditoria', ${USER_ID})
      `);
    });

    const rows = await db.execute(sql`
      SELECT operacion, tabla, registro_id::text, usuario_id::text
      FROM auditoria
      WHERE registro_id = ${ORG_ID}
      ORDER BY ocurrido_en DESC
      LIMIT 1
    `);

    expect(rows.rows[0]).toMatchObject({
      operacion: 'INSERT',
      tabla: 'organizaciones',
      registro_id: ORG_ID,
      usuario_id: USER_ID,
    });
  });
});
