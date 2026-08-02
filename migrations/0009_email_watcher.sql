-- Tabla de log para seguimiento de correos procesados por el email watcher
CREATE TABLE IF NOT EXISTS email_cfdi_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_uid      VARCHAR(500) NOT NULL UNIQUE,
  from_address     VARCHAR(500) NOT NULL,
  subject          VARCHAR(1000),
  received_at      TIMESTAMPTZ NOT NULL,
  xml_filename     VARCHAR(500),
  cfdi_uuid        VARCHAR(36),
  organizacion_id  UUID REFERENCES organizaciones(id),
  -- pending | processed | duplicate | error | no_org
  status           VARCHAR(20) NOT NULL DEFAULT 'pending',
  error_message    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_cfdi_log_status_idx ON email_cfdi_log(status);
CREATE INDEX IF NOT EXISTS email_cfdi_log_created_at_idx ON email_cfdi_log(created_at DESC);
