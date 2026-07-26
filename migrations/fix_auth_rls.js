const { Client } = require('pg');

const url = process.env.DATABASE_URL_OWNER;
if (!url) { console.error('Falta DATABASE_URL_OWNER'); process.exit(1); }

const client = new Client({ connectionString: url });

client.connect()
  .then(() => {
    console.log('Conectado');
    return client.query(
      "DO $$ BEGIN " +
      "CREATE POLICY owner_select_all ON usuarios TO opscore_owner USING (true); " +
      "EXCEPTION WHEN duplicate_object THEN NULL; " +
      "END $$;"
    );
  })
  .then(() => {
    console.log('Policy creada');
    return client.query("SELECT id, email, nombre FROM usuarios WHERE email = 'gsalinasrdz@gmail.com'");
  })
  .then(r => {
    if (r.rows[0]) console.log('✅ Usuario encontrado:', r.rows[0].email, '-', r.rows[0].nombre);
    else console.log('⚠️  Usuario no encontrado');
    return client.end();
  })
  .catch(e => {
    console.error('ERROR:', e.message, '| Code:', e.code);
    client.end();
    process.exit(1);
  });
