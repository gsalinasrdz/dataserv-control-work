import { describe, it, expect, afterAll } from 'vitest';
import { pool } from '@/lib/db';
import { withUserContext } from '@/lib/db/context';
import { ownerPool } from './owner-pool';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';

const ORG_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const USER_ID = 'c0000000-0000-0000-0000-000000000000';

// Rol dueño para leer auditoria y limpiar datos (app_user solo tiene INSERT en auditoria)
const ownerDb = drizzle(ownerPool);

afterAll(async () => {
  await ownerDb.execute(sql`DELETE FROM auditoria WHERE registro_id = ${ORG_ID}`);
  await ownerDb.execute(sql`DELETE FROM organizaciones WHERE id = ${ORG_ID}`);
  await ownerPool.end();
  await pool.end();
});

describe('trigger de auditoría', () => {
  it('INSERT en organizaciones genera registro en auditoria', async () => {
    // El INSERT ocurre como app_user dentro de withUserContext (activa el trigger)
    await withUserContext({ usuarioId: USER_ID, organizacionId: ORG_ID }, async (tx) => {
      await tx.execute(sql`
        INSERT INTO organizaciones (id, nombre, created_by)
        VALUES (${ORG_ID}, 'Test Auditoria', ${USER_ID})
      `);
    });

    // La lectura de auditoria la hace el rol dueño (app_user no tiene SELECT)
    const rows = await ownerDb.execute(sql`
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
