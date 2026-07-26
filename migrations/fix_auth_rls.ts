import { Client } from 'pg';

const url = process.env.DATABASE_URL_OWNER;
if (!url) { console.error('Falta DATABASE_URL_OWNER'); process.exit(1); }

async function main() {
  const client = new Client({ connectionString: url });
  await client.connect();
  console.log('Conectado...');

  // Policy que permite a opscore_owner leer todos los usuarios (para auth)
  await client.query(`
    DO $$ BEGIN
      CREATE POLICY owner_select_all ON usuarios TO opscore_owner USING (true);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  console.log('✅ Policy owner_select_all creada en usuarios');

  // Verificar que la función de lookup funciona
  const test = await client.query(
    `SELECT id, email, nombre FROM usuarios WHERE email = 'gsalinasrdz@gmail.com'`
  );
  if (test.rows.length > 0) {
    console.log('✅ Usuario encontrado:', test.rows[0].email, test.rows[0].nombre);
  } else {
    console.log('⚠️  Usuario no encontrado — verificar datos');
  }

  await client.end();
}

main().catch(e => { console.error('❌', e); process.exit(1); });
