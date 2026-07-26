import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));

const url = process.env.DATABASE_URL_OWNER;
if (!url) {
  console.error('Falta DATABASE_URL_OWNER');
  process.exit(1);
}

const sql = readFileSync(join(__dirname, 'setup_completo.sql'), 'utf-8');

async function main() {
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    console.log('Conectado a la base de datos...');
    const result = await client.query(sql);
    const rows = Array.isArray(result) ? result[result.length - 1]?.rows : result.rows;
    if (rows) {
      console.log('\nEstado de tablas:');
      rows.forEach((r: { tabla: string; count: string }) => console.log(`  ${r.tabla}: ${r.count} registros`));
    }
    console.log('\n✅ Setup completado exitosamente');
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
