import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { drizzle } from 'drizzle-orm/node-postgres';
import { ownerPool } from './owner-pool';
import { pool } from '@/lib/db';
import { withUserContext } from '@/lib/db/context';
import { proyectos, proveedores, materiales } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

const ORG_D = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
const ORG_E = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
const USER_D = 'd0000000-0000-0000-0000-000000000000';
const USER_E = 'e0000000-0000-0000-0000-000000000000';
const PROJ_D = 'd1111111-1111-1111-1111-111111111111';
const PROJ_E = 'e1111111-1111-1111-1111-111111111111';
const PROV_D = 'd2222222-2222-2222-2222-222222222222';
const PROV_E = 'e2222222-2222-2222-2222-222222222222';
const MAT_D  = 'd3333333-3333-3333-3333-333333333333';
const MAT_E  = 'e3333333-3333-3333-3333-333333333333';

const ownerDb = drizzle(ownerPool);

beforeAll(async () => {
  await ownerDb.execute(sql`
    INSERT INTO organizaciones (id, nombre, created_by) VALUES
      (${ORG_D}, 'Org Delta', ${USER_D}),
      (${ORG_E}, 'Org Echo',  ${USER_E})
    ON CONFLICT (id) DO NOTHING
  `);
  await ownerDb.execute(sql`
    INSERT INTO proyectos (id, organizacion_id, nombre, clave, created_by) VALUES
      (${PROJ_D}, ${ORG_D}, 'Proyecto D', 'PRJD', ${USER_D}),
      (${PROJ_E}, ${ORG_E}, 'Proyecto E', 'PRJE', ${USER_E})
    ON CONFLICT (id) DO NOTHING
  `);
  await ownerDb.execute(sql`
    INSERT INTO proveedores (id, organizacion_id, nombre, created_by) VALUES
      (${PROV_D}, ${ORG_D}, 'Proveedor D', ${USER_D}),
      (${PROV_E}, ${ORG_E}, 'Proveedor E', ${USER_E})
    ON CONFLICT (id) DO NOTHING
  `);
  await ownerDb.execute(sql`
    INSERT INTO materiales (id, organizacion_id, nombre, clave, unidad, created_by) VALUES
      (${MAT_D}, ${ORG_D}, 'Material D', 'MAT-D', 'm2', ${USER_D}),
      (${MAT_E}, ${ORG_E}, 'Material E', 'MAT-E', 'm2', ${USER_E})
    ON CONFLICT (id) DO NOTHING
  `);
});

afterAll(async () => {
  await ownerDb.execute(sql`DELETE FROM materiales   WHERE id IN (${MAT_D},  ${MAT_E})`);
  await ownerDb.execute(sql`DELETE FROM proveedores  WHERE id IN (${PROV_D}, ${PROV_E})`);
  await ownerDb.execute(sql`DELETE FROM proyectos    WHERE id IN (${PROJ_D}, ${PROJ_E})`);
  await ownerDb.execute(sql`DELETE FROM organizaciones WHERE id IN (${ORG_D}, ${ORG_E})`);
  await ownerPool.end();
  await pool.end();
});

describe('RLS — proyectos', () => {
  it('org D no ve proyectos de org E', async () => {
    const rows = await withUserContext(
      { usuarioId: USER_D, organizacionId: ORG_D },
      async (tx) => tx.select({ id: proyectos.id }).from(proyectos),
    );
    const ids = rows.map((r) => r.id);
    expect(ids).toContain(PROJ_D);
    expect(ids).not.toContain(PROJ_E);
  });

  it('org E no ve proyectos de org D', async () => {
    const rows = await withUserContext(
      { usuarioId: USER_E, organizacionId: ORG_E },
      async (tx) => tx.select({ id: proyectos.id }).from(proyectos),
    );
    const ids = rows.map((r) => r.id);
    expect(ids).toContain(PROJ_E);
    expect(ids).not.toContain(PROJ_D);
  });
});

describe('RLS — proveedores', () => {
  it('org D no ve proveedores de org E', async () => {
    const rows = await withUserContext(
      { usuarioId: USER_D, organizacionId: ORG_D },
      async (tx) => tx.select({ id: proveedores.id }).from(proveedores),
    );
    const ids = rows.map((r) => r.id);
    expect(ids).toContain(PROV_D);
    expect(ids).not.toContain(PROV_E);
  });
});

describe('RLS — materiales', () => {
  it('org D no ve materiales de org E', async () => {
    const rows = await withUserContext(
      { usuarioId: USER_D, organizacionId: ORG_D },
      async (tx) => tx.select({ id: materiales.id }).from(materiales),
    );
    const ids = rows.map((r) => r.id);
    expect(ids).toContain(MAT_D);
    expect(ids).not.toContain(MAT_E);
  });
});
