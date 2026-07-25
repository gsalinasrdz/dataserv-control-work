export interface FilaCSV {
  frenteClave: string;
  frenteNombre: string;
  frenteOrden: number;
  trabajoClave: string;
  trabajoNombre: string;
  unidad: string;
  cantidad: number;
  precioUnitario: number;
}

export interface ErrorCSV {
  fila: number;
  error: string;
}

export interface ResultadoParseCSV {
  filas: FilaCSV[];
  errores: ErrorCSV[];
}

const HEADER_ESPERADO = [
  'frente_clave',
  'frente_nombre',
  'frente_orden',
  'trabajo_clave',
  'trabajo_nombre',
  'unidad',
  'cantidad',
  'precio_unitario',
];

export function parseCSV(contenido: string): ResultadoParseCSV {
  const lineas = contenido
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lineas.length === 0) {
    return { filas: [], errores: [{ fila: 0, error: 'archivo vacío' }] };
  }

  const header = lineas[0]!.split(',').map((h) => h.trim().toLowerCase());
  const headerInvalido = HEADER_ESPERADO.find((h, i) => header[i] !== h);
  if (headerInvalido) {
    return {
      filas: [],
      errores: [
        {
          fila: 1,
          error: `header inválido — columna esperada: ${headerInvalido}`,
        },
      ],
    };
  }

  const filas: FilaCSV[] = [];
  const errores: ErrorCSV[] = [];

  for (let i = 1; i < lineas.length; i++) {
    const cols = lineas[i]!.split(',').map((c) => c.trim());
    const numFila = i + 1;

    if (cols.length !== 8) {
      errores.push({ fila: numFila, error: `se esperan 8 columnas, se encontraron ${cols.length}` });
      continue;
    }

    const frenteClave = cols[0];
    const frenteNombre = cols[1];
    const frenteOrdenStr = cols[2];
    const trabajoClave = cols[3];
    const trabajoNombre = cols[4];
    const unidad = cols[5];
    const cantidadStr = cols[6];
    const precioStr = cols[7];

    if (!frenteClave) { errores.push({ fila: numFila, error: 'frente_clave vacío' }); continue; }
    if (!frenteNombre) { errores.push({ fila: numFila, error: 'frente_nombre vacío' }); continue; }
    if (!trabajoClave) { errores.push({ fila: numFila, error: 'trabajo_clave vacío' }); continue; }
    if (!trabajoNombre) { errores.push({ fila: numFila, error: 'trabajo_nombre vacío' }); continue; }
    if (!unidad) { errores.push({ fila: numFila, error: 'unidad vacía' }); continue; }

    const frenteOrden = parseInt(frenteOrdenStr!, 10);
    if (isNaN(frenteOrden)) { errores.push({ fila: numFila, error: 'frente_orden no es número entero' }); continue; }

    const cantidad = parseFloat(cantidadStr!);
    if (isNaN(cantidad) || cantidad < 0) { errores.push({ fila: numFila, error: 'cantidad no es número >= 0' }); continue; }

    const precioUnitario = parseFloat(precioStr!);
    if (isNaN(precioUnitario) || precioUnitario < 0) { errores.push({ fila: numFila, error: 'precio_unitario no es número >= 0' }); continue; }

    filas.push({ frenteClave, frenteNombre, frenteOrden, trabajoClave, trabajoNombre, unidad, cantidad, precioUnitario });
  }

  return { filas, errores };
}
