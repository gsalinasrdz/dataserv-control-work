import { XMLParser } from 'fast-xml-parser';
import type { ConceptoCFDI, FacturaCFDI } from './types';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: false,
  allowBooleanAttributes: true,
  isArray: (name) => name === 'cfdi:Concepto',
});

function strOrNull(val: unknown): string | null {
  if (val === undefined || val === null || val === '') return null;
  return String(val);
}

function str(val: unknown, field: string): string {
  if (val === undefined || val === null || val === '') {
    throw new Error(`Campo requerido faltante: ${field}`);
  }
  return String(val);
}

export function parseCFDI(xml: string): FacturaCFDI {
  if (!xml.trim()) throw new Error('XML vacío');

  const doc = xmlParser.parse(xml) as Record<string, unknown>;
  const comp = doc['cfdi:Comprobante'] as Record<string, unknown> | undefined;
  if (!comp) throw new Error('Elemento cfdi:Comprobante no encontrado');

  const emisor = comp['cfdi:Emisor'] as Record<string, unknown>;
  const receptor = comp['cfdi:Receptor'] as Record<string, unknown>;
  const conceptosNode = comp['cfdi:Conceptos'] as Record<string, unknown>;
  const complemento = comp['cfdi:Complemento'] as Record<string, unknown>;

  const tfd = complemento?.['tfd:TimbreFiscalDigital'] as Record<string, unknown> | undefined;
  if (!tfd) throw new Error('tfd:TimbreFiscalDigital no encontrado — el XML no está timbrado');

  const uuid = str(tfd['@_UUID'], 'UUID');
  const fechaTimbrado = str(tfd['@_FechaTimbrado'], 'FechaTimbrado');

  const rawConceptos = (conceptosNode?.['cfdi:Concepto'] ?? []) as Record<string, unknown>[];

  const conceptos: ConceptoCFDI[] = rawConceptos.map((c) => ({
    claveProdServ: strOrNull(c['@_ClaveProdServ']),
    noIdentificacion: strOrNull(c['@_NoIdentificacion']),
    descripcion: str(c['@_Descripcion'], 'Descripcion'),
    claveUnidad: strOrNull(c['@_ClaveUnidad']),
    unidad: strOrNull(c['@_Unidad']),
    cantidad: str(c['@_Cantidad'], 'Cantidad'),
    valorUnitario: str(c['@_ValorUnitario'], 'ValorUnitario'),
    importe: str(c['@_Importe'], 'Importe'),
    descuento: strOrNull(c['@_Descuento']) ?? '0',
    objetoImp: strOrNull(c['@_ObjetoImp']),
  }));

  return {
    version: str(comp['@_Version'], 'Version'),
    serie: strOrNull(comp['@_Serie']),
    folio: strOrNull(comp['@_Folio']),
    fecha: str(comp['@_Fecha'], 'Fecha'),
    rfcEmisor: str(emisor?.['@_Rfc'], 'Emisor.Rfc'),
    nombreEmisor: str(emisor?.['@_Nombre'], 'Emisor.Nombre'),
    rfcReceptor: str(receptor?.['@_Rfc'], 'Receptor.Rfc'),
    nombreReceptor: str(receptor?.['@_Nombre'], 'Receptor.Nombre'),
    subTotal: str(comp['@_SubTotal'], 'SubTotal'),
    total: str(comp['@_Total'], 'Total'),
    moneda: strOrNull(comp['@_Moneda']) ?? 'MXN',
    tipoCambio: strOrNull(comp['@_TipoCambio']) ?? '1',
    tipoDeComprobante: str(comp['@_TipoDeComprobante'], 'TipoDeComprobante'),
    uuid,
    fechaTimbrado,
    conceptos,
    xmlCrudo: xml,
  };
}
