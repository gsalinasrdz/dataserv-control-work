'use server';

import { requireAuth } from '@/lib/auth/server';
import { withUserContext } from '@/lib/db/context';
import { facturas, facturaConceptos, proveedores } from '@/lib/db/schema';
import { parseCFDI } from '@/lib/cfdi/parser';
import { revalidatePath } from 'next/cache';
import { eq, and } from 'drizzle-orm';

export async function cargarFactura(
  xmlContent: string,
): Promise<{ ok: true; facturaId: string } | { ok: false; error: string }> {
  const ctx = await requireAuth();

  try {
    const parsed = parseCFDI(xmlContent);

    const facturaId = await withUserContext(ctx, async (tx) => {
      // Dar de alta el proveedor si no existe en la organización
      if (parsed.rfcEmisor) {
        const existe = await tx
          .select({ id: proveedores.id })
          .from(proveedores)
          .where(
            and(
              eq(proveedores.organizacionId, ctx.organizacionId),
              eq(proveedores.rfc, parsed.rfcEmisor),
            ),
          )
          .limit(1);

        if (existe.length === 0) {
          await tx.insert(proveedores).values({
            organizacionId: ctx.organizacionId,
            nombre: parsed.nombreEmisor,
            rfc: parsed.rfcEmisor,
            createdBy: ctx.usuarioId,
          });
        }
      }

      const inserted = await tx
        .insert(facturas)
        .values({
          organizacionId: ctx.organizacionId,
          uuidFiscal: parsed.uuid,
          serie: parsed.serie ?? undefined,
          folio: parsed.folio ?? undefined,
          fechaEmision: new Date(parsed.fecha),
          fechaTimbrado: new Date(parsed.fechaTimbrado),
          rfcEmisor: parsed.rfcEmisor,
          nombreEmisor: parsed.nombreEmisor,
          rfcReceptor: parsed.rfcReceptor,
          subtotal: parsed.subTotal,
          total: parsed.total,
          moneda: parsed.moneda,
          tipoCambio: parsed.tipoCambio,
          xmlCrudo: parsed.xmlCrudo,
          createdBy: ctx.usuarioId,
        })
        .returning({ id: facturas.id });

      const facturaId = inserted[0]!.id;

      for (let i = 0; i < parsed.conceptos.length; i++) {
        const c = parsed.conceptos[i]!;
        await tx.insert(facturaConceptos).values({
          facturaId,
          organizacionId: ctx.organizacionId,
          numeroLinea: i + 1,
          claveProdServ: c.claveProdServ ?? undefined,
          noIdentificacion: c.noIdentificacion ?? undefined,
          descripcion: c.descripcion,
          claveUnidad: c.claveUnidad ?? undefined,
          unidad: c.unidad ?? undefined,
          cantidad: c.cantidad,
          valorUnitario: c.valorUnitario,
          importe: c.importe,
          descuento: c.descuento,
          objetoImp: c.objetoImp ?? undefined,
          createdBy: ctx.usuarioId,
        });
      }

      return facturaId;
    });

    revalidatePath('/facturas');
    return { ok: true, facturaId };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error al cargar factura';
    if (msg.includes('facturas_uuid_fiscal_org') || msg.includes('23505')) {
      return { ok: false, error: 'Esta factura (UUID fiscal) ya fue registrada en esta organización.' };
    }
    return { ok: false, error: msg };
  }
}
