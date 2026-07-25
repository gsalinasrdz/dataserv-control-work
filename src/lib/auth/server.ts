import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export interface SessionUser {
  usuarioId: string;
  organizacionId: string;
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (!session.organizacionId) throw new Error('Sesión sin organizacionId — revisar callback jwt');
  return { usuarioId: session.user.id, organizacionId: session.organizacionId };
}
