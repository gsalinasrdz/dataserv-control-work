import { withUserContext, type UserContext } from '@/lib/db/context';
import { facturas, facturaConceptos, asignaciones } from '@/lib/db/schema';
import { eq, desc, inArray, and } from 'drizzle-orm';

export async function getFacturas(ctx: UserContext) {
  return withUserContext(ctx, async (tx) =>
    tx
      .select({
        id: facturas.id,
        uuidFiscal: facturas.uuidFiscal,
        serie: facturas.serie,
        folio: facturas.folio,
        rfcEmisor: facturas.rfcEmisor,
        nombreEmisor: facturas.nombreEmisor,
        total: facturas.total,
        moneda: facturas.moneda,
        estado: facturas.estado,
        fechaEmision: facturas.fechaEmision,
      })
      .from(facturas)
      .orderBy(desc(facturas.fechaEmision)),
  );
}

export async function getFacturaConDetalles(ctx: UserContext, facturaId: string) {
  return withUserContext(ctx, async (tx) => {
    const rows = await tx
      .select()
      .from(facturas)
      .where(eq(facturas.id, facturaId))
      .limit(1);
    const factura = rows[0];
    if (!factura) return null;

    const conceptosList = await tx
      .select()
      .from(facturaConceptos)
      .where(eq(facturaConceptos.facturaId, facturaId))
      .orderBy(facturaConceptos.numeroLinea);

    if (conceptosList.length === 0) {
      return { ...factura, conceptos: [] as typeof conceptosList };
    }

    const asignacionesList = await tx
      .select({
        id: asignaciones.id,
        facturaConceptoId: asignaciones.facturaConceptoId,
        trabajoId: asignaciones.trabajoId,
        importe: asignaciones.importe,
        categoria: asignaciones.categoria,
        fechaDevengo: asignaciones.fechaDevengo,
        estado: asignaciones.estado,
      })
      .from(asignaciones)
      .where(
        and(
          inArray(
            asignaciones.facturaConceptoId,
            conceptosList.map((c) => c.id),
          ),
          eq(asignaciones.organizacionId, ctx.organizacionId),
        ),
      );

    return {
      ...factura,
      conceptos: conceptosList.map((c) => ({
        ...c,
        asignaciones: asignacionesList.filter(
          (a) => a.facturaConceptoId === c.id,
        ),
      })),
    };
  });
}
