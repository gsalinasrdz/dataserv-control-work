import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  unique,
} from 'drizzle-orm/pg-core';

const auditFields = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').notNull(),
};

export const organizaciones = pgTable('organizaciones', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  rfc: varchar('rfc', { length: 13 }),
  ...auditFields,
});

export const empresas = pgTable(
  'empresas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizacionId: uuid('organizacion_id')
      .notNull()
      .references(() => organizaciones.id),
    nombre: varchar('nombre', { length: 255 }).notNull(),
    rfc: varchar('rfc', { length: 13 }).notNull(),
    ...auditFields,
  },
  (t) => [unique('empresas_rfc_org').on(t.rfc, t.organizacionId)],
);

export const rolEnum = pgEnum('rol_sistema', [
  'administrador',
  'control_costos',
  'contabilidad',
  'residente',
  'capturista',
  'almacenista',
  'direccion',
]);

export const usuarios = pgTable(
  'usuarios',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizacionId: uuid('organizacion_id')
      .notNull()
      .references(() => organizaciones.id),
    email: varchar('email', { length: 255 }).notNull(),
    nombre: varchar('nombre', { length: 255 }).notNull(),
    ...auditFields,
  },
  (t) => [unique('usuarios_email_org').on(t.email, t.organizacionId)],
);

export const usuarioRoles = pgTable('usuario_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  usuarioId: uuid('usuario_id')
    .notNull()
    .references(() => usuarios.id),
  organizacionId: uuid('organizacion_id')
    .notNull()
    .references(() => organizaciones.id),
  rol: rolEnum('rol').notNull(),
  proyectoId: uuid('proyecto_id'),
  ...auditFields,
});
