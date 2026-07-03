-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN GEO-RICE → managerice_db
-- Crea las tablas de MagnaRice (IF NOT EXISTS) y las tablas geo de Tesis-Geo.
-- Es idempotente: si MagnaRice ya creó usuarios/socios, IF NOT EXISTS las omite.
--
-- Ejecutar: psql -U managerice -d managerice_db -h localhost -p 5432 -f schema_managerice.sql
-- ═══════════════════════════════════════════════════════════════════════════

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


-- ═══════════════════════════════════════════════════════════════════════════
-- EXTENSIÓN POSTGIS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


-- ═══════════════════════════════════════════════════════════════════════════
-- ENUMs DE MAGNARICE
-- Si ya existen (creados por MagnaRice), la excepción se ignora silenciosamente.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$ BEGIN CREATE TYPE "RolSocio" AS ENUM ('PRESIDENTE','SECRETARIA','TESORERO','VOCAL','SOCIO','INDEPENDIENTE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "NivelAcceso" AS ENUM ('ADMIN','DIRECTIVO','MIEMBRO','SOLO_VISTA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "EstadoSocio" AS ENUM ('ACTIVO','INACTIVO','SUSPENDIDO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "TipoDocumento" AS ENUM ('RESOLUCION','OFICIO','CERTIFICADO','SOLICITUD','ACTA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "EstadoDocumento" AS ENUM ('ACTIVO','ENVIADO','EMITIDO','ARCHIVADO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "TipoReunion" AS ENUM ('ORDINARIA','EXTRAORDINARIA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "ModalidadReunion" AS ENUM ('PRESENCIAL','VIRTUAL','MIXTA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "EstadoReunion" AS ENUM ('PROGRAMADA','EN_CURSO','FINALIZADA','CANCELADA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "EstadoMulta" AS ENUM ('PENDIENTE','PAGADA','EXONERADA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- TABLAS DE MAGNARICE  (estructura exacta de su migración Prisma)
-- IF NOT EXISTS → si MagnaRice ya las creó, no se toca nada.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "usuarios" (
    "id"        TEXT         NOT NULL,
    "email"     TEXT         NOT NULL,
    "password"  TEXT         NOT NULL,
    "nombre"    TEXT         NOT NULL,
    "apellido"  TEXT         NOT NULL,
    "activo"    BOOLEAN      NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "usuarios_email_key" ON "usuarios"("email");

CREATE TABLE IF NOT EXISTS "socios" (
    "id"           TEXT          NOT NULL,
    "cedula"       VARCHAR(10)   NOT NULL,
    "nombre"       TEXT          NOT NULL,
    "apellido"     TEXT          NOT NULL,
    "email"        TEXT,
    "telefono"     TEXT          NOT NULL DEFAULT '',
    "direccion"    TEXT,
    "rol"          "RolSocio"    NOT NULL DEFAULT 'SOCIO',
    "nivelAcceso"  "NivelAcceso" NOT NULL DEFAULT 'MIEMBRO',
    "estado"       "EstadoSocio" NOT NULL DEFAULT 'ACTIVO',
    "fechaIngreso" TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt"    TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId"    TEXT,
    CONSTRAINT "socios_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "socios_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "socios_cedula_key"    ON "socios"("cedula");
CREATE UNIQUE INDEX IF NOT EXISTS "socios_email_key"     ON "socios"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "socios_usuarioId_key" ON "socios"("usuarioId");


-- ═══════════════════════════════════════════════════════════════════════════
-- FUNCIONES DE TESIS-GEO
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.fn_set_updated_at() RETURNS trigger
    LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_asignar_numero_actividad() RETURNS trigger
    LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.ciclo_id IS NOT NULL AND NEW.numero_actividad IS NULL THEN
        SELECT COALESCE(MAX(numero_actividad), 0) + 1
        INTO NEW.numero_actividad
        FROM public.actividades_parcela
        WHERE ciclo_id = NEW.ciclo_id;
    ELSIF NEW.ciclo_id IS NULL AND NEW.numero_actividad IS NULL THEN
        SELECT COALESCE(MAX(numero_actividad), 0) + 1
        INTO NEW.numero_actividad
        FROM public.actividades_parcela
        WHERE parcela_id = NEW.parcela_id AND ciclo_id IS NULL;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_recalcular_costo_total() RETURNS trigger
    LANGUAGE plpgsql AS $$
BEGIN
    NEW.costo_total_actividad :=
        COALESCE(NEW.costo_mano_obra,   0) +
        COALESCE(NEW.costo_maquinaria,  0) +
        COALESCE(NEW.costo_insumos,     0) +
        COALESCE(NEW.costo_sembradores, 0);
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_recalcular_costo_producto() RETURNS trigger
    LANGUAGE plpgsql AS $_$
DECLARE
    precio_por_unidad_base NUMERIC;
BEGIN
    IF NEW.presentacion_ml IS NOT NULL AND NEW.precio_presentacion IS NOT NULL AND NEW.presentacion_ml > 0 THEN
        precio_por_unidad_base := NEW.precio_presentacion / (NEW.presentacion_ml::NUMERIC / 1000);
        NEW.precio_unitario := ROUND(precio_por_unidad_base, 4);
        IF NEW.dosis_total IS NOT NULL THEN
            NEW.frascos_usados := ROUND(NEW.dosis_total / (NEW.presentacion_ml::NUMERIC / 1000), 4);
        END IF;
    END IF;
    IF NEW.dosis_total IS NOT NULL AND NEW.precio_unitario IS NOT NULL THEN
        NEW.costo_total := ROUND(NEW.dosis_total * NEW.precio_unitario, 2);
    END IF;
    RETURN NEW;
END;
$_$;

CREATE OR REPLACE FUNCTION public.fn_asignar_fase() RETURNS trigger
    LANGUAGE plpgsql AS $$
DECLARE
    v_tipo_ciclo      VARCHAR(20);
    v_orden           INTEGER;
    v_fase_id         INTEGER;
    v_tipos_ambiguos  VARCHAR(30)[] := ARRAY['riego','fertilizacion','fumigacion','soca_riego','soca_fumigacion'];
BEGIN
    SELECT tipo INTO v_tipo_ciclo FROM ciclos_actividad WHERE id = NEW.ciclo_id;
    IF v_tipo_ciclo IS NULL THEN
        RAISE EXCEPTION 'No se encontró el ciclo_id % o no tiene tipo definido', NEW.ciclo_id;
    END IF;

    v_orden := NEW.orden_plantilla;

    IF v_orden IS NULL THEN
        IF NEW.tipo = ANY(v_tipos_ambiguos) THEN
            RAISE EXCEPTION 'orden_plantilla es obligatorio para actividades de tipo "%" (ciclo "%")',
                NEW.tipo, v_tipo_ciclo;
        END IF;
        SELECT orden INTO v_orden
        FROM plantillas_ciclo
        WHERE tipo_ciclo = v_tipo_ciclo AND tipo_actividad = NEW.tipo
        ORDER BY orden LIMIT 1;
        IF v_orden IS NULL THEN
            RAISE EXCEPTION 'Tipo de actividad "%" no existe en plantillas_ciclo para ciclo "%"',
                NEW.tipo, v_tipo_ciclo;
        END IF;
        NEW.orden_plantilla := v_orden;
    END IF;

    SELECT id INTO v_fase_id
    FROM fases_ciclo
    WHERE tipo_ciclo = v_tipo_ciclo AND v_orden BETWEEN orden_min AND orden_max
    LIMIT 1;

    IF v_fase_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró fase en fases_ciclo para tipo_ciclo="%" orden=%',
            v_tipo_ciclo, v_orden;
    END IF;

    NEW.fase_id := v_fase_id;
    RETURN NEW;
END;
$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- TABLAS GEO DE TESIS-GEO
-- usuario_id / created_by / updated_by son TEXT → FK a "usuarios"."id" (TEXT)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.refresh_tokens (
    id          SERIAL       PRIMARY KEY,
    usuario_id  TEXT         NOT NULL REFERENCES "usuarios"("id") ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMP    NOT NULL,
    creado_en   TIMESTAMP    DEFAULT now(),
    revocado    BOOLEAN      DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.zonas (
    id             SERIAL       PRIMARY KEY,
    nombre         VARCHAR(100) NOT NULL,
    descripcion    TEXT,
    geometria      public.geometry(Polygon,4326),
    fecha_creacion TIMESTAMP    DEFAULT now(),
    usuario_id     TEXT         NOT NULL REFERENCES "usuarios"("id") ON DELETE RESTRICT,
    updated_at     TIMESTAMP    DEFAULT now(),
    created_by     TEXT         REFERENCES "usuarios"("id") ON DELETE SET NULL,
    updated_by     TEXT         REFERENCES "usuarios"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.parcelas (
    id             SERIAL       PRIMARY KEY,
    nombre         VARCHAR(100),
    propietario    VARCHAR(100),
    cultivo        VARCHAR(50),
    geometria      public.geometry(Polygon,4326),
    fecha_creacion TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    estado         VARCHAR(20)  DEFAULT 'activo',
    zona_id        INTEGER      REFERENCES public.zonas(id) ON DELETE SET NULL,
    ciclo_actual   VARCHAR(20)  DEFAULT 'siembra_normal_boleo',
    area_ha        DOUBLE PRECISION,
    area_cuadras   DOUBLE PRECISION,
    usuario_id     TEXT         NOT NULL REFERENCES "usuarios"("id") ON DELETE RESTRICT,
    updated_at     TIMESTAMP    DEFAULT now(),
    created_by     TEXT         REFERENCES "usuarios"("id") ON DELETE SET NULL,
    updated_by     TEXT         REFERENCES "usuarios"("id") ON DELETE SET NULL,
    CONSTRAINT parcelas_ciclo_actual_check CHECK (ciclo_actual IN (
        'siembra_normal_boleo','siembra_normal_trasplante','soca','resoca','en_preparacion')),
    CONSTRAINT parcelas_estado_check CHECK (estado IN (
        'activo','descanso','cosechado','preparacion'))
);

CREATE TABLE IF NOT EXISTS public.capas_parcela (
    id                  SERIAL  PRIMARY KEY,
    parcela_id          INTEGER NOT NULL REFERENCES public.parcelas(id) ON DELETE CASCADE,
    tipo                VARCHAR(20) NOT NULL,
    geometria           public.geometry(Geometry,4326) NOT NULL,
    ndvi_estimado       NUMERIC(4,2),
    fecha_actualizacion TIMESTAMP DEFAULT now(),
    updated_at          TIMESTAMP DEFAULT now(),
    created_by          TEXT REFERENCES "usuarios"("id") ON DELETE SET NULL,
    updated_by          TEXT REFERENCES "usuarios"("id") ON DELETE SET NULL,
    CONSTRAINT capas_parcela_ndvi_estimado_check CHECK (ndvi_estimado >= 0 AND ndvi_estimado <= 1),
    CONSTRAINT capas_parcela_tipo_check CHECK (tipo IN ('activo','descanso','lindero'))
);

CREATE TABLE IF NOT EXISTS public.fases_ciclo (
    id              SERIAL       PRIMARY KEY,
    codigo          VARCHAR(5)   NOT NULL,
    nombre          VARCHAR(100) NOT NULL,
    tipo_ciclo      VARCHAR(20)  NOT NULL,
    orden_fase      INTEGER      NOT NULL,
    orden_min       INTEGER      NOT NULL,
    orden_max       INTEGER      NOT NULL,
    tipos_actividad VARCHAR(30)[] NOT NULL,
    descripcion     TEXT,
    created_at      TIMESTAMP    DEFAULT now(),
    CONSTRAINT chk_fases_orden_rango CHECK (orden_min <= orden_max),
    CONSTRAINT chk_fases_tipo_ciclo  CHECK (tipo_ciclo IN (
        'siembra_boleo','siembra_trasplante','soca','resoca')),
    CONSTRAINT uq_fases_codigo_tipo  UNIQUE (codigo, tipo_ciclo)
);

CREATE TABLE IF NOT EXISTS public.ciclos_actividad (
    id               SERIAL      PRIMARY KEY,
    parcela_id       INTEGER     NOT NULL REFERENCES public.parcelas(id) ON DELETE CASCADE,
    tipo             VARCHAR(30) NOT NULL,
    estado           VARCHAR(20) NOT NULL DEFAULT 'activo',
    fecha_inicio     TIMESTAMP   NOT NULL,
    fecha_fin        TIMESTAMP,
    variedad_semilla VARCHAR(100),
    area_sembrada    NUMERIC(10,2),
    observaciones    TEXT,
    fecha_registro   TIMESTAMP   DEFAULT now(),
    updated_at       TIMESTAMP   DEFAULT now(),
    created_by       TEXT        REFERENCES "usuarios"("id") ON DELETE SET NULL,
    updated_by       TEXT        REFERENCES "usuarios"("id") ON DELETE SET NULL,
    CONSTRAINT chk_ciclos_tipo CHECK (tipo IN (
        'siembra_boleo','siembra_trasplante','soca','resoca'))
);

CREATE TABLE IF NOT EXISTS public.plantillas_ciclo (
    id                SERIAL      PRIMARY KEY,
    tipo_ciclo        VARCHAR(20) NOT NULL,
    tipo_actividad    VARCHAR(30) NOT NULL,
    orden             INTEGER     NOT NULL,
    dias_desde_inicio INTEGER     NOT NULL,
    descripcion       TEXT,
    obligatoria       BOOLEAN     NOT NULL DEFAULT true,
    CONSTRAINT chk_plantillas_tipo_ciclo CHECK (tipo_ciclo IN (
        'siembra_boleo','siembra_trasplante','soca','resoca')),
    CONSTRAINT uq_plantillas_tipo_orden UNIQUE (tipo_ciclo, orden)
);

CREATE TABLE IF NOT EXISTS public.actividades_parcela (
    id                    SERIAL      PRIMARY KEY,
    parcela_id            INTEGER     NOT NULL REFERENCES public.parcelas(id) ON DELETE CASCADE,
    capa_id               INTEGER     REFERENCES public.capas_parcela(id) ON DELETE SET NULL,
    tipo                  VARCHAR(30) NOT NULL,
    fecha                 TIMESTAMP   NOT NULL DEFAULT now(),
    insumo                VARCHAR(100),
    cantidad              NUMERIC(10,2),
    unidad                VARCHAR(20),
    rendimiento_ha        NUMERIC(10,2),
    observaciones         TEXT,
    fecha_registro        TIMESTAMP   DEFAULT now(),
    metodo                VARCHAR(50),
    lamina_agua           NUMERIC(8,2),
    humedad               NUMERIC(5,2),
    nivel_alerta          VARCHAR(20) DEFAULT 'normal',
    precio_qq             NUMERIC(10,2),
    total_sacos           NUMERIC(10,2),
    destino               VARCHAR(50),
    costo_cosecha         NUMERIC(10,2),
    ingreso_total         NUMERIC(10,2),
    plaga_detectada       VARCHAR(100),
    nivel_dano            VARCHAR(20),
    capacidad_tanque      NUMERIC(8,2) DEFAULT 200,
    num_tanques           NUMERIC(6,2),
    num_jornales          INTEGER,
    pago_jornal           NUMERIC(10,2),
    costo_mano_obra       NUMERIC(10,2),
    ciclo_id              INTEGER     REFERENCES public.ciclos_actividad(id) ON DELETE CASCADE,
    estado                VARCHAR(20) DEFAULT 'pendiente',
    fecha_inicio          TIMESTAMP,
    fecha_fin             TIMESTAMP,
    tipo_maquinaria       VARCHAR(50),
    unidad_cobro          VARCHAR(20),
    cantidad_unidades     NUMERIC(8,2),
    costo_por_unidad      NUMERIC(10,2),
    costo_maquinaria      NUMERIC(10,2),
    updated_at            TIMESTAMP   DEFAULT now(),
    created_by            TEXT        REFERENCES "usuarios"("id") ON DELETE SET NULL,
    updated_by            TEXT        REFERENCES "usuarios"("id") ON DELETE SET NULL,
    numero_actividad      INTEGER,
    costo_insumos         NUMERIC(10,2),
    costo_total_actividad NUMERIC(10,2),
    unidad_mano_obra      VARCHAR(20),
    cantidad_unidad_mo    NUMERIC(10,2),
    precio_unidad_mo      NUMERIC(10,2),
    num_trabajadores      INTEGER,
    descripcion_unidad_mo VARCHAR(100),
    num_tareas            NUMERIC(8,2),
    precio_tarea          NUMERIC(10,2),
    costo_sembradores     NUMERIC(10,2),
    orden_plantilla       INTEGER,
    fase_id               INTEGER     REFERENCES public.fases_ciclo(id),
    CONSTRAINT actividades_parcela_tipo_check CHECK (tipo IN (
        'preparacion_suelo','inundacion','siembra_boleo','siembra_trasplante',
        'riego','fertilizacion','fumigacion','deshierba','cosecha','rozar_quemar',
        'soca_riego','soca_fertilizacion','soca_fumigacion','cosecha_soca','observacion')),
    CONSTRAINT actividades_parcela_destino_check CHECK (destino IN (
        'piladora','almacen','directo','otro')),
    CONSTRAINT actividades_parcela_nivel_dano_check CHECK (nivel_dano IN (
        'leve','moderado','severo')),
    CONSTRAINT actividades_unidad_mo_check CHECK (unidad_mano_obra IN (
        'jornal','tanque','saco','tarea','otro'))
);

CREATE TABLE IF NOT EXISTS public.productos_actividad (
    id                   SERIAL  PRIMARY KEY,
    actividad_id         INTEGER NOT NULL REFERENCES public.actividades_parcela(id) ON DELETE CASCADE,
    nombre               VARCHAR(100) NOT NULL,
    tipo                 VARCHAR(50),
    dosis                NUMERIC(10,4),
    unidad               VARCHAR(20),
    fecha_registro       TIMESTAMP DEFAULT now(),
    dosis_por_tanque     NUMERIC(10,4),
    dosis_total          NUMERIC(10,4),
    updated_at           TIMESTAMP DEFAULT now(),
    precio_unitario      NUMERIC(10,2),
    costo_total          NUMERIC(10,2),
    dosis_ha             NUMERIC(10,4),
    presentacion_ml      INTEGER,
    precio_presentacion  NUMERIC(10,2),
    frascos_usados       NUMERIC(10,4),
    dosis_por_unidad_mo  NUMERIC(10,4),
    CONSTRAINT productos_actividad_tipo_check CHECK (tipo IN (
        'herbicida','fungicida','insecticida','fertilizante',
        'abono','corrector','bioestimulante','otro'))
);


-- ═══════════════════════════════════════════════════════════════════════════
-- ÍNDICES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash     ON public.refresh_tokens      (token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_usuario  ON public.refresh_tokens      (usuario_id);
CREATE INDEX IF NOT EXISTS idx_zonas_usuario_id        ON public.zonas               (usuario_id);
CREATE INDEX IF NOT EXISTS idx_zonas_geometria         ON public.zonas               USING GIST (geometria);
CREATE INDEX IF NOT EXISTS idx_zonas_updated_at        ON public.zonas               (updated_at);
CREATE INDEX IF NOT EXISTS idx_parcelas_usuario_id     ON public.parcelas            (usuario_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_geometria      ON public.parcelas            USING GIST (geometria);
CREATE INDEX IF NOT EXISTS idx_parcelas_updated_at     ON public.parcelas            (updated_at);
CREATE INDEX IF NOT EXISTS idx_capas_parcela_id        ON public.capas_parcela       (parcela_id);
CREATE INDEX IF NOT EXISTS idx_capas_parcela_geometria ON public.capas_parcela       USING GIST (geometria);
CREATE INDEX IF NOT EXISTS idx_capas_updated_at        ON public.capas_parcela       (updated_at);
CREATE INDEX IF NOT EXISTS idx_ciclos_updated_at       ON public.ciclos_actividad    (updated_at);
CREATE INDEX IF NOT EXISTS idx_actividades_parcela_id  ON public.actividades_parcela (parcela_id);
CREATE INDEX IF NOT EXISTS idx_actividades_ciclo_num   ON public.actividades_parcela (ciclo_id, numero_actividad);
CREATE INDEX IF NOT EXISTS idx_actividades_estado      ON public.actividades_parcela (estado);
CREATE INDEX IF NOT EXISTS idx_actividades_fase        ON public.actividades_parcela (fase_id);
CREATE INDEX IF NOT EXISTS idx_actividades_updated_at  ON public.actividades_parcela (updated_at);
CREATE INDEX IF NOT EXISTS idx_productos_actividad_id  ON public.productos_actividad (actividad_id);
CREATE INDEX IF NOT EXISTS idx_productos_updated_at    ON public.productos_actividad (updated_at);


-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_zonas_updated_at        ON public.zonas;
DROP TRIGGER IF EXISTS trg_parcelas_updated_at     ON public.parcelas;
DROP TRIGGER IF EXISTS trg_capas_updated_at        ON public.capas_parcela;
DROP TRIGGER IF EXISTS trg_ciclos_updated_at       ON public.ciclos_actividad;
DROP TRIGGER IF EXISTS trg_actividades_updated_at  ON public.actividades_parcela;
DROP TRIGGER IF EXISTS trg_productos_updated_at    ON public.productos_actividad;
DROP TRIGGER IF EXISTS trg_asignar_fase            ON public.actividades_parcela;
DROP TRIGGER IF EXISTS trg_costo_total             ON public.actividades_parcela;
DROP TRIGGER IF EXISTS trg_numero_actividad        ON public.actividades_parcela;
DROP TRIGGER IF EXISTS trg_costo_producto          ON public.productos_actividad;

CREATE TRIGGER trg_zonas_updated_at       BEFORE UPDATE ON public.zonas               FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_parcelas_updated_at    BEFORE UPDATE ON public.parcelas             FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_capas_updated_at       BEFORE UPDATE ON public.capas_parcela        FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_ciclos_updated_at      BEFORE UPDATE ON public.ciclos_actividad     FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_actividades_updated_at BEFORE UPDATE ON public.actividades_parcela  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_productos_updated_at   BEFORE UPDATE ON public.productos_actividad  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_asignar_fase           BEFORE INSERT OR UPDATE OF tipo, ciclo_id, orden_plantilla
    ON public.actividades_parcela FOR EACH ROW EXECUTE FUNCTION public.fn_asignar_fase();
CREATE TRIGGER trg_costo_total            BEFORE INSERT OR UPDATE ON public.actividades_parcela FOR EACH ROW EXECUTE FUNCTION public.fn_recalcular_costo_total();
CREATE TRIGGER trg_numero_actividad       BEFORE INSERT ON public.actividades_parcela  FOR EACH ROW EXECUTE FUNCTION public.fn_asignar_numero_actividad();
CREATE TRIGGER trg_costo_producto         BEFORE INSERT OR UPDATE ON public.productos_actividad FOR EACH ROW EXECUTE FUNCTION public.fn_recalcular_costo_producto();


-- ═══════════════════════════════════════════════════════════════════════════
-- VISTA DE COSTOS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.v_costos_actividad AS
SELECT
    id, ciclo_id, parcela_id,
    numero_actividad AS num,
    tipo, estado, fecha_inicio, fecha_fin,
    num_trabajadores, unidad_mano_obra, cantidad_unidad_mo, precio_unidad_mo,
    COALESCE(costo_mano_obra,   0) AS costo_mano_obra,
    tipo_maquinaria, unidad_cobro, cantidad_unidades, costo_por_unidad,
    COALESCE(costo_maquinaria,  0) AS costo_maquinaria,
    COALESCE(costo_insumos,     0) AS costo_insumos,
    COALESCE(costo_sembradores, 0) AS costo_sembradores,
    COALESCE(costo_total_actividad, 0) AS costo_total,
    COALESCE((
        SELECT json_agg(json_build_object(
            'nombre', p.nombre, 'tipo', p.tipo,
            'dosis_total', p.dosis_total, 'unidad', p.unidad,
            'precio_unitario', p.precio_unitario, 'costo_total', p.costo_total
        ))
        FROM public.productos_actividad p
        WHERE p.actividad_id = a.id
    ), '[]'::json) AS productos
FROM public.actividades_parcela a;


-- ═══════════════════════════════════════════════════════════════════════════
-- PERMISOS
-- ═══════════════════════════════════════════════════════════════════════════

GRANT ALL ON ALL TABLES    IN SCHEMA public TO managerice;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO managerice;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO managerice;