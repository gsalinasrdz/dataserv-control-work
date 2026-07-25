export interface ConceptoCFDI {
  claveProdServ: string | null;
  noIdentificacion: string | null;
  descripcion: string;
  claveUnidad: string | null;
  unidad: string | null;
  cantidad: string;
  valorUnitario: string;
  importe: string;
  descuento: string;
  objetoImp: string | null;
}

export interface FacturaCFDI {
  version: string;
  serie: string | null;
  folio: string | null;
  fecha: string;
  rfcEmisor: string;
  nombreEmisor: string;
  rfcReceptor: string;
  nombreReceptor: string;
  subTotal: string;
  total: string;
  moneda: string;
  tipoCambio: string;
  tipoDeComprobante: string;
  uuid: string;
  fechaTimbrado: string;
  conceptos: ConceptoCFDI[];
  xmlCrudo: string;
}
