import { describe, it, expect } from 'vitest';
import { parseCSV } from '@/lib/csv/parser';

const CSV_VALIDO = `frente_clave,frente_nombre,frente_orden,trabajo_clave,trabajo_nombre,unidad,cantidad,precio_unitario
EST,Estructura,1,EST-001,Trazo y nivelación,m2,1500.00,45.50
EST,Estructura,1,EST-002,Excavación,m3,800.00,320.00
ACB,Acabados,2,ACB-001,Pintura interior,m2,3500.00,85.00`;

describe('parseCSV', () => {
  it('parsea filas válidas correctamente', () => {
    const { filas, errores } = parseCSV(CSV_VALIDO);
    expect(errores).toHaveLength(0);
    expect(filas).toHaveLength(3);
    expect(filas[0]).toMatchObject({
      frenteClave: 'EST',
      frenteNombre: 'Estructura',
      frenteOrden: 1,
      trabajoClave: 'EST-001',
      trabajoNombre: 'Trazo y nivelación',
      unidad: 'm2',
      cantidad: 1500,
      precioUnitario: 45.5,
    });
  });

  it('reporta error cuando falta trabajo_nombre', () => {
    const csv = `frente_clave,frente_nombre,frente_orden,trabajo_clave,trabajo_nombre,unidad,cantidad,precio_unitario
EST,Estructura,1,EST-001,,m2,100,50`;
    const { filas, errores } = parseCSV(csv);
    expect(filas).toHaveLength(0);
    expect(errores[0]!.fila).toBe(2);
    expect(errores[0]!.error).toMatch(/trabajo_nombre/);
  });

  it('reporta error cuando cantidad no es número', () => {
    const csv = `frente_clave,frente_nombre,frente_orden,trabajo_clave,trabajo_nombre,unidad,cantidad,precio_unitario
EST,Estructura,1,EST-001,Trazo,m2,INVALIDO,50`;
    const { filas, errores } = parseCSV(csv);
    expect(filas).toHaveLength(0);
    expect(errores[0]!.error).toMatch(/cantidad/);
  });

  it('ignora líneas vacías', () => {
    const csv = `frente_clave,frente_nombre,frente_orden,trabajo_clave,trabajo_nombre,unidad,cantidad,precio_unitario
EST,Estructura,1,EST-001,Trazo,m2,100,50

`;
    const { filas, errores } = parseCSV(csv);
    expect(errores).toHaveLength(0);
    expect(filas).toHaveLength(1);
  });

  it('reporta error con header inválido', () => {
    const csv = `columna_incorrecta,frente_nombre,frente_orden,trabajo_clave,trabajo_nombre,unidad,cantidad,precio_unitario
EST,Estructura,1,EST-001,Trazo,m2,100,50`;
    const { filas, errores } = parseCSV(csv);
    expect(filas).toHaveLength(0);
    expect(errores[0]!.error).toMatch(/header/);
  });

  it('devuelve error con archivo vacío', () => {
    const { filas, errores } = parseCSV('');
    expect(filas).toHaveLength(0);
    expect(errores[0]!.error).toMatch(/vacío/);
  });

  it('reporta error si columnas insuficientes', () => {
    const csv = `frente_clave,frente_nombre,frente_orden,trabajo_clave,trabajo_nombre,unidad,cantidad,precio_unitario
EST,Estructura,1,EST-001,Trazo,m2`;
    const { filas, errores } = parseCSV(csv);
    expect(filas).toHaveLength(0);
    expect(errores[0]!.error).toMatch(/columnas/);
  });
});
