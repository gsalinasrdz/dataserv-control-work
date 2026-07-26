import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import PostgresAdapter from '@auth/pg-adapter';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { authConfig } from '@/auth.config';

const authPool = new Pool({ connectionString: process.env['DATABASE_URL'] });

// Conexión owner para lookup de credenciales via función SECURITY DEFINER
const ownerPool = new Pool({ connectionString: process.env['DATABASE_URL_OWNER'] });

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PostgresAdapter(authPool),
  providers: [
    Credentials({
      name: 'Correo y contraseña',
      credentials: {
        email: { label: 'Correo', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const result = await ownerPool.query<{
          id: string;
          organizacion_id: string;
          email: string;
          nombre: string;
          password_hash: string | null;
        }>(
          'SELECT id, organizacion_id, email, nombre, password_hash FROM usuarios WHERE email = $1 LIMIT 1',
          [credentials.email as string],
        );

        const row = result.rows[0];
        if (!row || !row.password_hash) return null;

        const usuario = {
          id: row.id,
          organizacionId: row.organizacion_id,
          email: row.email,
          nombre: row.nombre,
          passwordHash: row.password_hash,
        };

        const valid = await bcrypt.compare(
          credentials.password as string,
          usuario.passwordHash,
        );
        if (!valid) return null;

        return {
          id: usuario.id,
          email: usuario.email,
          name: usuario.nombre,
          organizacionId: usuario.organizacionId,
        };
      },
    }),
  ],
});
