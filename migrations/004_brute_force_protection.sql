-- ============================================================
-- PRODGERS MVP — Migración 004: Protección brute force en login
-- ============================================================

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS failed_login_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
