--
-- PostgreSQL database dump
--


-- Dumped from database version 17.9
-- Dumped by pg_dump version 17.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';







--
-- Name: EstadoSocio; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EstadoSocio" AS ENUM (
    'ACTIVO',
    'INACTIVO',
    'SUSPENDIDO'
);






--
-- Name: NivelAcceso; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."NivelAcceso" AS ENUM (
    'ADMIN',
    'DIRECTIVO',
    'MIEMBRO',
    'SOLO_VISTA'
);



--
-- Name: RolSocio; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RolSocio" AS ENUM (
    'PRESIDENTE',
    'SECRETARIA',
    'TESORERO',
    'VOCAL',
    'SOCIO',
    'INDEPENDIENTE'
);






--
-- Name: fn_asignar_fase(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_asignar_fase() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_tipo_ciclo      VARCHAR(20);
    v_orden           INTEGER;
    v_fase_id         INTEGER;
    v_tipos_ambiguos  VARCHAR(30)[] := ARRAY['riego', 'fertilizacion', 'fumigacion', 'soca_riego', 'soca_fumigacion'];
BEGIN
    -- 1. Obtener el tipo de ciclo padre
    SELECT tipo INTO v_tipo_ciclo
    FROM ciclos_actividad
    WHERE id = NEW.ciclo_id;

    IF v_tipo_ciclo IS NULL THEN
        RAISE EXCEPTION 'No se encontró el ciclo_id % o no tiene tipo definido', NEW.ciclo_id;
    END IF;

    -- 2. Resolver el orden_plantilla a usar
    v_orden := NEW.orden_plantilla;

    IF v_orden IS NULL THEN
        -- Tipos ambiguos: el orden_plantilla es obligatorio, no se puede inferir
        IF NEW.tipo = ANY(v_tipos_ambiguos) THEN
            RAISE EXCEPTION
                'orden_plantilla es obligatorio para actividades de tipo "%" (se repite en la plantilla del ciclo "%" y la fase no puede determinarse solo por el tipo)',
                NEW.tipo, v_tipo_ciclo;
        END IF;

        -- Tipos no ambiguos: buscar la primera (única) ocurrencia en plantillas_ciclo
        SELECT orden INTO v_orden
        FROM plantillas_ciclo
        WHERE tipo_ciclo = v_tipo_ciclo
          AND tipo_actividad = NEW.tipo
        ORDER BY orden
        LIMIT 1;

        IF v_orden IS NULL THEN
            RAISE EXCEPTION
                'El tipo de actividad "%" no existe en plantillas_ciclo para el tipo de ciclo "%". Revisar PLANTILLAS_CICLO (PlantillaCiclo.ts) y la tabla plantillas_ciclo.',
                NEW.tipo, v_tipo_ciclo;
        END IF;

        NEW.orden_plantilla := v_orden;
    END IF;

    -- 3. Buscar la fase cuyo rango [orden_min, orden_max] contiene v_orden
    SELECT id INTO v_fase_id
    FROM fases_ciclo
    WHERE tipo_ciclo = v_tipo_ciclo
      AND v_orden BETWEEN orden_min AND orden_max
    LIMIT 1;

    IF v_fase_id IS NULL THEN
        RAISE EXCEPTION
            'No se encontró una fase en fases_ciclo para tipo_ciclo="%" con orden=%. Revisar los rangos orden_min/orden_max configurados.',
            v_tipo_ciclo, v_orden;
    END IF;

    NEW.fase_id := v_fase_id;

    RETURN NEW;
END;
$$;



--
-- Name: FUNCTION fn_asignar_fase(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_asignar_fase() IS 'Asigna fase_id en actividades_parcela según el tipo_ciclo del ciclo padre y el orden_plantilla de la actividad (explícito o resuelto desde plantillas_ciclo si el tipo no es ambiguo).';


--
-- Name: fn_asignar_numero_actividad(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_asignar_numero_actividad() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
        WHERE parcela_id = NEW.parcela_id
          AND ciclo_id IS NULL;
    END IF;
    RETURN NEW;
END;
$$;



--
-- Name: fn_calcular_costo_mano_obra(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_calcular_costo_mano_obra() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Costo por jornales o por unidad (saco/tanque/tarea genérica)
    IF NEW.cantidad_unidad_mo IS NOT NULL AND NEW.precio_unidad_mo IS NOT NULL THEN
        NEW.costo_mano_obra := ROUND(NEW.cantidad_unidad_mo * NEW.precio_unidad_mo, 2);
    ELSIF NEW.num_jornales IS NOT NULL AND NEW.pago_jornal IS NOT NULL THEN
        NEW.costo_mano_obra := ROUND(NEW.num_jornales * NEW.pago_jornal, 2);
    END IF;

    -- Costo de sembradores (tareas), independiente del costo_mano_obra general
    IF NEW.num_tareas IS NOT NULL AND NEW.precio_tarea IS NOT NULL THEN
        NEW.costo_sembradores := ROUND(NEW.num_tareas * NEW.precio_tarea, 2);
    END IF;

    -- Reparto entre trabajadores: toma el costo relevante (mano_obra o sembradores)
    IF NEW.num_trabajadores IS NOT NULL AND NEW.num_trabajadores > 0 THEN
        IF NEW.costo_mano_obra IS NOT NULL THEN
            NEW.pago_por_trabajador := ROUND(NEW.costo_mano_obra / NEW.num_trabajadores, 2);
        ELSIF NEW.costo_sembradores IS NOT NULL THEN
            NEW.pago_por_trabajador := ROUND(NEW.costo_sembradores / NEW.num_trabajadores, 2);
        END IF;
    END IF;

    RETURN NEW;
END;
$$;



--
-- Name: fn_calcular_costo_maquinaria(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_calcular_costo_maquinaria() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.cantidad_unidades IS NOT NULL AND NEW.costo_por_unidad IS NOT NULL THEN
        NEW.costo_maquinaria := ROUND(NEW.cantidad_unidades * NEW.costo_por_unidad, 2);
    END IF;
    RETURN NEW;
END;
$$;



--
-- Name: fn_recalcular_costo_producto(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_recalcular_costo_producto() RETURNS trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    precio_por_unidad_base NUMERIC;
BEGIN
    -- ── FERTILIZANTES/ABONOS: cálculo por saco ───────────────────────────
    -- precio_presentacion = precio por saco ($)
    -- dosis_total         = sacos echados en esta actividad
    -- costo_total         = sacos_echados × precio_saco
    -- precio_unitario     = precio por saco (referencia)
    -- frascos_usados      = sacos echados (misma cantidad)
    IF NEW.tipo IN ('fertilizante', 'abono') THEN
        IF NEW.dosis_total IS NOT NULL AND NEW.precio_presentacion IS NOT NULL THEN
            NEW.precio_unitario := NEW.precio_presentacion;
            NEW.frascos_usados  := NEW.dosis_total;
            NEW.costo_total     := ROUND(NEW.dosis_total * NEW.precio_presentacion, 2);
        END IF;
        RETURN NEW;
    END IF;

    -- ── FUMIGACIÓN/OTROS: cálculo por presentación (ml/L) ────────────────
    -- precio_presentacion = precio del frasco/litro
    -- presentacion_ml     = tamaño del frasco en ml
    -- precio_unitario     = precio por litro calculado
    -- dosis_total         = litros aplicados
    -- frascos_usados      = frascos necesarios
    -- costo_total         = dosis_total × precio_unitario
    IF NEW.presentacion_ml IS NOT NULL AND NEW.precio_presentacion IS NOT NULL AND NEW.presentacion_ml > 0 THEN
        precio_por_unidad_base := NEW.precio_presentacion / (NEW.presentacion_ml::NUMERIC / 1000);
        NEW.precio_unitario    := ROUND(precio_por_unidad_base, 4);

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



--
-- Name: fn_recalcular_costo_total(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_recalcular_costo_total() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.costo_total_actividad :=
        COALESCE(NEW.costo_mano_obra,   0) +
        COALESCE(NEW.costo_maquinaria,  0) +
        COALESCE(NEW.costo_insumos,     0) +
        COALESCE(NEW.costo_sembradores, 0);
    RETURN NEW;
END;
$$;



--
-- Name: fn_set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_set_updated_at() RETURNS trigger
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
-- Name: actividades_parcela; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.actividades_parcela (
    id integer NOT NULL,
    parcela_id integer NOT NULL,
    capa_id integer,
    tipo character varying(30) NOT NULL,
    fecha timestamp without time zone DEFAULT now() NOT NULL,
    insumo character varying(100),
    cantidad numeric(10,2),
    unidad character varying(20),
    rendimiento_ha numeric(10,2),
    observaciones text,
    fecha_registro timestamp without time zone DEFAULT now(),
    metodo character varying(50),
    lamina_agua numeric(8,2),
    humedad numeric(5,2),
    nivel_alerta character varying(20) DEFAULT 'normal'::character varying,
    precio_qq numeric(10,2),
    total_sacos numeric(10,2),
    destino character varying(50),
    costo_cosecha numeric(10,2),
    ingreso_total numeric(10,2),
    plaga_detectada character varying(100),
    nivel_dano character varying(20),
    capacidad_tanque numeric(8,2) DEFAULT 200,
    num_tanques numeric(6,2),
    num_jornales integer,
    pago_jornal numeric(10,2),
    costo_mano_obra numeric(10,2),
    ciclo_id integer,
    estado character varying(20) DEFAULT 'pendiente'::character varying,
    fecha_inicio timestamp without time zone,
    fecha_fin timestamp without time zone,
    tipo_maquinaria character varying(50),
    unidad_cobro character varying(20),
    cantidad_unidades numeric(8,2),
    costo_por_unidad numeric(10,2),
    costo_maquinaria numeric(10,2),
    updated_at timestamp without time zone DEFAULT now(),
    created_by integer,
    updated_by integer,
    numero_actividad integer,
    costo_insumos numeric(10,2),
    costo_total_actividad numeric(10,2),
    unidad_mano_obra character varying(20),
    cantidad_unidad_mo numeric(10,2),
    precio_unidad_mo numeric(10,2),
    num_trabajadores integer,
    descripcion_unidad_mo character varying(100),
    num_tareas numeric(8,2),
    precio_tarea numeric(10,2),
    costo_sembradores numeric(10,2),
    orden_plantilla integer,
    fase_id integer NOT NULL,
    CONSTRAINT actividades_parcela_destino_check CHECK (((destino)::text = ANY ((ARRAY['piladora'::character varying, 'almacen'::character varying, 'directo'::character varying, 'otro'::character varying])::text[]))),
    CONSTRAINT actividades_parcela_nivel_dano_check CHECK (((nivel_dano)::text = ANY ((ARRAY['leve'::character varying, 'moderado'::character varying, 'severo'::character varying])::text[]))),
    CONSTRAINT actividades_parcela_tipo_check CHECK (((tipo)::text = ANY (ARRAY[('preparacion_suelo'::character varying)::text, ('inundacion'::character varying)::text, ('siembra_boleo'::character varying)::text, ('siembra_trasplante'::character varying)::text, ('riego'::character varying)::text, ('fertilizacion'::character varying)::text, ('fumigacion'::character varying)::text, ('deshierba'::character varying)::text, ('cosecha'::character varying)::text, ('rozar_quemar'::character varying)::text, ('soca_riego'::character varying)::text, ('soca_fertilizacion'::character varying)::text, ('soca_fumigacion'::character varying)::text, ('cosecha_soca'::character varying)::text, ('observacion'::character varying)::text]))),
    CONSTRAINT actividades_unidad_mo_check CHECK (((unidad_mano_obra)::text = ANY ((ARRAY['jornal'::character varying, 'tanque'::character varying, 'saco'::character varying, 'tarea'::character varying, 'otro'::character varying])::text[])))
);



--
-- Name: COLUMN actividades_parcela.numero_actividad; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.actividades_parcela.numero_actividad IS 'Número secuencial dentro del ciclo (1,2,3...)';


--
-- Name: COLUMN actividades_parcela.costo_insumos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.actividades_parcela.costo_insumos IS 'Suma de costo_total de todos los productos';


--
-- Name: COLUMN actividades_parcela.costo_total_actividad; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.actividades_parcela.costo_total_actividad IS 'costo_mano_obra + costo_maquinaria + costo_insumos';


--
-- Name: COLUMN actividades_parcela.unidad_mano_obra; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.actividades_parcela.unidad_mano_obra IS 'jornal / tanque / saco / tarea / otro';


--
-- Name: COLUMN actividades_parcela.cantidad_unidad_mo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.actividades_parcela.cantidad_unidad_mo IS 'Total tanques, sacos, jornales o tareas';


--
-- Name: COLUMN actividades_parcela.precio_unidad_mo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.actividades_parcela.precio_unidad_mo IS '$ por tanque/saco/jornal/tarea';


--
-- Name: COLUMN actividades_parcela.num_trabajadores; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.actividades_parcela.num_trabajadores IS 'Número de personas que trabajaron';


--
-- Name: COLUMN actividades_parcela.descripcion_unidad_mo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.actividades_parcela.descripcion_unidad_mo IS 'Solo para unidad=otro: descripción libre';


--
-- Name: COLUMN actividades_parcela.num_tareas; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.actividades_parcela.num_tareas IS 'Calculado: area_ha × 16 (solo siembra_trasplante)';


--
-- Name: COLUMN actividades_parcela.precio_tarea; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.actividades_parcela.precio_tarea IS '$ por tarea (lo define el agricultor)';


--
-- Name: COLUMN actividades_parcela.costo_sembradores; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.actividades_parcela.costo_sembradores IS 'Total al grupo: num_tareas × precio_tarea';


--
-- Name: COLUMN actividades_parcela.orden_plantilla; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.actividades_parcela.orden_plantilla IS 'Orden dentro de PLANTILLAS_CICLO (PlantillaCiclo.ts) que originó esta actividad. Obligatorio para tipos ambiguos (riego, fertilizacion, fumigacion, soca_riego, soca_fumigacion) que se repiten en la plantilla con distinto orden.';


--
-- Name: COLUMN actividades_parcela.fase_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.actividades_parcela.fase_id IS 'Fase agrícola (F1-F6) asignada automáticamente por trg_asignar_fase según el tipo de ciclo y el orden_plantilla de la actividad.';


--
-- Name: actividades_parcela_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.actividades_parcela_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: actividades_parcela_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.actividades_parcela_id_seq OWNED BY public.actividades_parcela.id;


--
-- Name: capas_parcela; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.capas_parcela (
    id integer NOT NULL,
    parcela_id integer NOT NULL,
    tipo character varying(20) NOT NULL,
    geometria public.geometry(Geometry,4326) NOT NULL,
    ndvi_estimado numeric(4,2),
    fecha_actualizacion timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    created_by integer,
    updated_by integer,
    CONSTRAINT capas_parcela_ndvi_estimado_check CHECK (((ndvi_estimado >= (0)::numeric) AND (ndvi_estimado <= (1)::numeric))),
    CONSTRAINT capas_parcela_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['activo'::character varying, 'descanso'::character varying, 'lindero'::character varying])::text[])))
);



--
-- Name: capas_parcela_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.capas_parcela_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: capas_parcela_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.capas_parcela_id_seq OWNED BY public.capas_parcela.id;


--
-- Name: ciclos_actividad; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ciclos_actividad (
    id integer NOT NULL,
    parcela_id integer NOT NULL,
    tipo character varying(30) NOT NULL,
    estado character varying(20) DEFAULT 'activo'::character varying NOT NULL,
    fecha_inicio timestamp without time zone NOT NULL,
    fecha_fin timestamp without time zone,
    variedad_semilla character varying(100),
    area_sembrada numeric(10,2),
    observaciones text,
    fecha_registro timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    created_by integer,
    updated_by integer,
    CONSTRAINT chk_ciclos_tipo CHECK (((tipo)::text = ANY ((ARRAY['siembra_boleo'::character varying, 'siembra_trasplante'::character varying, 'soca'::character varying, 'resoca'::character varying])::text[])))
);



--
-- Name: ciclos_actividad_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ciclos_actividad_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: ciclos_actividad_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ciclos_actividad_id_seq OWNED BY public.ciclos_actividad.id;


--
-- Name: detalle_cosecha; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalle_cosecha (
    actividad_id integer NOT NULL,
    rendimiento_ha numeric(10,2),
    total_sacos numeric(10,2),
    humedad numeric(5,2),
    precio_qq numeric(10,2),
    ingreso_total numeric(12,2),
    costo_cosecha numeric(10,2),
    destino character varying(20),
    CONSTRAINT detalle_cosecha_destino_check CHECK (((destino)::text = ANY ((ARRAY['piladora'::character varying, 'almacen'::character varying, 'directo'::character varying, 'otro'::character varying])::text[])))
);



--
-- Name: TABLE detalle_cosecha; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.detalle_cosecha IS 'Datos específicos de actividades tipo cosecha/cosecha_soca';


--
-- Name: detalle_fertilizacion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalle_fertilizacion (
    actividad_id integer NOT NULL
);



--
-- Name: TABLE detalle_fertilizacion; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.detalle_fertilizacion IS 'Datos específicos de actividades tipo fertilizacion/soca_fertilizacion (reservada para futuras columnas)';


--
-- Name: detalle_fumigacion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalle_fumigacion (
    actividad_id integer NOT NULL,
    plaga_detectada character varying(100),
    nivel_dano character varying(20),
    capacidad_tanque numeric(8,2) DEFAULT 200,
    num_tanques numeric(6,2),
    CONSTRAINT detalle_fumigacion_nivel_dano_check CHECK (((nivel_dano)::text = ANY ((ARRAY['leve'::character varying, 'moderado'::character varying, 'severo'::character varying])::text[])))
);



--
-- Name: TABLE detalle_fumigacion; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.detalle_fumigacion IS 'Datos específicos de actividades tipo fumigacion/soca_fumigacion';


--
-- Name: detalle_mano_obra; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalle_mano_obra (
    actividad_id integer NOT NULL,
    num_jornales integer,
    pago_jornal numeric(10,2),
    costo_mano_obra numeric(10,2),
    unidad_mano_obra character varying(20),
    cantidad_unidad_mo numeric(10,2),
    precio_unidad_mo numeric(10,2),
    num_trabajadores integer,
    pago_por_trabajador numeric(10,2),
    descripcion_unidad_mo character varying(100),
    num_tareas numeric(8,2),
    precio_tarea numeric(10,2),
    costo_sembradores numeric(10,2),
    CONSTRAINT detalle_mano_obra_unidad_mano_obra_check CHECK (((unidad_mano_obra)::text = ANY ((ARRAY['jornal'::character varying, 'tanque'::character varying, 'saco'::character varying, 'tarea'::character varying, 'otro'::character varying])::text[])))
);



--
-- Name: TABLE detalle_mano_obra; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.detalle_mano_obra IS 'Jornales, sacos, tanques y sembradores (tareas) asociados a cualquier actividad que requiera mano de obra';


--
-- Name: COLUMN detalle_mano_obra.pago_por_trabajador; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.detalle_mano_obra.pago_por_trabajador IS 'Calculado: costo_mano_obra ÷ num_trabajadores. Cuánto le corresponde a cada trabajador.';


--
-- Name: detalle_maquinaria; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalle_maquinaria (
    actividad_id integer NOT NULL,
    tipo_maquinaria character varying(50),
    unidad_cobro character varying(20),
    cantidad_unidades numeric(8,2),
    costo_por_unidad numeric(10,2),
    costo_maquinaria numeric(10,2),
    CONSTRAINT detalle_maquinaria_unidad_cobro_check CHECK (((unidad_cobro)::text = ANY ((ARRAY['hora'::character varying, 'hectarea'::character varying, 'saco'::character varying, 'otro'::character varying])::text[])))
);



--
-- Name: TABLE detalle_maquinaria; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.detalle_maquinaria IS 'Uso de maquinaria (tractor, drone, cosechadora) en cualquier actividad';


--
-- Name: detalle_riego; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalle_riego (
    actividad_id integer NOT NULL,
    lamina_agua numeric(8,2)
);



--
-- Name: TABLE detalle_riego; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.detalle_riego IS 'Datos específicos de actividades tipo riego/inundacion/soca_riego';


--
-- Name: fases_ciclo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fases_ciclo (
    id integer NOT NULL,
    codigo character varying(5) NOT NULL,
    nombre character varying(100) NOT NULL,
    tipo_ciclo character varying(20) NOT NULL,
    orden_fase integer NOT NULL,
    orden_min integer NOT NULL,
    orden_max integer NOT NULL,
    tipos_actividad character varying(30)[] NOT NULL,
    descripcion text,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT chk_fases_orden_rango CHECK ((orden_min <= orden_max)),
    CONSTRAINT chk_fases_tipo_ciclo CHECK (((tipo_ciclo)::text = ANY ((ARRAY['siembra_boleo'::character varying, 'siembra_trasplante'::character varying, 'soca'::character varying, 'resoca'::character varying])::text[])))
);



--
-- Name: TABLE fases_ciclo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.fases_ciclo IS 'Define las fases agrícolas (F1-F6) según el tipo de ciclo, mapeadas al campo "orden" de PLANTILLAS_CICLO (PlantillaCiclo.ts)';


--
-- Name: COLUMN fases_ciclo.orden_min; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.fases_ciclo.orden_min IS 'Orden mínimo de la plantilla que pertenece a esta fase (inclusive)';


--
-- Name: COLUMN fases_ciclo.orden_max; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.fases_ciclo.orden_max IS 'Orden máximo de la plantilla que pertenece a esta fase (inclusive)';


--
-- Name: COLUMN fases_ciclo.tipos_actividad; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.fases_ciclo.tipos_actividad IS 'Tipos de actividad de referencia para esta fase (documentación, no usado para la asignación cuando hay órdenes repetidos)';


--
-- Name: fases_ciclo_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fases_ciclo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: fases_ciclo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fases_ciclo_id_seq OWNED BY public.fases_ciclo.id;


--
-- Name: parcelas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.parcelas (
    id integer NOT NULL,
    nombre character varying(100),
    propietario character varying(100),
    cultivo character varying(50),
    geometria public.geometry(Polygon,4326),
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    estado character varying(20) DEFAULT 'activo'::character varying,
    zona_id integer,
    ciclo_actual character varying(20) DEFAULT 'siembra_normal_boleo'::character varying,
    area_ha double precision,
    area_cuadras double precision,
    usuario_id integer NOT NULL,
    updated_at timestamp without time zone DEFAULT now(),
    created_by integer,
    updated_by integer,
    CONSTRAINT parcelas_ciclo_actual_check CHECK (((ciclo_actual)::text = ANY ((ARRAY['siembra_normal_boleo'::character varying, 'siembra_normal_trasplante'::character varying, 'soca'::character varying, 'resoca'::character varying, 'en_preparacion'::character varying])::text[]))),
    CONSTRAINT parcelas_estado_check CHECK (((estado)::text = ANY ((ARRAY['activo'::character varying, 'descanso'::character varying, 'cosechado'::character varying, 'preparacion'::character varying])::text[])))
);



--
-- Name: parcelas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.parcelas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: parcelas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.parcelas_id_seq OWNED BY public.parcelas.id;


--
-- Name: plantillas_ciclo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plantillas_ciclo (
    id integer NOT NULL,
    tipo_ciclo character varying(20) NOT NULL,
    tipo_actividad character varying(30) NOT NULL,
    orden integer NOT NULL,
    dias_desde_inicio integer NOT NULL,
    descripcion text,
    obligatoria boolean DEFAULT true NOT NULL,
    CONSTRAINT chk_plantillas_tipo_ciclo CHECK (((tipo_ciclo)::text = ANY ((ARRAY['siembra_boleo'::character varying, 'siembra_trasplante'::character varying, 'soca'::character varying, 'resoca'::character varying])::text[])))
);



--
-- Name: TABLE plantillas_ciclo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.plantillas_ciclo IS 'Réplica en BD de PLANTILLAS_CICLO (PlantillaCiclo.ts). Usada por trg_asignar_fase cuando una actividad no trae orden_plantilla explícito.';


--
-- Name: plantillas_ciclo_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.plantillas_ciclo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: plantillas_ciclo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.plantillas_ciclo_id_seq OWNED BY public.plantillas_ciclo.id;


--
-- Name: productos_actividad; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.productos_actividad (
    id integer NOT NULL,
    actividad_id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    tipo character varying(50),
    dosis numeric(10,4),
    unidad character varying(20),
    fecha_registro timestamp without time zone DEFAULT now(),
    dosis_por_tanque numeric(10,4),
    dosis_total numeric(10,4),
    updated_at timestamp without time zone DEFAULT now(),
    precio_unitario numeric(10,2),
    costo_total numeric(10,2),
    dosis_ha numeric(10,4),
    presentacion_ml integer,
    precio_presentacion numeric(10,2),
    frascos_usados numeric(10,4),
    dosis_por_unidad_mo numeric(10,4),
    CONSTRAINT productos_actividad_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['herbicida'::character varying, 'fungicida'::character varying, 'insecticida'::character varying, 'fertilizante'::character varying, 'abono'::character varying, 'corrector'::character varying, 'bioestimulante'::character varying, 'otro'::character varying])::text[])))
);



--
-- Name: COLUMN productos_actividad.precio_unitario; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.productos_actividad.precio_unitario IS 'Precio por unidad del producto ($/L, $/kg, etc.)';


--
-- Name: COLUMN productos_actividad.costo_total; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.productos_actividad.costo_total IS 'Calculado: dosis_total × precio_unitario';


--
-- Name: COLUMN productos_actividad.dosis_ha; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.productos_actividad.dosis_ha IS 'Dosis por hectárea';


--
-- Name: COLUMN productos_actividad.presentacion_ml; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.productos_actividad.presentacion_ml IS 'Tamaño del frasco/saco: ml para líquidos, gramos para sólidos (25000=25kg, 50000=50kg)';


--
-- Name: COLUMN productos_actividad.precio_presentacion; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.productos_actividad.precio_presentacion IS 'Precio del frasco o saco completo ($)';


--
-- Name: COLUMN productos_actividad.frascos_usados; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.productos_actividad.frascos_usados IS 'Calculado: cantidad_usada ÷ (presentacion_ml/1000) — frascos o sacos consumidos';


--
-- Name: COLUMN productos_actividad.dosis_por_unidad_mo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.productos_actividad.dosis_por_unidad_mo IS 'Para fertilización: kg por saco echado de arroz';


--
-- Name: productos_actividad_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.productos_actividad_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: productos_actividad_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.productos_actividad_id_seq OWNED BY public.productos_actividad.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    token_hash character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    creado_en timestamp without time zone DEFAULT now(),
    revocado boolean DEFAULT false
);



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: socios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.socios (
    id integer NOT NULL,
    cedula character varying(10) NOT NULL,
    nombre text NOT NULL,
    apellido text NOT NULL,
    email text,
    telefono text DEFAULT ''::text NOT NULL,
    direccion text,
    rol public."RolSocio" DEFAULT 'SOCIO'::public."RolSocio" NOT NULL,
    nivel_acceso public."NivelAcceso" DEFAULT 'MIEMBRO'::public."NivelAcceso" NOT NULL,
    estado public."EstadoSocio" DEFAULT 'ACTIVO'::public."EstadoSocio" NOT NULL,
    fecha_ingreso timestamp without time zone DEFAULT now() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    usuario_id integer
);



--
-- Name: socios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.socios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: socios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.socios_id_seq OWNED BY public.socios.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    cedula character varying(13) NOT NULL,
    nombres character varying(100) NOT NULL,
    apellidos character varying(100) NOT NULL,
    usuario character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    rol character varying(20) DEFAULT 'socio'::character varying NOT NULL,
    estado character varying(10) DEFAULT 'activo'::character varying NOT NULL,
    fecha_registro timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    updated_by integer,
    email character varying(100),
    CONSTRAINT usuarios_estado_check CHECK (((estado)::text = ANY ((ARRAY['activo'::character varying, 'inactivo'::character varying])::text[]))),
    CONSTRAINT usuarios_rol_check CHECK (((rol)::text = ANY ((ARRAY['administrador'::character varying, 'socio'::character varying])::text[])))
);



--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: v_costos_actividad; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_costos_actividad AS
 SELECT id,
    ciclo_id,
    parcela_id,
    numero_actividad AS num,
    tipo,
    estado,
    fecha_inicio,
    fecha_fin,
    num_trabajadores,
    unidad_mano_obra,
    cantidad_unidad_mo,
    precio_unidad_mo,
    COALESCE(costo_mano_obra, (0)::numeric) AS costo_mano_obra,
    tipo_maquinaria,
    unidad_cobro,
    cantidad_unidades,
    costo_por_unidad,
    COALESCE(costo_maquinaria, (0)::numeric) AS costo_maquinaria,
    COALESCE(costo_insumos, (0)::numeric) AS costo_insumos,
    COALESCE(costo_sembradores, (0)::numeric) AS costo_sembradores,
    COALESCE(costo_total_actividad, (0)::numeric) AS costo_total,
    COALESCE(( SELECT json_agg(json_build_object('nombre', p.nombre, 'tipo', p.tipo, 'dosis_total', p.dosis_total, 'unidad', p.unidad, 'precio_unitario', p.precio_unitario, 'costo_total', p.costo_total)) AS json_agg
           FROM public.productos_actividad p
          WHERE (p.actividad_id = a.id)), '[]'::json) AS productos
   FROM public.actividades_parcela a;



--
-- Name: VIEW v_costos_actividad; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.v_costos_actividad IS 'Vista completa de costos por actividad — base para exportación Excel';


--
-- Name: zonas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.zonas (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    geometria public.geometry(Polygon,4326),
    fecha_creacion timestamp without time zone DEFAULT now(),
    usuario_id integer NOT NULL,
    updated_at timestamp without time zone DEFAULT now(),
    created_by integer,
    updated_by integer
);



--
-- Name: zonas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.zonas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: zonas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.zonas_id_seq OWNED BY public.zonas.id;


--
-- Name: actividades_parcela id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actividades_parcela ALTER COLUMN id SET DEFAULT nextval('public.actividades_parcela_id_seq'::regclass);


--
-- Name: capas_parcela id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.capas_parcela ALTER COLUMN id SET DEFAULT nextval('public.capas_parcela_id_seq'::regclass);


--
-- Name: ciclos_actividad id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ciclos_actividad ALTER COLUMN id SET DEFAULT nextval('public.ciclos_actividad_id_seq'::regclass);


--
-- Name: fases_ciclo id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fases_ciclo ALTER COLUMN id SET DEFAULT nextval('public.fases_ciclo_id_seq'::regclass);


--
-- Name: parcelas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parcelas ALTER COLUMN id SET DEFAULT nextval('public.parcelas_id_seq'::regclass);


--
-- Name: plantillas_ciclo id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plantillas_ciclo ALTER COLUMN id SET DEFAULT nextval('public.plantillas_ciclo_id_seq'::regclass);


--
-- Name: productos_actividad id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos_actividad ALTER COLUMN id SET DEFAULT nextval('public.productos_actividad_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: socios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.socios ALTER COLUMN id SET DEFAULT nextval('public.socios_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Name: zonas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.zonas ALTER COLUMN id SET DEFAULT nextval('public.zonas_id_seq'::regclass);


--
-- Name: actividades_parcela actividades_parcela_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actividades_parcela
    ADD CONSTRAINT actividades_parcela_pkey PRIMARY KEY (id);


--
-- Name: capas_parcela capas_parcela_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.capas_parcela
    ADD CONSTRAINT capas_parcela_pkey PRIMARY KEY (id);


--
-- Name: ciclos_actividad ciclos_actividad_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ciclos_actividad
    ADD CONSTRAINT ciclos_actividad_pkey PRIMARY KEY (id);


--
-- Name: detalle_cosecha detalle_cosecha_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_cosecha
    ADD CONSTRAINT detalle_cosecha_pkey PRIMARY KEY (actividad_id);


--
-- Name: detalle_fertilizacion detalle_fertilizacion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_fertilizacion
    ADD CONSTRAINT detalle_fertilizacion_pkey PRIMARY KEY (actividad_id);


--
-- Name: detalle_fumigacion detalle_fumigacion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_fumigacion
    ADD CONSTRAINT detalle_fumigacion_pkey PRIMARY KEY (actividad_id);


--
-- Name: detalle_mano_obra detalle_mano_obra_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_mano_obra
    ADD CONSTRAINT detalle_mano_obra_pkey PRIMARY KEY (actividad_id);


--
-- Name: detalle_maquinaria detalle_maquinaria_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_maquinaria
    ADD CONSTRAINT detalle_maquinaria_pkey PRIMARY KEY (actividad_id);


--
-- Name: detalle_riego detalle_riego_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_riego
    ADD CONSTRAINT detalle_riego_pkey PRIMARY KEY (actividad_id);


--
-- Name: fases_ciclo fases_ciclo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fases_ciclo
    ADD CONSTRAINT fases_ciclo_pkey PRIMARY KEY (id);


--
-- Name: parcelas parcelas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parcelas
    ADD CONSTRAINT parcelas_pkey PRIMARY KEY (id);


--
-- Name: plantillas_ciclo plantillas_ciclo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plantillas_ciclo
    ADD CONSTRAINT plantillas_ciclo_pkey PRIMARY KEY (id);


--
-- Name: productos_actividad productos_actividad_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos_actividad
    ADD CONSTRAINT productos_actividad_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_hash_key UNIQUE (token_hash);


--
-- Name: socios socios_cedula_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.socios
    ADD CONSTRAINT socios_cedula_key UNIQUE (cedula);


--
-- Name: socios socios_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.socios
    ADD CONSTRAINT socios_email_key UNIQUE (email);


--
-- Name: socios socios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.socios
    ADD CONSTRAINT socios_pkey PRIMARY KEY (id);


--
-- Name: fases_ciclo uq_fases_codigo_tipo; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fases_ciclo
    ADD CONSTRAINT uq_fases_codigo_tipo UNIQUE (codigo, tipo_ciclo);


--
-- Name: plantillas_ciclo uq_plantillas_tipo_orden; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plantillas_ciclo
    ADD CONSTRAINT uq_plantillas_tipo_orden UNIQUE (tipo_ciclo, orden);


--
-- Name: usuarios usuarios_cedula_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_cedula_unique UNIQUE (cedula);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_usuario_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_usuario_unique UNIQUE (usuario);


--
-- Name: zonas zonas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.zonas
    ADD CONSTRAINT zonas_pkey PRIMARY KEY (id);


--
-- Name: idx_actividades_ciclo_numero; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_actividades_ciclo_numero ON public.actividades_parcela USING btree (ciclo_id, numero_actividad);


--
-- Name: idx_actividades_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_actividades_estado ON public.actividades_parcela USING btree (estado);


--
-- Name: idx_actividades_fase; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_actividades_fase ON public.actividades_parcela USING btree (fase_id);


--
-- Name: idx_actividades_parcela_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_actividades_parcela_id ON public.actividades_parcela USING btree (parcela_id);


--
-- Name: idx_actividades_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_actividades_updated_at ON public.actividades_parcela USING btree (updated_at);


--
-- Name: idx_capas_parcela_geometria; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_capas_parcela_geometria ON public.capas_parcela USING gist (geometria);


--
-- Name: idx_capas_parcela_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_capas_parcela_id ON public.capas_parcela USING btree (parcela_id);


--
-- Name: idx_capas_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_capas_updated_at ON public.capas_parcela USING btree (updated_at);


--
-- Name: idx_ciclos_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ciclos_updated_at ON public.ciclos_actividad USING btree (updated_at);


--
-- Name: idx_parcelas_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_parcelas_updated_at ON public.parcelas USING btree (updated_at);


--
-- Name: idx_parcelas_usuario_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_parcelas_usuario_id ON public.parcelas USING btree (usuario_id);


--
-- Name: idx_productos_actividad_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_productos_actividad_id ON public.productos_actividad USING btree (actividad_id);


--
-- Name: idx_productos_presentacion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_productos_presentacion ON public.productos_actividad USING btree (presentacion_ml);


--
-- Name: idx_productos_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_productos_updated_at ON public.productos_actividad USING btree (updated_at);


--
-- Name: idx_refresh_tokens_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refresh_tokens_hash ON public.refresh_tokens USING btree (token_hash);


--
-- Name: idx_refresh_tokens_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refresh_tokens_usuario ON public.refresh_tokens USING btree (usuario_id);


--
-- Name: idx_usuarios_cedula; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuarios_cedula ON public.usuarios USING btree (cedula);


--
-- Name: idx_usuarios_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuarios_estado ON public.usuarios USING btree (estado);


--
-- Name: idx_usuarios_rol; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuarios_rol ON public.usuarios USING btree (rol);


--
-- Name: idx_usuarios_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuarios_usuario ON public.usuarios USING btree (usuario);


--
-- Name: idx_zonas_geometria; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_zonas_geometria ON public.zonas USING gist (geometria);


--
-- Name: idx_zonas_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_zonas_updated_at ON public.zonas USING btree (updated_at);


--
-- Name: idx_zonas_usuario_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_zonas_usuario_id ON public.zonas USING btree (usuario_id);


--
-- Name: socios_usuario_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX socios_usuario_id_key ON public.socios USING btree (usuario_id);


--
-- Name: actividades_parcela trg_actividades_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_actividades_updated_at BEFORE UPDATE ON public.actividades_parcela FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: actividades_parcela trg_asignar_fase; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_asignar_fase BEFORE INSERT OR UPDATE OF tipo, ciclo_id, orden_plantilla ON public.actividades_parcela FOR EACH ROW EXECUTE FUNCTION public.fn_asignar_fase();


--
-- Name: detalle_mano_obra trg_calcular_mano_obra; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_calcular_mano_obra BEFORE INSERT OR UPDATE ON public.detalle_mano_obra FOR EACH ROW EXECUTE FUNCTION public.fn_calcular_costo_mano_obra();


--
-- Name: detalle_maquinaria trg_calcular_maquinaria; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_calcular_maquinaria BEFORE INSERT OR UPDATE ON public.detalle_maquinaria FOR EACH ROW EXECUTE FUNCTION public.fn_calcular_costo_maquinaria();


--
-- Name: capas_parcela trg_capas_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_capas_updated_at BEFORE UPDATE ON public.capas_parcela FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: ciclos_actividad trg_ciclos_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_ciclos_updated_at BEFORE UPDATE ON public.ciclos_actividad FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: productos_actividad trg_costo_producto; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_costo_producto BEFORE INSERT OR UPDATE ON public.productos_actividad FOR EACH ROW EXECUTE FUNCTION public.fn_recalcular_costo_producto();


--
-- Name: actividades_parcela trg_costo_total; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_costo_total BEFORE INSERT OR UPDATE ON public.actividades_parcela FOR EACH ROW EXECUTE FUNCTION public.fn_recalcular_costo_total();


--
-- Name: actividades_parcela trg_numero_actividad; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_numero_actividad BEFORE INSERT ON public.actividades_parcela FOR EACH ROW EXECUTE FUNCTION public.fn_asignar_numero_actividad();


--
-- Name: parcelas trg_parcelas_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_parcelas_updated_at BEFORE UPDATE ON public.parcelas FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: productos_actividad trg_productos_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_productos_updated_at BEFORE UPDATE ON public.productos_actividad FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: usuarios trg_usuarios_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_usuarios_updated_at BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: zonas trg_zonas_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_zonas_updated_at BEFORE UPDATE ON public.zonas FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: actividades_parcela actividades_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actividades_parcela
    ADD CONSTRAINT actividades_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: actividades_parcela actividades_parcela_capa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actividades_parcela
    ADD CONSTRAINT actividades_parcela_capa_id_fkey FOREIGN KEY (capa_id) REFERENCES public.capas_parcela(id) ON DELETE SET NULL;


--
-- Name: actividades_parcela actividades_parcela_ciclo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actividades_parcela
    ADD CONSTRAINT actividades_parcela_ciclo_id_fkey FOREIGN KEY (ciclo_id) REFERENCES public.ciclos_actividad(id) ON DELETE CASCADE;


--
-- Name: actividades_parcela actividades_parcela_fase_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actividades_parcela
    ADD CONSTRAINT actividades_parcela_fase_id_fkey FOREIGN KEY (fase_id) REFERENCES public.fases_ciclo(id);


--
-- Name: actividades_parcela actividades_parcela_parcela_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actividades_parcela
    ADD CONSTRAINT actividades_parcela_parcela_id_fkey FOREIGN KEY (parcela_id) REFERENCES public.parcelas(id) ON DELETE CASCADE;


--
-- Name: actividades_parcela actividades_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actividades_parcela
    ADD CONSTRAINT actividades_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: capas_parcela capas_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.capas_parcela
    ADD CONSTRAINT capas_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: capas_parcela capas_parcela_parcela_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.capas_parcela
    ADD CONSTRAINT capas_parcela_parcela_id_fkey FOREIGN KEY (parcela_id) REFERENCES public.parcelas(id) ON DELETE CASCADE;


--
-- Name: capas_parcela capas_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.capas_parcela
    ADD CONSTRAINT capas_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: ciclos_actividad ciclos_actividad_parcela_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ciclos_actividad
    ADD CONSTRAINT ciclos_actividad_parcela_id_fkey FOREIGN KEY (parcela_id) REFERENCES public.parcelas(id) ON DELETE CASCADE;


--
-- Name: ciclos_actividad ciclos_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ciclos_actividad
    ADD CONSTRAINT ciclos_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: ciclos_actividad ciclos_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ciclos_actividad
    ADD CONSTRAINT ciclos_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: detalle_cosecha detalle_cosecha_actividad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_cosecha
    ADD CONSTRAINT detalle_cosecha_actividad_id_fkey FOREIGN KEY (actividad_id) REFERENCES public.actividades_parcela(id) ON DELETE CASCADE;


--
-- Name: detalle_fertilizacion detalle_fertilizacion_actividad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_fertilizacion
    ADD CONSTRAINT detalle_fertilizacion_actividad_id_fkey FOREIGN KEY (actividad_id) REFERENCES public.actividades_parcela(id) ON DELETE CASCADE;


--
-- Name: detalle_fumigacion detalle_fumigacion_actividad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_fumigacion
    ADD CONSTRAINT detalle_fumigacion_actividad_id_fkey FOREIGN KEY (actividad_id) REFERENCES public.actividades_parcela(id) ON DELETE CASCADE;


--
-- Name: detalle_mano_obra detalle_mano_obra_actividad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_mano_obra
    ADD CONSTRAINT detalle_mano_obra_actividad_id_fkey FOREIGN KEY (actividad_id) REFERENCES public.actividades_parcela(id) ON DELETE CASCADE;


--
-- Name: detalle_maquinaria detalle_maquinaria_actividad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_maquinaria
    ADD CONSTRAINT detalle_maquinaria_actividad_id_fkey FOREIGN KEY (actividad_id) REFERENCES public.actividades_parcela(id) ON DELETE CASCADE;


--
-- Name: detalle_riego detalle_riego_actividad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_riego
    ADD CONSTRAINT detalle_riego_actividad_id_fkey FOREIGN KEY (actividad_id) REFERENCES public.actividades_parcela(id) ON DELETE CASCADE;


--
-- Name: parcelas parcelas_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parcelas
    ADD CONSTRAINT parcelas_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: parcelas parcelas_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parcelas
    ADD CONSTRAINT parcelas_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: parcelas parcelas_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parcelas
    ADD CONSTRAINT parcelas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE RESTRICT;


--
-- Name: parcelas parcelas_zona_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parcelas
    ADD CONSTRAINT parcelas_zona_id_fkey FOREIGN KEY (zona_id) REFERENCES public.zonas(id) ON DELETE SET NULL;


--
-- Name: productos_actividad productos_actividad_actividad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos_actividad
    ADD CONSTRAINT productos_actividad_actividad_id_fkey FOREIGN KEY (actividad_id) REFERENCES public.actividades_parcela(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_usuario_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: socios socios_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.socios
    ADD CONSTRAINT socios_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: usuarios usuarios_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: zonas zonas_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.zonas
    ADD CONSTRAINT zonas_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: zonas zonas_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.zonas
    ADD CONSTRAINT zonas_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: zonas zonas_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.zonas
    ADD CONSTRAINT zonas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE RESTRICT;




-- ═══════════════════════════════════════════════════════════════════════════
-- COMPATIBILIDAD MAGNARICE (compañero Crisspa)
-- Tablas propias de MagnaRice (Prisma: id TEXT, camelCase), renombradas con
-- sufijo _magnarice para no chocar con usuarios/socios de GeoRice (id INTEGER,
-- snake_case, usadas por Usuario.ts y el login con cédula/usuario).
-- Reutilizan los ENUMs RolSocio/NivelAcceso/EstadoSocio ya creados arriba.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.usuarios_magnarice (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    nombre text NOT NULL,
    apellido text NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.usuarios_magnarice
    ADD CONSTRAINT usuarios_magnarice_pkey PRIMARY KEY (id);

CREATE UNIQUE INDEX IF NOT EXISTS usuarios_magnarice_email_key ON public.usuarios_magnarice USING btree (email);

CREATE TABLE IF NOT EXISTS public.socios_magnarice (
    id text NOT NULL,
    cedula character varying(10) NOT NULL,
    nombre text NOT NULL,
    apellido text NOT NULL,
    email text,
    telefono text DEFAULT ''::text NOT NULL,
    direccion text,
    rol public."RolSocio" DEFAULT 'SOCIO'::public."RolSocio" NOT NULL,
    "nivelAcceso" public."NivelAcceso" DEFAULT 'MIEMBRO'::public."NivelAcceso" NOT NULL,
    estado public."EstadoSocio" DEFAULT 'ACTIVO'::public."EstadoSocio" NOT NULL,
    "fechaIngreso" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "usuarioId" text
);

ALTER TABLE ONLY public.socios_magnarice
    ADD CONSTRAINT socios_magnarice_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.socios_magnarice
    ADD CONSTRAINT "socios_magnarice_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES public.usuarios_magnarice(id) ON UPDATE CASCADE ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS socios_magnarice_cedula_key ON public.socios_magnarice USING btree (cedula);
CREATE UNIQUE INDEX IF NOT EXISTS socios_magnarice_email_key ON public.socios_magnarice USING btree (email);
CREATE UNIQUE INDEX IF NOT EXISTS socios_magnarice_usuarioId_key ON public.socios_magnarice USING btree ("usuarioId");


-- ═══════════════════════════════════════════════════════════════════════════
-- PERMISOS
-- ═══════════════════════════════════════════════════════════════════════════

GRANT ALL ON ALL TABLES IN SCHEMA public TO managerice;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO managerice;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO managerice;

--
-- PostgreSQL database dump complete
--


