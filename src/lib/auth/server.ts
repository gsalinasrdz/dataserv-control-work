import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export interface SessionUser {
  usuarioId: string;
  organizacionId: string;
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const organizacionId = (session as unknown as Record<string, unknown>)['organizacionId'] as string | undefined;
  if (!organizacionId) {
    throw new Error('Sesión sin organizacionId — revisar callback jwt');
  }

  return { usuarioId: session.user.id, organizacionId };
}
