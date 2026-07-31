import { withUserContext, type UserContext } from '@/lib/db/context';
import { facturas, facturaConceptos, asignaciones, trabajos } from '@/lib/db/schema';
import { eq, desc, inArray, and, sql } from 'drizzle-orm';

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
        trabajoClave: trabajos.clave,
        trabajoNombre: trabajos.nombre,
        importe: asignaciones.importe,
        categoria: asignaciones.categoria,
        fechaDevengo: asignaciones.fechaDevengo,
        estado: asignaciones.estado,
      })
      .from(asignaciones)
      .leftJoin(trabajos, eq(asignaciones.trabajoId, trabajos.id))
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

export async function getFacturasByProyecto(ctx: UserContext, proyectoId: string) {
  type Row = {
    id: string;
    uuidFiscal: string;
    serie: string | null;
    folio: string | null;
    nombreEmisor: string;
    rfcEmisor: string;
    total: string;
    moneda: string;
    fechaEmision: Date;
    estado: string;
    importeAsignado: string;
  };

  return withUserContext(ctx, async (tx) =>
    tx.execute(sql`
      SELECT
        f.id,
        f.uuid_fiscal        AS "uuidFiscal",
        f.serie,
        f.folio,
        f.nombre_emisor      AS "nombreEmisor",
        f.rfc_emisor         AS "rfcEmisor",
        f.total,
        f.moneda,
        f.fecha_emision      AS "fechaEmision",
        f.estado,
        SUM(a.importe)::text AS "importeAsignado"
      FROM facturas f
      JOIN factura_conceptos fc ON fc.factura_id = f.id
      JOIN asignaciones a ON a.factura_concepto_id = fc.id
      WHERE a.proyecto_id = ${proyectoId}
        AND a.estado = 'autorizada'
      GROUP BY f.id, f.uuid_fiscal, f.serie, f.folio, f.nombre_emisor,
               f.rfc_emisor, f.total, f.moneda, f.fecha_emision, f.estado
      ORDER BY f.fecha_emision DESC
    `)
  ) as unknown as Row[];
}
