import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core';
import { organizaciones } from './tenancy';

export const emailCfdiLog = pgTable('email_cfdi_log', {
  id:             uuid('id').primaryKey().defaultRandom(),
  messageUid:     varchar('message_uid', { length: 500 }).notNull().unique(),
  fromAddress:    varchar('from_address', { length: 500 }).notNull(),
  subject:        varchar('subject', { length: 1000 }),
  receivedAt:     timestamp('received_at', { withTimezone: true }).notNull(),
  xmlFilename:    varchar('xml_filename', { length: 500 }),
  cfdiUuid:       varchar('cfdi_uuid', { length: 36 }),
  organizacionId: uuid('organizacion_id').references(() => organizaciones.id),
  // pending | processed | duplicate | error | no_org
  status:         varchar('status', { length: 20 }).notNull().default('pending'),
  errorMessage:   text('error_message'),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
