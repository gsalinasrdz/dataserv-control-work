import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import PostgresAdapter from '@auth/pg-adapter';
import { Pool } from 'pg';
import { db } from '@/lib/db';
import { usuarios } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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

        // Fase 0: login simplificado (sin verificación de contraseña)
        // Fase 1: agregar password_hash + bcrypt.compare
        const rows = await db
          .select()
          .from(usuarios)
          .where(eq(usuarios.email, credentials.email as string))
          .limit(1);

        const usuario = rows[0];
        if (!usuario) return null;

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
        token['usuarioId'] = user.id;
        token['organizacionId'] = (user as { organizacionId?: string }).organizacionId;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token['usuarioId'] as string;
      (session as unknown as Record<string, unknown>)['organizacionId'] = token['organizacionId'];
      return session;
    },
  },
  pages: { signIn: '/login' },
});
