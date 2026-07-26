const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL_OWNER });

client.connect()
  .then(() => client.query('SELECT id, email, nombre FROM usuarios LIMIT 10'))
  .then(r => {
    console.log('Usuarios en DB:', r.rows.length);
    r.rows.forEach(u => console.log(' -', u.email, u.nombre));
    return client.query('SELECT id, nombre FROM organizaciones LIMIT 10');
  })
  .then(r => {
    console.log('Organizaciones:', r.rows.length);
    r.rows.forEach(o => console.log(' -', o.id, o.nombre));
    return client.end();
  })
  .catch(e => { console.error('ERROR:', e.message); client.end(); process.exit(1); });
