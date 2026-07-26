import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { pool } from '@/lib/db';
import { withUserContext } from '@/lib/db/context';
import { ownerPool } from './owner-pool';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';

const ORG_F_ID = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
const ORG_G_ID = '99999999-9999-9999-9999-999999999999';
const USER_F_ID = 'f0000000-0000-0000-0000-000000000000';
const USER_G_ID = 'f1000000-0000-0000-0000-000000000000';

const ownerDb = drizzle(ownerPool);

let proyectoFId: string;
let frenteFId: string;
let trabajoFId: string;
let facturaFId: string;
let conceptoFId: string;

beforeAll(async () => {
  await ownerDb.execute(sql`
    INSERT INTO organizaciones (id, nombre, created_by) VALUES
      (${ORG_F_ID}, 'Org F (Fase2 Test)', ${USER_F_ID}),
      (${ORG_G_ID}, 'Org G (Fase2 Test)', ${USER_G_ID})
    ON CONFLICT (id) DO NOTHING
  `);

  await ownerDb.execute(sql`
    INSERT INTO proyectos (id, organizacion_id, nombre, clave, created_by)
    VALUES (gen_random_uuid(), ${ORG_F_ID}, 'Proyecto F', 'PF', ${USER_F_ID})
    ON CONFLICT DO NOTHING
  `);
  const pRows = await ownerDb.execute(sql`
    SELECT id FROM proyectos WHERE organizacion_id = ${ORG_F_ID} LIMIT 1
  `);
  proyectoFId = (pRows.rows[0] as { id: string }).id;

  await ownerDb.execute(sql`
    INSERT INTO frentes (id, proyecto_id, organizacion_id, nombre, clave, created_by)
    VALUES (gen_random_uuid(), ${proyectoFId}, ${ORG_F_ID}, 'Frente F', 'FF', ${USER_F_ID})
    ON CONFLICT DO NOTHING
  `);
  const frRows = await ownerDb.execute(sql`
    SELECT id FROM frentes WHERE organizacion_id = ${ORG_F_ID} LIMIT 1
  `);
  frenteFId = (frRows.rows[0] as { id: string }).id;

  await ownerDb.execute(sql`
    INSERT INTO trabajos (id, frente_id, proyecto_id, organizacion_id, nombre, clave, unidad, created_by)
    VALUES (gen_random_uuid(), ${frenteFId}, ${proyectoFId}, ${ORG_F_ID}, 'Trabajo F', 'TF', 'm2', ${USER_F_ID})
    ON CONFLICT DO NOTHING
  `);
  const tRows = await ownerDb.execute(sql`
    SELECT id FROM trabajos WHERE organizacion_id = ${ORG_F_ID} LIMIT 1
  `);
  trabajoFId = (tRows.rows[0] as { id: string }).id;

  await ownerDb.execute(sql`
    INSERT INTO facturas (
      id, organizacion_id, uuid_fiscal, fecha_emision, fecha_timbrado,
      rfc_emisor, nombre_emisor, rfc_receptor, subtotal, total, xml_crudo, created_by
    ) VALUES (
      gen_random_uuid(), ${ORG_F_ID},
      'FASE2-TEST-UUID-F000-000000000001',
      now(), now(),
      'XAXX010101000', 'Proveedor F', 'XEXX010101000',
      1000.0000, 1160.0000, '<xml/>', ${USER_F_ID}
    )
    ON CONFLICT DO NOTHING
  `);
  const fRows = await ownerDb.execute(sql`
    SELECT id FROM facturas WHERE organizacion_id = ${ORG_F_ID} LIMIT 1
  `);
  facturaFId = (fRows.rows[0] as { id: string }).id;

  await ownerDb.execute(sql`
    INSERT INTO factura_conceptos (
      id, factura_id, organizacion_id, numero_linea, descripcion,
      cantidad, valor_unitario, importe, created_by
    ) VALUES (
      gen_random_uuid(), ${facturaFId}, ${ORG_F_ID}, 1, 'Material de prueba',
      10.000000, 100.000000, 1000.0000, ${USER_F_ID}
    )
    ON CONFLICT DO NOTHING
  `);
  const cRows = await ownerDb.execute(sql`
    SELECT id FROM factura_conceptos WHERE factura_id = ${facturaFId} LIMIT 1
  `);
  conceptoFId = (cRows.rows[0] as { id: string }).id;
});

afterAll(async () => {
  await ownerDb.execute(sql`DELETE FROM movimientos_costo WHERE organizacion_id IN (${ORG_F_ID}, ${ORG_G_ID})`);
  await ownerDb.execute(sql`DELETE FROM asignaciones WHERE organizacion_id IN (${ORG_F_ID}, ${ORG_G_ID})`);
  await ownerDb.execute(sql`DELETE FROM factura_conceptos WHERE organizacion_id IN (${ORG_F_ID}, ${ORG_G_ID})`);
  await ownerDb.execute(sql`DELETE FROM facturas WHERE organizacion_id IN (${ORG_F_ID}, ${ORG_G_ID})`);
  await ownerDb.execute(sql`DELETE FROM trabajos WHERE organizacion_id IN (${ORG_F_ID}, ${ORG_G_ID})`);
  await ownerDb.execute(sql`DELETE FROM frentes WHERE organizacion_id IN (${ORG_F_ID}, ${ORG_G_ID})`);
  await ownerDb.execute(sql`DELETE FROM proyectos WHERE organizacion_id IN (${ORG_F_ID}, ${ORG_G_ID})`);
  await ownerDb.execute(sql`DELETE FROM organizaciones WHERE id IN (${ORG_F_ID}, ${ORG_G_ID})`);
  await ownerPool.end();
  await pool.end();
});

describe('RLS Fase 2 — facturas', () => {
  it('Org F ve su propia factura', async () => {
    const rows = await withUserContext(
      { usuarioId: USER_F_ID, organizacionId: ORG_F_ID },
      async (tx) => tx.execute(sql`SELECT id FROM facturas WHERE id = ${facturaFId}`),
    );
    expect(rows.rows).toHaveLength(1);
  });

  it('Org G no ve la factura de Org F', async () => {
    const rows = await withUserContext(
      { usuarioId: USER_G_ID, organizacionId: ORG_G_ID },
      async (tx) => tx.execute(sql`SELECT id FROM facturas`),
    );
    const ids = rows.rows.map((r: Record<string, unknown>) => r['id']);
    expect(ids).not.toContain(facturaFId);
  });
});

describe('RLS Fase 2 — factura_conceptos', () => {
  it('Org G no ve los conceptos de Org F', async () => {
    const rows = await withUserContext(
      { usuarioId: USER_G_ID, organizacionId: ORG_G_ID },
      async (tx) =>
        tx.execute(sql`SELECT id FROM factura_conceptos WHERE id = ${conceptoFId}`),
    );
    expect(rows.rows).toHaveLength(0);
  });
});

describe('Invariante: importe de asignación no puede superar el concepto', () => {
  it('asignar exactamente el importe del concepto funciona', async () => {
    await expect(
      withUserContext(
        { usuarioId: USER_F_ID, organizacionId: ORG_F_ID },
        async (tx) =>
          tx.execute(sql`
            INSERT INTO asignaciones (
              factura_concepto_id, trabajo_id, proyecto_id, organizacion_id,
              importe, categoria, fecha_devengo, created_by
            ) VALUES (
              ${conceptoFId}, ${trabajoFId}, ${proyectoFId}, ${ORG_F_ID},
              1000.0000, 'materiales', CURRENT_DATE, ${USER_F_ID}
            )
          `),
      ),
    ).resolves.toBeDefined();
  });

  it('asignar más del importe disponible lanza error del trigger', async () => {
    await expect(
      withUserContext(
        { usuarioId: USER_F_ID, organizacionId: ORG_F_ID },
        async (tx) =>
          tx.execute(sql`
            INSERT INTO asignaciones (
              factura_concepto_id, trabajo_id, proyecto_id, organizacion_id,
              importe, categoria, fecha_devengo, created_by
            ) VALUES (
              ${conceptoFId}, ${trabajoFId}, ${proyectoFId}, ${ORG_F_ID},
              0.0001, 'materiales', CURRENT_DATE, ${USER_F_ID}
            )
          `),
      ),
    ).rejects.toThrow(/Asignación excede/);
  });
});

describe('movimientos_costo — ejercido por trabajo', () => {
  it('el movimiento insertado vía owner aparece en el ejercido del trabajo', async () => {
    await ownerDb.execute(sql`DELETE FROM asignaciones WHERE factura_concepto_id = ${conceptoFId}`);

    await ownerDb.execute(sql`
      INSERT INTO movimientos_costo (
        trabajo_id, proyecto_id, organizacion_id, categoria,
        importe, signo, fecha_devengo, origen_tipo, origen_id, created_by
      ) VALUES (
        ${trabajoFId}, ${proyectoFId}, ${ORG_F_ID}, 'materiales',
        500.0000, 1, CURRENT_DATE, 'alta_manual', gen_random_uuid(), ${USER_F_ID}
      )
    `);

    const rows = await withUserContext(
      { usuarioId: USER_F_ID, organizacionId: ORG_F_ID },
      async (tx) =>
        tx.execute(sql`
          SELECT COALESCE(SUM(importe * signo), 0)::text AS ejercido
          FROM movimientos_costo
          WHERE trabajo_id = ${trabajoFId}
        `),
    );
    const ejercido = parseFloat((rows.rows[0] as Record<string, string>)['ejercido']!);
    expect(ejercido).toBe(500);
  });
});
