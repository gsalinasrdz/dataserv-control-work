'use server';

import { requireAuth } from '@/lib/auth/server';
import { withUserContext } from '@/lib/db/context';
import { proyectos } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function createProyecto(formData: FormData) {
  const ctx = await requireAuth();

  const nombre = (formData.get('nombre') as string)?.trim();
  const clave = (formData.get('clave') as string)?.trim().toUpperCase();
  const descripcion = (formData.get('descripcion') as string)?.trim() || null;
  const empresaId = (formData.get('empresa_id') as string) || null;
  const fechaInicio = (formData.get('fecha_inicio') as string) || undefined;
  const fechaFinEstimada = (formData.get('fecha_fin_estimada') as string) || undefined;

  if (!nombre) throw new Error('nombre requerido');
  if (!clave) throw new Error('clave requerida');

  await withUserContext(ctx, async (tx) => {
    await tx.insert(proyectos).values({
      organizacionId: ctx.organizacionId,
      empresaId: empresaId || undefined,
      nombre,
      clave,
      descripcion,
      fechaInicio,
      fechaFinEstimada,
      createdBy: ctx.usuarioId,
    });
  });

  revalidatePath('/proyectos');
}

export async function updateProyectoEstado(
  proyectoId: string,
  estado: 'activo' | 'pausado' | 'cerrado',
) {
  const ctx = await requireAuth();

  await withUserContext(ctx, async (tx) => {
    await tx
      .update(proyectos)
      .set({ estado, updatedAt: new Date() })
      .where(eq(proyectos.id, proyectoId));
  });

  revalidatePath(`/proyectos/${proyectoId}`);
  revalidatePath('/proyectos');
}
