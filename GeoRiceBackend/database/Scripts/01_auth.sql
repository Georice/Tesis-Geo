-- ═══════════════════════════════════════════════════════════════════════════
-- GeoRice BD - 01_auth.sql
-- Módulo de autenticación: usuarios
--
-- IMPORTANTE: "usuarios" es propiedad de MagnaRice (gestionada con Prisma).
-- id es TEXT (sin default en DB — la app lo genera con crypto.randomUUID()
-- al crear), y las columnas createdAt/updatedAt son camelCase tal cual las
-- creó Prisma. No tiene columnas rol/estado propias: el rol efectivo se
-- resuelve en runtime uniendo por cédula contra "socios" (ver 05_socios.sql).
--
-- Los refresh tokens de sesión NO se manejan en una tabla propia de GeoRice:
-- se reutiliza "tokens_actualizacion" (también de MagnaRice/Prisma), con
-- columnas id/usuarioId/hashToken/expiraEn/revocadoEn/createdAt — ver
-- src/infrastructure/db/models/RefreshTokenModel.ts. No hay script de
-- creación aquí porque esa tabla ya existe en la DB compartida.
-- ═══════════════════════════════════════════════════════════════════════════

SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

-- Name: fn_set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--
-- Usada por las tablas geo (zonas/parcelas/capas_parcela/...), no por
-- usuarios/socios (esas dos las gestiona Prisma a nivel de ORM).

CREATE OR REPLACE FUNCTION public.fn_set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.usuarios (
    id          TEXT         NOT NULL,
    email       TEXT,
    password    TEXT         NOT NULL,
    nombre      TEXT         NOT NULL,
    apellido    TEXT         NOT NULL,
    activo      BOOLEAN      NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    cedula      VARCHAR(10)  NOT NULL,
    CONSTRAINT usuarios_pkey PRIMARY KEY (id)
);


CREATE UNIQUE INDEX IF NOT EXISTS usuarios_email_key  ON public.usuarios (email);
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_cedula_key ON public.usuarios (cedula);
