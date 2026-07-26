'use server';

import { requireAuth } from '@/lib/auth/server';
import { withUserContext } from '@/lib/db/context';
import { asignaciones, movimientosCosto, facturaConceptos, trabajos, categoriaCostoEnum } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

type Categoria = typeof categoriaCostoEnum.enumValues[number];

export async function asignarConcepto(params: {
  facturaConceptoId: string;
  trabajoId: string;
  importe: string;
  categoria: Categoria;
  fechaDevengo: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await requireAuth();

  const importeNum = parseFloat(params.importe);
  if (isNaN(importeNum) || importeNum <= 0) {
    return { ok: false, error: 'El importe debe ser mayor que cero.' };
  }
  if (!params.fechaDevengo) {
    return { ok: false, error: 'La fecha de devengo es requerida.' };
  }

  try {
    await withUserContext(ctx, async (tx) => {
      // RLS garantiza que solo vemos conceptos y trabajos de nuestra org
      const conceptoRows = await tx
        .select({ id: facturaConceptos.id, descripcion: facturaConceptos.descripcion })
        .from(facturaConceptos)
        .where(eq(facturaConceptos.id, params.facturaConceptoId))
        .limit(1);
      if (!conceptoRows[0]) throw new Error('Concepto no encontrado.');

      const trabajoRows = await tx
        .select({ id: trabajos.id, proyectoId: trabajos.proyectoId })
        .from(trabajos)
        .where(eq(trabajos.id, params.trabajoId))
        .limit(1);
      if (!trabajoRows[0]) throw new Error('Trabajo no encontrado.');

      const trabajo = trabajoRows[0];

      // INSERT asignación — el trigger DB valida que la suma no supere el importe del concepto
      const inserted = await tx
        .insert(asignaciones)
        .values({
          facturaConceptoId: params.facturaConceptoId,
          trabajoId: params.trabajoId,
          proyectoId: trabajo.proyectoId,
          organizacionId: ctx.organizacionId,
          importe: params.importe,
          categoria: params.categoria,
          fechaDevengo: params.fechaDevengo,
          createdBy: ctx.usuarioId,
        })
        .returning({ id: asignaciones.id });

      const asignacionId = inserted[0]!.id;

      // INSERT movimiento de costo — en la misma transacción
      await tx.insert(movimientosCosto).values({
        trabajoId: params.trabajoId,
        proyectoId: trabajo.proyectoId,
        organizacionId: ctx.organizacionId,
        categoria: params.categoria,
        importe: params.importe,
        signo: 1,
        fechaDevengo: params.fechaDevengo,
        origenTipo: 'factura_concepto',
        origenId: asignacionId,
        descripcion: conceptoRows[0].descripcion,
        createdBy: ctx.usuarioId,
      });
    });

    revalidatePath('/facturas');
    revalidatePath('/proyectos');
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error al asignar';
    if (msg.includes('Asignación excede')) {
      return { ok: false, error: 'La asignación supera el importe disponible del concepto.' };
    }
    return { ok: false, error: msg };
  }
}
