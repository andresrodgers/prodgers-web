-- ============================================================
-- PRODGERS MVP — Migración 002: Notificaciones internas
-- ============================================================

CREATE TABLE IF NOT EXISTS notificaciones (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id   UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo         TEXT        NOT NULL,
  titulo       TEXT        NOT NULL,
  mensaje      TEXT,
  entidad_tipo TEXT,
  entidad_id   UUID,
  leida        BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_usuario
  ON notificaciones(usuario_id, leida, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE
  ON notificaciones TO prodgers_app;
