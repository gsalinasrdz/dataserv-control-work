import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { GrupoReporte } from '@/lib/queries/reporte';

const CATEGORIA_LABEL: Record<string, string> = {
  materiales: 'Materiales',
  mano_obra: 'Mano de obra',
  subcontratos: 'Subcontratos',
  equipo_renta: 'Equipo/Renta',
  fletes: 'Fletes',
  indirectos: 'Indirectos',
  otros: 'Otros',
};

const s = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: 'Helvetica', color: '#111827' },
  header: { marginBottom: 20 },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#6b7280', marginBottom: 2 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    backgroundColor: '#f3f4f6',
    padding: '5 8',
    marginTop: 12,
    marginBottom: 0,
    color: '#374151',
  },
  tableHead: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    padding: '4 8',
    backgroundColor: '#f9fafb',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    padding: '4 8',
  },
  colClave: { width: 72, color: '#6b7280' },
  colDesc: { flex: 1 },
  colCat: { width: 88, color: '#6b7280' },
  colImporte: { width: 80, textAlign: 'right' as const },
  subtotalRow: {
    flexDirection: 'row',
    padding: '4 8',
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
  },
  subtotalLabel: { flex: 1, fontWeight: 700, color: '#374151' },
  subtotalValue: { width: 80, textAlign: 'right' as const, fontWeight: 700, color: '#374151' },
  totalRow: {
    flexDirection: 'row',
    padding: '6 8',
    backgroundColor: '#f3f4f6',
    marginTop: 12,
  },
  totalLabel: { flex: 1, fontSize: 11, fontWeight: 700 },
  totalValue: { width: 80, fontSize: 11, fontWeight: 700, textAlign: 'right' as const },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 32,
    right: 32,
    fontSize: 8,
    color: '#9ca3af',
    textAlign: 'center' as const,
  },
});

function fmt(n: number): string {
  return '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2 });
}

interface Props {
  proyecto: { nombre: string; clave: string };
  grupos: GrupoReporte[];
  fecha: string;
}

export function ReportePDF({ proyecto, grupos, fecha }: Props) {
  const total = grupos.reduce((s, g) => s + g.subtotal, 0);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.title}>Reporte de costos</Text>
          <Text style={s.subtitle}>
            Proyecto: {proyecto.clave} — {proyecto.nombre}
          </Text>
          <Text style={s.subtitle}>Fecha: {fecha}</Text>
        </View>

        <View style={s.tableHead}>
          <Text style={s.colClave}>ClaveProdServ</Text>
          <Text style={s.colDesc}>Descripción</Text>
          <Text style={s.colCat}>Categoría</Text>
          <Text style={s.colImporte}>Importe</Text>
        </View>

        {grupos.map((grupo, gi) => (
          <View key={gi}>
            <Text style={s.sectionTitle}>{grupo.label.toUpperCase()}</Text>
            {grupo.conceptos.map((c, ci) => (
              <View key={ci} style={s.row}>
                <Text style={s.colClave}>{c.claveProdServ ?? '—'}</Text>
                <Text style={s.colDesc}>{c.descripcion}</Text>
                <Text style={s.colCat}>{CATEGORIA_LABEL[c.categoria] ?? c.categoria}</Text>
                <Text style={s.colImporte}>{fmt(Number(c.importe) || 0)}</Text>
              </View>
            ))}
            <View style={s.subtotalRow}>
              <Text style={s.subtotalLabel}>Subtotal {grupo.label}</Text>
              <Text style={s.subtotalValue}>{fmt(grupo.subtotal)}</Text>
            </View>
          </View>
        ))}

        <View style={s.totalRow}>
          <Text style={s.totalLabel}>TOTAL PROYECTO</Text>
          <Text style={s.totalValue}>{fmt(total)}</Text>
        </View>

        <Text style={s.footer}>Generado por OpsCore · {fecha}</Text>
      </Page>
    </Document>
  );
}
