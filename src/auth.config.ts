import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.usuarioId = user.id!;
        token.organizacionId = (user as { organizacionId?: string }).organizacionId ?? '';
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.usuarioId as string;
      (session as { organizacionId?: unknown }).organizacionId = token.organizacionId;
      return session;
    },
    authorized({ auth }) {
      return !!auth;
    },
  },
  providers: [],
};
