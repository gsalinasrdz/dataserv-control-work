-- Tablas requeridas por @auth/pg-adapter
-- Ejecutar como opscore_owner

CREATE TABLE auth_users (
  id              text PRIMARY KEY,
  name            text,
  email           text UNIQUE,
  "emailVerified" timestamptz,
  image           text
);

CREATE TABLE auth_accounts (
  id                   text PRIMARY KEY,
  "userId"             text NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  type                 text NOT NULL,
  provider             text NOT NULL,
  "providerAccountId"  text NOT NULL,
  refresh_token        text,
  access_token         text,
  expires_at           bigint,
  token_type           text,
  scope                text,
  id_token             text,
  session_state        text,
  UNIQUE (provider, "providerAccountId")
);

CREATE TABLE auth_sessions (
  id             text PRIMARY KEY,
  "sessionToken" text UNIQUE NOT NULL,
  "userId"       text NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  expires        timestamptz NOT NULL
);

CREATE TABLE auth_verification_tokens (
  identifier text      NOT NULL,
  expires    timestamptz NOT NULL,
  token      text      UNIQUE NOT NULL,
  PRIMARY KEY (identifier, token)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON auth_users, auth_accounts, auth_sessions, auth_verification_tokens TO app_user;
