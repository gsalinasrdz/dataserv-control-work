import { Pool } from 'pg';

const ownerUrl = process.env['DATABASE_URL_OWNER'];
if (!ownerUrl) throw new Error('DATABASE_URL_OWNER requerido para tests');

// Pool con el rol dueño — bypasea RLS. Solo para setup/teardown de tests.
export const ownerPool = new Pool({ connectionString: ownerUrl, max: 2 });
