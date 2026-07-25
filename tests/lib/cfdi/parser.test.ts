import { describe, it, expect } from 'vitest';
import { parseCFDI } from '@/lib/cfdi/parser';

const UUID_FIXTURE = '12345678-1234-1234-1234-123456789012';

const XML_UN_CONCEPTO = `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4"
  xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital"
  Version="4.0" Serie="A" Folio="123"
  Fecha="2024-03-15T10:30:00"
  SubTotal="10000.0000" Total="11600.0000"
  Moneda="MXN" TipoCambio="1"
  TipoDeComprobante="I">
  <cfdi:Emisor Rfc="XAXX010101000" Nombre="PROVEEDOR SA DE CV" RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="XEXX010101000" Nombre="EMPRESA RECEPTORA" UsoCFDI="G01"
    DomicilioFiscalReceptor="01000" RegimenFiscalReceptor="601"/>
  <cfdi:Conceptos>
    <cfdi:Concepto ClaveProdServ="43211500" NoIdentificacion="TUBO-001"
      Descripcion="Tuberia de cobre 1/2 pulgada"
      Cantidad="50.000000" ClaveUnidad="H87" Unidad="Pieza"
      ValorUnitario="200.000000" Importe="10000.0000" Descuento="0.0000" ObjetoImp="02"/>
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="1600.00"/>
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital Version="1.1"
      UUID="${UUID_FIXTURE}"
      FechaTimbrado="2024-03-15T10:31:00"/>
  </cfdi:Complemento>
</cfdi:Comprobante>`;

const XML_DOS_CONCEPTOS = `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4"
  xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital"
  Version="4.0" Fecha="2024-03-16T09:00:00"
  SubTotal="20000.0000" Total="23200.0000"
  Moneda="MXN" TipoCambio="1" TipoDeComprobante="I">
  <cfdi:Emisor Rfc="AAA010101AAA" Nombre="Proveedor Dos" RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="BBB010101BBB" Nombre="Receptor Dos" UsoCFDI="G01"
    DomicilioFiscalReceptor="06600" RegimenFiscalReceptor="601"/>
  <cfdi:Conceptos>
    <cfdi:Concepto ClaveProdServ="43211500" Descripcion="Material A"
      Cantidad="10.000000" ClaveUnidad="H87"
      ValorUnitario="1000.000000" Importe="10000.0000" Descuento="0.0000" ObjetoImp="02"/>
    <cfdi:Concepto ClaveProdServ="43211501" Descripcion="Material B"
      Cantidad="20.000000" ClaveUnidad="H87"
      ValorUnitario="500.000000" Importe="10000.0000" Descuento="0.0000" ObjetoImp="02"/>
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="3200.00"/>
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital Version="1.1"
      UUID="AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA"
      FechaTimbrado="2024-03-16T09:01:00"/>
  </cfdi:Complemento>
</cfdi:Comprobante>`;

describe('parseCFDI', () => {
  it('parsea encabezado correctamente', () => {
    const r = parseCFDI(XML_UN_CONCEPTO);
    expect(r.uuid).toBe(UUID_FIXTURE);
    expect(r.serie).toBe('A');
    expect(r.folio).toBe('123');
    expect(r.rfcEmisor).toBe('XAXX010101000');
    expect(r.nombreEmisor).toBe('PROVEEDOR SA DE CV');
    expect(r.rfcReceptor).toBe('XEXX010101000');
    expect(r.subTotal).toBe('10000.0000');
    expect(r.total).toBe('11600.0000');
    expect(r.moneda).toBe('MXN');
    expect(r.tipoCambio).toBe('1');
  });

  it('parsea un solo concepto como array', () => {
    const r = parseCFDI(XML_UN_CONCEPTO);
    expect(r.conceptos).toHaveLength(1);
    expect(r.conceptos[0]!.descripcion).toBe('Tuberia de cobre 1/2 pulgada');
    expect(r.conceptos[0]!.claveProdServ).toBe('43211500');
    expect(r.conceptos[0]!.noIdentificacion).toBe('TUBO-001');
    expect(r.conceptos[0]!.cantidad).toBe('50.000000');
    expect(r.conceptos[0]!.importe).toBe('10000.0000');
    expect(r.conceptos[0]!.descuento).toBe('0.0000');
  });

  it('parsea múltiples conceptos', () => {
    const r = parseCFDI(XML_DOS_CONCEPTOS);
    expect(r.conceptos).toHaveLength(2);
    expect(r.conceptos[0]!.descripcion).toBe('Material A');
    expect(r.conceptos[1]!.descripcion).toBe('Material B');
  });

  it('serie y folio son null cuando no están presentes', () => {
    const r = parseCFDI(XML_DOS_CONCEPTOS);
    expect(r.serie).toBeNull();
    expect(r.folio).toBeNull();
  });

  it('conserva xmlCrudo íntegro', () => {
    const r = parseCFDI(XML_UN_CONCEPTO);
    expect(r.xmlCrudo).toBe(XML_UN_CONCEPTO);
  });

  it('lanza error cuando no hay TimbreFiscalDigital (UUID)', () => {
    const xmlSinTfd = XML_UN_CONCEPTO.replace(
      /<tfd:TimbreFiscalDigital[\s\S]*?\/>/,
      '',
    );
    expect(() => parseCFDI(xmlSinTfd)).toThrow(/UUID|tfd|TimbreFiscal/i);
  });

  it('lanza error con XML vacío', () => {
    expect(() => parseCFDI('')).toThrow();
  });
});
