const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL_OWNER });

const ORG_ID  = 'a0000000-0000-0000-0000-000000000001';
const USER_ID = 'b0000000-0000-0000-0000-000000000001';
const HASH    = '$2b$12$mOldnpx4yNAGRVfu.LgePu050Xfdd9PMo/AKlcIDH47P5/e2ObIRu';

client.connect().then(async () => {
  console.log('Conectado...');

  // Agregar policies de INSERT para opscore_owner (sin requerir contexto de app)
  await client.query(`
    DO $$ BEGIN
      CREATE POLICY owner_insert ON organizaciones TO opscore_owner WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);
  await client.query(`
    DO $$ BEGIN
      CREATE POLICY owner_insert ON usuarios TO opscore_owner WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);
  await client.query(`
    DO $$ BEGIN
      CREATE POLICY owner_insert ON usuario_roles TO opscore_owner WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);
  await client.query(`
    DO $$ BEGIN
      CREATE POLICY owner_select_all ON organizaciones TO opscore_owner USING (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);
  await client.query(`
    DO $$ BEGIN
      CREATE POLICY owner_select_all ON usuario_roles TO opscore_owner USING (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);
  console.log('Policies creadas');

  // Insertar organización
  await client.query(`
    INSERT INTO organizaciones (id, nombre, rfc, created_by)
    VALUES ($1, 'OpsCore Demo', 'ORG000000000', $2)
    ON CONFLICT (id) DO NOTHING
  `, [ORG_ID, USER_ID]);
  console.log('Organización insertada');

  // Insertar usuario
  await client.query(`
    INSERT INTO usuarios (id, organizacion_id, email, nombre, password_hash, created_by)
    VALUES ($1, $2, 'gsalinasrdz@gmail.com', 'Guillermo Salinas', $3, $1)
    ON CONFLICT ON CONSTRAINT usuarios_email_org DO UPDATE SET
      nombre = EXCLUDED.nombre,
      password_hash = EXCLUDED.password_hash,
      updated_at = now()
  `, [USER_ID, ORG_ID, HASH]);
  console.log('Usuario insertado');

  // Insertar rol
  await client.query(`
    INSERT INTO usuario_roles (usuario_id, organizacion_id, rol, created_by)
    VALUES ($1, $2, 'administrador', $1)
    ON CONFLICT DO NOTHING
  `, [USER_ID, ORG_ID]);
  console.log('Rol insertado');

  // Verificar
  const r = await client.query(`SELECT email, nombre FROM usuarios WHERE email = 'gsalinasrdz@gmail.com'`);
  if (r.rows[0]) console.log('✅ Usuario listo:', r.rows[0].email, '-', r.rows[0].nombre);
  else console.log('❌ Usuario no encontrado');

  await client.end();
}).catch(e => { console.error('ERROR:', e.message); client.end(); process.exit(1); });
