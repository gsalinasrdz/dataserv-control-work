import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  numeric,
  date,
  integer,
  unique,
} from 'drizzle-orm/pg-core';
import { auditFields } from './shared';
import { organizaciones, empresas } from './tenancy';

export const estadoProyectoEnum = pgEnum('estado_proyecto', [
  'activo',
  'pausado',
  'cerrado',
]);

export const proyectos = pgTable(
  'proyectos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizacionId: uuid('organizacion_id')
      .notNull()
      .references(() => organizaciones.id),
    empresaId: uuid('empresa_id').references(() => empresas.id),
    nombre: varchar('nombre', { length: 255 }).notNull(),
    clave: varchar('clave', { length: 50 }).notNull(),
    descripcion: text('descripcion'),
    estado: estadoProyectoEnum('estado').notNull().default('activo'),
    fechaInicio: date('fecha_inicio'),
    fechaFinEstimada: date('fecha_fin_estimada'),
    ...auditFields,
  },
  (t) => [unique('proyectos_clave_org').on(t.clave, t.organizacionId)],
);

export const frentes = pgTable(
  'frentes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    proyectoId: uuid('proyecto_id')
      .notNull()
      .references(() => proyectos.id),
    organizacionId: uuid('organizacion_id')
      .notNull()
      .references(() => organizaciones.id),
    nombre: varchar('nombre', { length: 255 }).notNull(),
    clave: varchar('clave', { length: 50 }).notNull(),
    orden: integer('orden').notNull().default(0),
    ...auditFields,
  },
  (t) => [unique('frentes_clave_proyecto').on(t.clave, t.proyectoId)],
);

export const trabajos = pgTable(
  'trabajos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    frenteId: uuid('frente_id')
      .notNull()
      .references(() => frentes.id),
    proyectoId: uuid('proyecto_id')
      .notNull()
      .references(() => proyectos.id),
    organizacionId: uuid('organizacion_id')
      .notNull()
      .references(() => organizaciones.id),
    nombre: varchar('nombre', { length: 255 }).notNull(),
    clave: varchar('clave', { length: 50 }).notNull(),
    unidad: varchar('unidad', { length: 20 }).notNull(),
    presupuestoCantidad: numeric('presupuesto_cantidad', {
      precision: 15,
      scale: 4,
    })
      .notNull()
      .default('0'),
    presupuestoUnitario: numeric('presupuesto_unitario', {
      precision: 15,
      scale: 4,
    })
      .notNull()
      .default('0'),
    ...auditFields,
  },
  (t) => [unique('trabajos_clave_frente').on(t.clave, t.frenteId)],
);
