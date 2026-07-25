'use server';

import { requireAuth } from '@/lib/auth/server';
import { withUserContext } from '@/lib/db/context';
import { trabajos } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function createTrabajo(
  proyectoId: string,
  frenteId: string,
  formData: FormData,
) {
  const ctx = await requireAuth();

  const nombre = (formData.get('nombre') as string)?.trim();
  const clave = (formData.get('clave') as string)?.trim().toUpperCase();
  const unidad = (formData.get('unidad') as string)?.trim();
  const cantidad = (formData.get('cantidad') as string) ?? '0';
  const unitario = (formData.get('precio_unitario') as string) ?? '0';

  if (!nombre) throw new Error('nombre requerido');
  if (!clave) throw new Error('clave requerida');
  if (!unidad) throw new Error('unidad requerida');

  await withUserContext(ctx, async (tx) => {
    await tx.insert(trabajos).values({
      frenteId,
      proyectoId,
      organizacionId: ctx.organizacionId,
      nombre,
      clave,
      unidad,
      presupuestoCantidad: cantidad,
      presupuestoUnitario: unitario,
      createdBy: ctx.usuarioId,
    });
  });

  revalidatePath(`/proyectos/${proyectoId}`);
}

export async function updateTrabajo(
  trabajoId: string,
  proyectoId: string,
  data: {
    nombre?: string;
    unidad?: string;
    presupuestoCantidad?: string;
    presupuestoUnitario?: string;
  },
) {
  const ctx = await requireAuth();

  await withUserContext(ctx, async (tx) => {
    await tx
      .update(trabajos)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(trabajos.id, trabajoId));
  });

  revalidatePath(`/proyectos/${proyectoId}`);
}
