-- ═══════════════════════════════════════════════════════════════════════════
-- GeoRice BD - 05_socios.sql
-- Módulo socios (MagnaRice - compañero Crisspa)
-- ENUMs y tabla socios adaptados con INTEGER para alinearse con usuarios.id
-- ═══════════════════════════════════════════════════════════════════════════

SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

-- ENUMs de MagnaRice (se ignoran silenciosamente si ya existen)
DO $$ BEGIN CREATE TYPE public."RolSocio" AS ENUM ('PRESIDENTE','SECRETARIA','TESORERO','VOCAL','SOCIO','INDEPENDIENTE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public."NivelAcceso" AS ENUM ('ADMIN','DIRECTIVO','MIEMBRO','SOLO_VISTA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public."EstadoSocio" AS ENUM ('ACTIVO','INACTIVO','SUSPENDIDO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public."TipoDocumento" AS ENUM ('RESOLUCION','OFICIO','CERTIFICADO','SOLICITUD','ACTA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public."EstadoDocumento" AS ENUM ('ACTIVO','ENVIADO','EMITIDO','ARCHIVADO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public."TipoReunion" AS ENUM ('ORDINARIA','EXTRAORDINARIA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public."ModalidadReunion" AS ENUM ('PRESENCIAL','VIRTUAL','MIXTA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public."EstadoReunion" AS ENUM ('PROGRAMADA','EN_CURSO','FINALIZADA','CANCELADA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public."EstadoMulta" AS ENUM ('PENDIENTE','PAGADA','EXONERADA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tabla socios (adaptada a INTEGER para FK con usuarios.id)
CREATE TABLE IF NOT EXISTS public.socios (
    id            SERIAL        PRIMARY KEY,
    cedula        VARCHAR(10)   NOT NULL UNIQUE,
    nombre        TEXT          NOT NULL,
    apellido      TEXT          NOT NULL,
    email         TEXT          UNIQUE,
    telefono      TEXT          NOT NULL DEFAULT '',
    direccion     TEXT,
    rol           public."RolSocio"    NOT NULL DEFAULT 'SOCIO',
    nivel_acceso  public."NivelAcceso" NOT NULL DEFAULT 'MIEMBRO',
    estado        public."EstadoSocio" NOT NULL DEFAULT 'ACTIVO',
    fecha_ingreso TIMESTAMP     NOT NULL DEFAULT NOW(),
    created_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
    usuario_id    INTEGER       REFERENCES public.usuarios(id) ON DELETE SET NULL
);

-- Columna email agregada a usuarios para compatibilidad con AuthService
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS email VARCHAR(100) UNIQUE;

CREATE UNIQUE INDEX IF NOT EXISTS socios_usuario_id_key ON public.socios(usuario_id);