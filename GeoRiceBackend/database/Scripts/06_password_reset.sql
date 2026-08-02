-- GeoRice BD - 06_password_reset.sql
-- Codigos de recuperacion de contrasena para GeoRice.
-- Script idempotente: se puede ejecutar varias veces sin borrar datos.

CREATE TABLE IF NOT EXISTS public.georice_password_reset_tokens (
    id          SERIAL PRIMARY KEY,
    usuario_id  TEXT NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    codigo_hash TEXT NOT NULL,
    expira_en   TIMESTAMP NOT NULL,
    usado_en    TIMESTAMP NULL,
    creado_en   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_georice_password_reset_usuario
    ON public.georice_password_reset_tokens(usuario_id);

CREATE INDEX IF NOT EXISTS idx_georice_password_reset_codigo
    ON public.georice_password_reset_tokens(codigo_hash);

CREATE INDEX IF NOT EXISTS idx_georice_password_reset_expira
    ON public.georice_password_reset_tokens(expira_en);