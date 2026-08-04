-- ============================================================
-- PRODGERS MVP — Migración 008: tracking de envío de correo
-- Permite auditar qué notificaciones dispararon un correo y si
-- el envío falló (ej. por RESEND_API_KEY faltante o dominio no
-- verificado), sin bloquear ni afectar la notificación in-app.
-- ============================================================

ALTER TABLE notificaciones
  ADD COLUMN IF NOT EXISTS email_enviado BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_error TEXT;
