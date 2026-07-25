import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import PostgresAdapter from '@auth/pg-adapter';
import { Pool } from 'pg';
import { db } from '@/lib/db';
import { usuarios } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const authPool = new Pool({ connectionString: process.env['DATABASE_URL'] });

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PostgresAdapter(authPool),
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'Correo y contraseña',
      credentials: {
        email: { label: 'Correo', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const rows = await db
          .select()
          .from(usuarios)
          .where(eq(usuarios.email, credentials.email as string))
          .limit(1);

        const usuario = rows[0];
        // password_hash column will be added in T2 migration
        const passwordHash = (usuario as Record<string, unknown>)['password_hash'] as string | null;
        if (!usuario || !passwordHash) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          passwordHash,
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
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.usuarioId = user.id!;
        token.organizacionId = user.organizacionId;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.usuarioId;
      session.organizacionId = token.organizacionId;
      return session;
    },
  },
  pages: { signIn: '/login' },
});
