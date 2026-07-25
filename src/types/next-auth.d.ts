import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    organizacionId: string;
    user: DefaultSession['user'] & {
      id: string;
    };
  }
  interface User {
    organizacionId: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    usuarioId: string;
    organizacionId: string;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    usuarioId: string;
    organizacionId: string;
  }
}
