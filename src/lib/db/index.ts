import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const connectionString = process.env['DATABASE_URL'];
if (!connectionString) throw new Error('DATABASE_URL no configurado');

export const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

export const db = drizzle(pool, { logger: process.env['NODE_ENV'] === 'development' });
