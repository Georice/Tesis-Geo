-- ================================================================
-- GeoRice — Migración: Auth, Auditoría y Control de Acceso
-- Base de datos: postgres_tesis
-- Ejecutar UNA sola vez. Es idempotente.
-- NOTA: PostgreSQL no soporta ADD CONSTRAINT IF NOT EXISTS,
--       por eso se usan bloques DO con manejo de excepciones.
-- LA BRANDEN PARA MIGRAR: psql -U postgres -d postgres_tesis -f .\database\migration_auth.sql

-- ================================================================

BEGIN;

-- ----------------------------------------------------------------
-- FUNCIÓN: actualiza updated_at en cada UPDATE
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- TABLA: usuarios
-- ================================================================
CREATE TABLE IF NOT EXISTS public.usuarios (
    id              SERIAL PRIMARY KEY,
    cedula          VARCHAR(13)  NOT NULL,
    nombres         VARCHAR(100) NOT NULL,
    apellidos       VARCHAR(100) NOT NULL,
    usuario         VARCHAR(50)  NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    rol             VARCHAR(20)  NOT NULL DEFAULT 'socio',
    estado          VARCHAR(10)  NOT NULL DEFAULT 'activo',
    fecha_registro  TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_by      INTEGER,

    CONSTRAINT usuarios_cedula_unique  UNIQUE (cedula),
    CONSTRAINT usuarios_usuario_unique UNIQUE (usuario),
    CONSTRAINT usuarios_rol_check      CHECK (rol    IN ('administrador', 'socio')),
    CONSTRAINT usuarios_estado_check   CHECK (estado IN ('activo', 'inactivo'))
);

ALTER TABLE public.usuarios OWNER TO postgres;

-- FK auto-referencial (solo si no existe)
DO $$ BEGIN
    ALTER TABLE public.usuarios
        ADD CONSTRAINT usuarios_updated_by_fkey
        FOREIGN KEY (updated_by) REFERENCES public.usuarios(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_usuarios_cedula  ON public.usuarios USING btree (cedula);
CREATE INDEX IF NOT EXISTS idx_usuarios_usuario ON public.usuarios USING btree (usuario);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol     ON public.usuarios USING btree (rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_estado  ON public.usuarios USING btree (estado);

DROP TRIGGER IF EXISTS trg_usuarios_updated_at ON public.usuarios;
CREATE TRIGGER trg_usuarios_updated_at
    BEFORE UPDATE ON public.usuarios
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- Administrador por defecto (password: Admin.GeoRice2025, bcrypt 12 rounds)
INSERT INTO public.usuarios (cedula, nombres, apellidos, usuario, password_hash, rol, estado)
VALUES (
    '0000000000',
    'Administrador',
    'GeoRice',
    'admin',
    '$2b$12$3FJIsiqQhOlO43RW9jwRg.t3sRqKZd9B6iACekAg1zoen9FBxEYBG',
    'administrador',
    'activo'
)
ON CONFLICT (usuario) DO NOTHING;

-- ================================================================
-- TABLA: refresh_tokens
-- ================================================================
CREATE TABLE IF NOT EXISTS public.refresh_tokens (
    id          SERIAL PRIMARY KEY,
    usuario_id  INTEGER NOT NULL,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    creado_en   TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    revocado    BOOLEAN DEFAULT FALSE,

    CONSTRAINT refresh_tokens_usuario_fkey
        FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_usuario ON public.refresh_tokens USING btree (usuario_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash    ON public.refresh_tokens USING btree (token_hash);

-- ================================================================
-- MODIFICAR: zonas — usuario_id + auditoría
-- ================================================================
ALTER TABLE public.zonas
    ADD COLUMN IF NOT EXISTS usuario_id  INTEGER,
    ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS created_by  INTEGER,
    ADD COLUMN IF NOT EXISTS updated_by  INTEGER;

-- Asignar admin a filas existentes sin usuario
UPDATE public.zonas
SET usuario_id = (SELECT id FROM public.usuarios WHERE rol = 'administrador' LIMIT 1),
    created_by = (SELECT id FROM public.usuarios WHERE rol = 'administrador' LIMIT 1)
WHERE usuario_id IS NULL;

ALTER TABLE public.zonas ALTER COLUMN usuario_id SET NOT NULL;

DO $$ BEGIN
    ALTER TABLE public.zonas
        ADD CONSTRAINT zonas_usuario_id_fkey
        FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.zonas
        ADD CONSTRAINT zonas_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES public.usuarios(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.zonas
        ADD CONSTRAINT zonas_updated_by_fkey
        FOREIGN KEY (updated_by) REFERENCES public.usuarios(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_zonas_usuario_id ON public.zonas USING btree (usuario_id);
CREATE INDEX IF NOT EXISTS idx_zonas_updated_at ON public.zonas USING btree (updated_at);

DROP TRIGGER IF EXISTS trg_zonas_updated_at ON public.zonas;
CREATE TRIGGER trg_zonas_updated_at
    BEFORE UPDATE ON public.zonas
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ================================================================
-- MODIFICAR: parcelas — usuario_id + auditoría + propietario nullable
-- ================================================================
ALTER TABLE public.parcelas
    ADD COLUMN IF NOT EXISTS usuario_id   INTEGER,
    ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS created_by   INTEGER,
    ADD COLUMN IF NOT EXISTS updated_by   INTEGER,
    ADD COLUMN IF NOT EXISTS area_cuadras DOUBLE PRECISION;

-- Asignar admin a filas existentes sin usuario
UPDATE public.parcelas
SET usuario_id = (SELECT id FROM public.usuarios WHERE rol = 'administrador' LIMIT 1),
    created_by = (SELECT id FROM public.usuarios WHERE rol = 'administrador' LIMIT 1)
WHERE usuario_id IS NULL;

ALTER TABLE public.parcelas ALTER COLUMN usuario_id SET NOT NULL;
ALTER TABLE public.parcelas ALTER COLUMN propietario DROP NOT NULL;

-- Auto-rellenar propietario vacío desde el usuario propietario
UPDATE public.parcelas p
SET propietario = (
    SELECT u.nombres || ' ' || u.apellidos
    FROM public.usuarios u WHERE u.id = p.usuario_id
)
WHERE propietario IS NULL OR propietario = '';

DO $$ BEGIN
    ALTER TABLE public.parcelas
        ADD CONSTRAINT parcelas_usuario_id_fkey
        FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.parcelas
        ADD CONSTRAINT parcelas_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES public.usuarios(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.parcelas
        ADD CONSTRAINT parcelas_updated_by_fkey
        FOREIGN KEY (updated_by) REFERENCES public.usuarios(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_parcelas_usuario_id ON public.parcelas USING btree (usuario_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_updated_at ON public.parcelas USING btree (updated_at);

DROP TRIGGER IF EXISTS trg_parcelas_updated_at ON public.parcelas;
CREATE TRIGGER trg_parcelas_updated_at
    BEFORE UPDATE ON public.parcelas
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ================================================================
-- MODIFICAR: capas_parcela — auditoría
-- ================================================================
ALTER TABLE public.capas_parcela
    ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS created_by  INTEGER,
    ADD COLUMN IF NOT EXISTS updated_by  INTEGER;

DO $$ BEGIN
    ALTER TABLE public.capas_parcela
        ADD CONSTRAINT capas_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES public.usuarios(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.capas_parcela
        ADD CONSTRAINT capas_updated_by_fkey
        FOREIGN KEY (updated_by) REFERENCES public.usuarios(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_capas_updated_at ON public.capas_parcela USING btree (updated_at);

DROP TRIGGER IF EXISTS trg_capas_updated_at ON public.capas_parcela;
CREATE TRIGGER trg_capas_updated_at
    BEFORE UPDATE ON public.capas_parcela
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ================================================================
-- MODIFICAR: actividades_parcela — auditoría
-- ================================================================
ALTER TABLE public.actividades_parcela
    ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS created_by  INTEGER,
    ADD COLUMN IF NOT EXISTS updated_by  INTEGER;

DO $$ BEGIN
    ALTER TABLE public.actividades_parcela
        ADD CONSTRAINT actividades_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES public.usuarios(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.actividades_parcela
        ADD CONSTRAINT actividades_updated_by_fkey
        FOREIGN KEY (updated_by) REFERENCES public.usuarios(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_actividades_updated_at ON public.actividades_parcela USING btree (updated_at);

DROP TRIGGER IF EXISTS trg_actividades_updated_at ON public.actividades_parcela;
CREATE TRIGGER trg_actividades_updated_at
    BEFORE UPDATE ON public.actividades_parcela
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ================================================================
-- MODIFICAR: ciclos_actividad — auditoría
-- ================================================================
ALTER TABLE public.ciclos_actividad
    ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS created_by  INTEGER,
    ADD COLUMN IF NOT EXISTS updated_by  INTEGER;

DO $$ BEGIN
    ALTER TABLE public.ciclos_actividad
        ADD CONSTRAINT ciclos_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES public.usuarios(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.ciclos_actividad
        ADD CONSTRAINT ciclos_updated_by_fkey
        FOREIGN KEY (updated_by) REFERENCES public.usuarios(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_ciclos_updated_at ON public.ciclos_actividad USING btree (updated_at);

DROP TRIGGER IF EXISTS trg_ciclos_updated_at ON public.ciclos_actividad;
CREATE TRIGGER trg_ciclos_updated_at
    BEFORE UPDATE ON public.ciclos_actividad
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ================================================================
-- MODIFICAR: productos_actividad — updated_at
-- ================================================================
ALTER TABLE public.productos_actividad
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_productos_updated_at ON public.productos_actividad USING btree (updated_at);

DROP TRIGGER IF EXISTS trg_productos_updated_at ON public.productos_actividad;
CREATE TRIGGER trg_productos_updated_at
    BEFORE UPDATE ON public.productos_actividad
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

COMMIT;
