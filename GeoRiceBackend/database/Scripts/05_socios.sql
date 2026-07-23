-- ═══════════════════════════════════════════════════════════════════════════
-- GeoRice BD - 05_socios.sql
-- Módulo socios (MagnaRice - compañero Crisspa)
-- Tabla maestra de socios, id TEXT igual que usuarios (Prisma). El vínculo
-- confiable entre usuarios y socios es la cédula (usuarioId puede quedar
-- sin poblar para cuentas históricas) — ver AuthService.resolveRol().
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

-- Tabla socios (id TEXT — igual que usuarios.id, generado por la app con
-- crypto.randomUUID() o por MagnaRice/Prisma según quién la cree)
CREATE TABLE IF NOT EXISTS public.socios (
    id            TEXT          NOT NULL,
    cedula        VARCHAR(10)   NOT NULL,
    nombre        TEXT          NOT NULL,
    apellido      TEXT          NOT NULL,
    email         TEXT,
    telefono      TEXT          NOT NULL DEFAULT '',
    direccion     TEXT,
    rol           public."RolSocio"    NOT NULL DEFAULT 'SOCIO',
    "nivelAcceso" public."NivelAcceso" NOT NULL DEFAULT 'MIEMBRO',
    estado        public."EstadoSocio" NOT NULL DEFAULT 'ACTIVO',
    "fechaIngreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId"   TEXT,
    CONSTRAINT socios_pkey PRIMARY KEY (id),
    CONSTRAINT socios_usuarioId_fkey FOREIGN KEY ("usuarioId") REFERENCES public.usuarios(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS socios_cedula_key    ON public.socios (cedula);
CREATE UNIQUE INDEX IF NOT EXISTS socios_email_key     ON public.socios (email);
CREATE UNIQUE INDEX IF NOT EXISTS socios_usuarioId_key ON public.socios ("usuarioId");
