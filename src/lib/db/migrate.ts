import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

async function runMigrations() {
  const url = process.env['DATABASE_URL_OWNER'];
  if (!url) throw new Error('DATABASE_URL_OWNER requerido');

  const pool = new Pool({ connectionString: url, max: 1 });
  const db = drizzle(pool);

  console.log('Aplicando migraciones...');
  await migrate(db, { migrationsFolder: './migrations' });
  console.log('Migraciones aplicadas.');

  await pool.end();
}

runMigrations().catch((err) => {
  console.error(err);
  process.exit(1);
});
