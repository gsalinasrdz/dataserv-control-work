import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req: NextRequest & { auth: unknown }) => {
  const isLoggedIn = !!(req as { auth: unknown }).auth;
  const { pathname } = req.nextUrl;

  // Permitir: auth API, archivos estáticos, server actions (POST al mismo path)
  if (pathname.startsWith('/api/auth')) return NextResponse.next();
  if (req.method === 'POST') return NextResponse.next();

  const isLoginPage = pathname === '/login';

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL('/', req.nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
