'use server';

import { requireAuth } from '@/lib/auth/server';
import { withUserContext } from '@/lib/db/context';
import { frentes } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';

export async function createFrente(proyectoId: string, formData: FormData) {
  const ctx = await requireAuth();

  const nombre = (formData.get('nombre') as string)?.trim();
  const clave = (formData.get('clave') as string)?.trim().toUpperCase();
  const orden = parseInt((formData.get('orden') as string) ?? '0', 10) || 0;

  if (!nombre) throw new Error('nombre requerido');
  if (!clave) throw new Error('clave requerida');

  await withUserContext(ctx, async (tx) => {
    await tx.insert(frentes).values({
      proyectoId,
      organizacionId: ctx.organizacionId,
      nombre,
      clave,
      orden,
      createdBy: ctx.usuarioId,
    });
  });

  revalidatePath(`/proyectos/${proyectoId}`);
}
