import { pgTable, uuid, varchar, text, unique } from 'drizzle-orm/pg-core';
import { auditFields } from './shared';
import { organizaciones } from './tenancy';

export const proveedores = pgTable('proveedores', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizacionId: uuid('organizacion_id')
    .notNull()
    .references(() => organizaciones.id),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  rfc: varchar('rfc', { length: 13 }),
  contacto: varchar('contacto', { length: 255 }),
  telefono: varchar('telefono', { length: 20 }),
  email: varchar('email', { length: 255 }),
  ...auditFields,
});

export const materiales = pgTable(
  'materiales',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizacionId: uuid('organizacion_id')
      .notNull()
      .references(() => organizaciones.id),
    nombre: varchar('nombre', { length: 255 }).notNull(),
    clave: varchar('clave', { length: 50 }).notNull(),
    unidad: varchar('unidad', { length: 20 }).notNull(),
    descripcion: text('descripcion'),
    ...auditFields,
  },
  (t) => [unique('materiales_clave_org').on(t.clave, t.organizacionId)],
);
