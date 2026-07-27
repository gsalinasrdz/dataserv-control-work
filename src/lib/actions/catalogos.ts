'use server';

import { requireAuth } from '@/lib/auth/server';
import { withUserContext } from '@/lib/db/context';
import { proveedores, materiales } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function createProveedor(formData: FormData) {
  const ctx = await requireAuth();

  const nombre = (formData.get('nombre') as string)?.trim();
  const rfc = (formData.get('rfc') as string)?.trim().toUpperCase() || null;
  const contacto = (formData.get('contacto') as string)?.trim() || null;
  const telefono = (formData.get('telefono') as string)?.trim() || null;
  const email = (formData.get('email') as string)?.trim().toLowerCase() || null;

  if (!nombre) throw new Error('nombre requerido');

  await withUserContext(ctx, async (tx) => {
    await tx.insert(proveedores).values({
      organizacionId: ctx.organizacionId,
      nombre,
      rfc,
      contacto,
      telefono,
      email,
      createdBy: ctx.usuarioId,
    });
  });

  revalidatePath('/catalogos/proveedores');
}

export async function createMaterial(formData: FormData) {
  const ctx = await requireAuth();

  const nombre = (formData.get('nombre') as string)?.trim();
  const clave = (formData.get('clave') as string)?.trim().toUpperCase();
  const unidad = (formData.get('unidad') as string)?.trim();
  const descripcion = (formData.get('descripcion') as string)?.trim() || null;

  if (!nombre) throw new Error('nombre requerido');
  if (!clave) throw new Error('clave requerida');
  if (!unidad) throw new Error('unidad requerida');

  await withUserContext(ctx, async (tx) => {
    await tx.insert(materiales).values({
      organizacionId: ctx.organizacionId,
      nombre,
      clave,
      unidad,
      descripcion,
      createdBy: ctx.usuarioId,
    });
  });

  revalidatePath('/catalogos/materiales');
}

export async function updateProveedor(proveedorId: string, formData: FormData) {
  const ctx = await requireAuth();
  const nombre = (formData.get('nombre') as string)?.trim();
  const rfc = (formData.get('rfc') as string)?.trim().toUpperCase() || null;
  const contacto = (formData.get('contacto') as string)?.trim() || null;
  const telefono = (formData.get('telefono') as string)?.trim() || null;
  const email = (formData.get('email') as string)?.trim().toLowerCase() || null;
  if (!nombre) throw new Error('nombre requerido');
  await withUserContext(ctx, async (tx) => {
    await tx
      .update(proveedores)
      .set({ nombre, rfc, contacto, telefono, email, updatedAt: new Date() })
      .where(eq(proveedores.id, proveedorId));
  });
  revalidatePath('/catalogos/proveedores');
  revalidatePath(`/catalogos/proveedores/${proveedorId}`);
}

export async function deleteProveedor(proveedorId: string) {
  const ctx = await requireAuth();
  await withUserContext(ctx, async (tx) => {
    await tx.delete(proveedores).where(eq(proveedores.id, proveedorId));
  });
  revalidatePath('/catalogos/proveedores');
}
