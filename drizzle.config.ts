import type { Config } from 'drizzle-kit';

const ownerUrl = process.env['DATABASE_URL_OWNER'];
if (!ownerUrl) throw new Error('DATABASE_URL_OWNER requerido para migraciones');

export default {
  schema: './src/lib/db/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: { url: ownerUrl },
} satisfies Config;
