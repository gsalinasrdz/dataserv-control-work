'use server';

import { requireAuth } from '@/lib/auth/server';
import { withUserContext } from '@/lib/db/context';
import { frentes, trabajos } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { parseCSV } from '@/lib/csv/parser';

export interface ResultadoImport {
  frentesCreados: number;
  trabajosCreados: number;
  trabajosActualizados: number;
  errores: string[];
}

export async function importarTrabajosCSV(
  proyectoId: string,
  csvContent: string,
): Promise<ResultadoImport> {
  const ctx = await requireAuth();

  const { filas, errores: erroresCSV } = parseCSV(csvContent);

  if (erroresCSV.length > 0) {
    return {
      frentesCreados: 0,
      trabajosCreados: 0,
      trabajosActualizados: 0,
      errores: erroresCSV.map((e) => `Fila ${e.fila}: ${e.error}`),
    };
  }

  const resultado: ResultadoImport = {
    frentesCreados: 0,
    trabajosCreados: 0,
    trabajosActualizados: 0,
    errores: [],
  };

  await withUserContext(ctx, async (tx) => {
    const frentesMap = new Map<string, string>(); // clave → id

    // Obtener frentes existentes del proyecto
    const existentes = await tx
      .select({ id: frentes.id, clave: frentes.clave })
      .from(frentes)
      .where(eq(frentes.proyectoId, proyectoId));

    for (const f of existentes) frentesMap.set(f.clave, f.id);

    // Crear frentes que no existen (uno por clave única)
    const frentesUnicos = [
      ...new Map(filas.map((f) => [f.frenteClave, f])).values(),
    ];

    for (const fila of frentesUnicos) {
      if (!frentesMap.has(fila.frenteClave)) {
        const [nuevo] = await tx
          .insert(frentes)
          .values({
            proyectoId,
            organizacionId: ctx.organizacionId,
            nombre: fila.frenteNombre,
            clave: fila.frenteClave,
            orden: fila.frenteOrden,
            createdBy: ctx.usuarioId,
          })
          .returning({ id: frentes.id });
        frentesMap.set(fila.frenteClave, nuevo!.id);
        resultado.frentesCreados++;
      }
    }

    // Upsert trabajos
    for (const fila of filas) {
      const frenteId = frentesMap.get(fila.frenteClave)!;

      const existente = await tx
        .select({ id: trabajos.id })
        .from(trabajos)
        .where(
          and(
            eq(trabajos.frenteId, frenteId),
            eq(trabajos.clave, fila.trabajoClave),
          ),
        )
        .limit(1);

      if (existente.length > 0) {
        await tx
          .update(trabajos)
          .set({
            nombre: fila.trabajoNombre,
            unidad: fila.unidad,
            presupuestoCantidad: String(fila.cantidad),
            presupuestoUnitario: String(fila.precioUnitario),
            updatedAt: new Date(),
          })
          .where(eq(trabajos.id, existente[0]!.id));
        resultado.trabajosActualizados++;
      } else {
        await tx.insert(trabajos).values({
          frenteId,
          proyectoId,
          organizacionId: ctx.organizacionId,
          nombre: fila.trabajoNombre,
          clave: fila.trabajoClave,
          unidad: fila.unidad,
          presupuestoCantidad: String(fila.cantidad),
          presupuestoUnitario: String(fila.precioUnitario),
          createdBy: ctx.usuarioId,
        });
        resultado.trabajosCreados++;
      }
    }
  });

  revalidatePath(`/proyectos/${proyectoId}`);
  return resultado;
}
