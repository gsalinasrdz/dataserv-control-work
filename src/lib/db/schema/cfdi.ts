import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  numeric,
  integer,
  date,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { auditFields } from './shared';
import { organizaciones, empresas } from './tenancy';
import { trabajos, proyectos } from './proyectos';

export const estadoFacturaEnum = pgEnum('estado_factura', [
  'recibida',
  'parcialmente_asignada',
  'asignada',
  'cerrada',
]);

export const categoriaCostoEnum = pgEnum('categoria_costo', [
  'materiales',
  'mano_obra',
  'subcontratos',
  'equipo_renta',
  'fletes',
  'indirectos',
  'otros',
]);

export const estadoAsignacionEnum = pgEnum('estado_asignacion', [
  'autorizada',
  'cancelada',
]);

export const origenMovimientoEnum = pgEnum('origen_movimiento', [
  'factura_concepto',
  'alta_manual',
  'mano_obra',
  'prorrateo',
  'ajuste',
]);

export const facturas = pgTable(
  'facturas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizacionId: uuid('organizacion_id')
      .notNull()
      .references(() => organizaciones.id),
    empresaId: uuid('empresa_id').references(() => empresas.id),
    uuidFiscal: varchar('uuid_fiscal', { length: 36 }).notNull(),
    serie: varchar('serie', { length: 25 }),
    folio: varchar('folio', { length: 40 }),
    fechaEmision: timestamp('fecha_emision', { withTimezone: true }).notNull(),
    fechaTimbrado: timestamp('fecha_timbrado', { withTimezone: true }).notNull(),
    rfcEmisor: varchar('rfc_emisor', { length: 13 }).notNull(),
    nombreEmisor: varchar('nombre_emisor', { length: 255 }).notNull(),
    rfcReceptor: varchar('rfc_receptor', { length: 13 }).notNull(),
    subtotal: numeric('subtotal', { precision: 18, scale: 4 }).notNull(),
    total: numeric('total', { precision: 18, scale: 4 }).notNull(),
    moneda: varchar('moneda', { length: 3 }).notNull().default('MXN'),
    tipoCambio: numeric('tipo_cambio', { precision: 10, scale: 6 })
      .notNull()
      .default('1'),
    estado: estadoFacturaEnum('estado').notNull().default('recibida'),
    xmlCrudo: text('xml_crudo').notNull(),
    ...auditFields,
  },
  (t) => [unique('facturas_uuid_fiscal_org').on(t.uuidFiscal, t.organizacionId)],
);

export const facturaConceptos = pgTable('factura_conceptos', {
  id: uuid('id').primaryKey().defaultRandom(),
  facturaId: uuid('factura_id')
    .notNull()
    .references(() => facturas.id),
  organizacionId: uuid('organizacion_id')
    .notNull()
    .references(() => organizaciones.id),
  numeroLinea: integer('numero_linea').notNull(),
  claveProdServ: varchar('clave_prod_serv', { length: 8 }),
  noIdentificacion: varchar('no_identificacion', { length: 100 }),
  descripcion: text('descripcion').notNull(),
  claveUnidad: varchar('clave_unidad', { length: 20 }),
  unidad: varchar('unidad', { length: 50 }),
  cantidad: numeric('cantidad', { precision: 18, scale: 6 }).notNull(),
  valorUnitario: numeric('valor_unitario', { precision: 18, scale: 6 }).notNull(),
  importe: numeric('importe', { precision: 18, scale: 4 }).notNull(),
  descuento: numeric('descuento', { precision: 18, scale: 4 }).notNull().default('0'),
  objetoImp: varchar('objeto_imp', { length: 2 }),
  ...auditFields,
});

export const asignaciones = pgTable('asignaciones', {
  id: uuid('id').primaryKey().defaultRandom(),
  facturaConceptoId: uuid('factura_concepto_id')
    .notNull()
    .references(() => facturaConceptos.id),
  trabajoId: uuid('trabajo_id')
    .notNull()
    .references(() => trabajos.id),
  proyectoId: uuid('proyecto_id')
    .notNull()
    .references(() => proyectos.id),
  organizacionId: uuid('organizacion_id')
    .notNull()
    .references(() => organizaciones.id),
  importe: numeric('importe', { precision: 18, scale: 4 }).notNull(),
  categoria: categoriaCostoEnum('categoria').notNull(),
  fechaDevengo: date('fecha_devengo').notNull(),
  estado: estadoAsignacionEnum('estado').notNull().default('autorizada'),
  ...auditFields,
});

export const movimientosCosto = pgTable('movimientos_costo', {
  id: uuid('id').primaryKey().defaultRandom(),
  trabajoId: uuid('trabajo_id')
    .notNull()
    .references(() => trabajos.id),
  proyectoId: uuid('proyecto_id')
    .notNull()
    .references(() => proyectos.id),
  organizacionId: uuid('organizacion_id')
    .notNull()
    .references(() => organizaciones.id),
  categoria: categoriaCostoEnum('categoria').notNull(),
  importe: numeric('importe', { precision: 18, scale: 4 }).notNull(),
  signo: integer('signo').notNull().default(1),
  fechaDevengo: date('fecha_devengo').notNull(),
  origenTipo: origenMovimientoEnum('origen_tipo').notNull(),
  origenId: uuid('origen_id').notNull(),
  descripcion: text('descripcion'),
  ...auditFields,
});
