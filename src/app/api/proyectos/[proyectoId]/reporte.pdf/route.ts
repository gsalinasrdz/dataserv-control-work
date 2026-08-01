import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { getResumenProyecto } from '@/lib/queries/proyectos';
import { groupConceptos, type ConceptoReporte } from '@/lib/queries/reporte';
import React from 'react';

interface RequestBody {
  conceptos: ConceptoReporte[];
  agrupacion: 'frente' | 'categoria' | 'plano';
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ proyectoId: string }> },
) {
  const { proyectoId } = await params;

  try {
    const ctx = await requireAuth();
    const proyecto = await getResumenProyecto(ctx, proyectoId);
    if (!proyecto) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    const body = (await request.json()) as RequestBody;
    const grupos = groupConceptos(body.conceptos, body.agrupacion);

    const now = new Date();
    const fecha = now.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    // Dynamic imports to prevent webpack from bundling these ESM-only packages
    const [{ renderToBuffer }, { ReportePDF }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('@/lib/pdf/ReportePDF'),
    ]);

    const buffer = await renderToBuffer(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      React.createElement(ReportePDF as any, {
        proyecto: { nombre: proyecto.nombre, clave: proyecto.clave },
        grupos,
        fecha,
      }),
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte-${proyecto.clave.replace(/[^a-zA-Z0-9_-]/g, '_')}-${now.toISOString().split('T')[0]}.pdf"`,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al generar PDF';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
