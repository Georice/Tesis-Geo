-- ═══════════════════════════════════════════════════════════════════════════
-- GeoRice BD - 04_actividades.sql
-- Módulo de actividades: actividades_parcela, productos_actividad
-- Incluye tablas hijas normalizadas: detalle_riego, detalle_fumigacion,
-- detalle_fertilizacion, detalle_cosecha, detalle_mano_obra, detalle_maquinaria
-- ═══════════════════════════════════════════════════════════════════════════

SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

-- Name: fn_recalcular_costo_producto(); Type: FUNCTION; Schema: public; Owner: postgres
--

-- CREATE FUNCTION public.fn_recalcular_costo_producto() RETURNS trigger
--     LANGUAGE plpgsql
--     AS $_$
-- DECLARE
--     precio_por_unidad_base NUMERIC;
-- BEGIN
--     -- Calcular precio por unidad base ($/L o $/kg)
--     IF NEW.presentacion_ml IS NOT NULL AND NEW.precio_presentacion IS NOT NULL AND NEW.presentacion_ml > 0 THEN
--         -- precio_unitario = precio_presentacion ÷ (presentacion_ml / 1000)
--         precio_por_unidad_base := NEW.precio_presentacion / (NEW.presentacion_ml::NUMERIC / 1000);
--         NEW.precio_unitario := ROUND(precio_por_unidad_base, 4);

--         -- frascos_usados = dosis_total ÷ (presentacion_ml / 1000)
--         IF NEW.dosis_total IS NOT NULL THEN
--             NEW.frascos_usados := ROUND(NEW.dosis_total / (NEW.presentacion_ml::NUMERIC / 1000), 4);
--         END IF;
--     END IF;

--     -- costo_total = dosis_total × precio_unitario
--     IF NEW.dosis_total IS NOT NULL AND NEW.precio_unitario IS NOT NULL THEN
--         NEW.costo_total := ROUND(NEW.dosis_total * NEW.precio_unitario, 2);
--     END IF;

--     RETURN NEW;
-- END;
-- $_$;


CREATE OR REPLACE FUNCTION public.fn_recalcular_costo_producto()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    precio_por_unidad_base NUMERIC;
BEGIN
    -- FERTILIZANTES/ABONOS: cálculo por saco
    -- precio_presentacion = precio por saco
    -- dosis_total = sacos echados
    -- costo_total = sacos x precio_saco
    IF NEW.tipo IN ('fertilizante', 'abono') THEN
        IF NEW.dosis_total IS NOT NULL AND NEW.precio_presentacion IS NOT NULL THEN
            NEW.precio_unitario := NEW.precio_presentacion;
            NEW.frascos_usados  := NEW.dosis_total;
            NEW.costo_total     := ROUND(NEW.dosis_total * NEW.precio_presentacion, 2);
        END IF;
        RETURN NEW;
    END IF;

    -- FUMIGACION/OTROS: cálculo por presentación (ml/L)
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
$$;

ALTER FUNCTION public.fn_recalcular_costo_producto() OWNER TO postgres;

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


ALTER FUNCTION public.fn_recalcular_costo_total() OWNER TO postgres;

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


ALTER FUNCTION public.fn_set_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

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
    fase_id integer,
    CONSTRAINT actividades_parcela_destino_check CHECK (((destino)::text = ANY ((ARRAY['piladora'::character varying, 'almacen'::character varying, 'directo'::character varying, 'otro'::character varying])::text[]))),
    CONSTRAINT actividades_parcela_nivel_dano_check CHECK (((nivel_dano)::text = ANY ((ARRAY['leve'::character varying, 'moderado'::character varying, 'severo'::character varying])::text[]))),
    CONSTRAINT actividades_parcela_tipo_check CHECK (((tipo)::text = ANY (ARRAY[('preparacion_suelo'::character varying)::text, ('inundacion'::character varying)::text, ('siembra_boleo'::character varying)::text, ('siembra_trasplante'::character varying)::text, ('riego'::character varying)::text, ('fertilizacion'::character varying)::text, ('fumigacion'::character varying)::text, ('deshierba'::character varying)::text, ('cosecha'::character varying)::text, ('rozar_quemar'::character varying)::text, ('soca_riego'::character varying)::text, ('soca_fertilizacion'::character varying)::text, ('soca_fumigacion'::character varying)::text, ('cosecha_soca'::character varying)::text, ('observacion'::character varying)::text]))),
    CONSTRAINT actividades_unidad_mo_check CHECK (((unidad_mano_obra)::text = ANY ((ARRAY['jornal'::character varying, 'tanque'::character varying, 'saco'::character varying, 'tarea'::character varying, 'otro'::character varying])::text[])))
);


ALTER TABLE public.actividades_parcela OWNER TO postgres;

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


ALTER SEQUENCE public.actividades_parcela_id_seq OWNER TO postgres;

--
-- Name: actividades_parcela_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.actividades_parcela_id_seq OWNED BY public.actividades_parcela.id;


--
-- Name: capas_parcela; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.productos_actividad OWNER TO postgres;

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


ALTER SEQUENCE public.productos_actividad_id_seq OWNER TO postgres;

--
-- Name: productos_actividad_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.productos_actividad_id_seq OWNED BY public.productos_actividad.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--


-- Índices de actividades y productos
-- Name: idx_actividades_ciclo_numero; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_actividades_ciclo_numero ON public.actividades_parcela USING btree (ciclo_id, numero_actividad);


--
CREATE INDEX idx_actividades_ciclo_numero ON public.actividades_parcela USING btree (ciclo_id, numero_actividad);


--
-- Name: idx_actividades_estado; Type: INDEX; Schema: public; Owner: postgres
--

-- Name: idx_actividades_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_actividades_estado ON public.actividades_parcela USING btree (estado);


--
CREATE INDEX idx_actividades_estado ON public.actividades_parcela USING btree (estado);


--
-- Name: idx_actividades_fase; Type: INDEX; Schema: public; Owner: postgres
--

-- Name: idx_actividades_fase; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_actividades_fase ON public.actividades_parcela USING btree (fase_id);


--
CREATE INDEX idx_actividades_fase ON public.actividades_parcela USING btree (fase_id);


--
-- Name: idx_actividades_parcela_id; Type: INDEX; Schema: public; Owner: postgres
--

-- Name: idx_actividades_parcela_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_actividades_parcela_id ON public.actividades_parcela USING btree (parcela_id);


--
CREATE INDEX idx_actividades_parcela_id ON public.actividades_parcela USING btree (parcela_id);


--
-- Name: idx_actividades_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

-- Name: idx_actividades_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_actividades_updated_at ON public.actividades_parcela USING btree (updated_at);


--
CREATE INDEX idx_actividades_updated_at ON public.actividades_parcela USING btree (updated_at);


--
-- Name: idx_capas_parcela_geometria; Type: INDEX; Schema: public; Owner: postgres
--

-- Name: idx_productos_actividad_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_productos_actividad_id ON public.productos_actividad USING btree (actividad_id);


--
CREATE INDEX idx_productos_actividad_id ON public.productos_actividad USING btree (actividad_id);


--
-- Name: idx_productos_presentacion; Type: INDEX; Schema: public; Owner: postgres
--

-- Name: idx_productos_presentacion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_productos_presentacion ON public.productos_actividad USING btree (presentacion_ml);


--
CREATE INDEX idx_productos_presentacion ON public.productos_actividad USING btree (presentacion_ml);


--
-- Name: idx_productos_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

-- Name: idx_productos_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_productos_updated_at ON public.productos_actividad USING btree (updated_at);


--
CREATE INDEX idx_productos_updated_at ON public.productos_actividad USING btree (updated_at);


--
-- Name: idx_refresh_tokens_hash; Type: INDEX; Schema: public; Owner: postgres
--


-- Triggers de actividades y productos
-- Name: actividades_parcela trg_actividades_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_actividades_updated_at BEFORE UPDATE ON public.actividades_parcela FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
CREATE TRIGGER trg_actividades_updated_at BEFORE UPDATE ON public.actividades_parcela FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: actividades_parcela trg_asignar_fase; Type: TRIGGER; Schema: public; Owner: postgres
--

-- Name: productos_actividad trg_costo_producto; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_costo_producto BEFORE INSERT OR UPDATE ON public.productos_actividad FOR EACH ROW EXECUTE FUNCTION public.fn_recalcular_costo_producto();


--
CREATE TRIGGER trg_costo_producto BEFORE INSERT OR UPDATE ON public.productos_actividad FOR EACH ROW EXECUTE FUNCTION public.fn_recalcular_costo_producto();


--
-- Name: actividades_parcela trg_costo_total; Type: TRIGGER; Schema: public; Owner: postgres
--

-- Name: actividades_parcela trg_costo_total; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_costo_total BEFORE INSERT OR UPDATE ON public.actividades_parcela FOR EACH ROW EXECUTE FUNCTION public.fn_recalcular_costo_total();


--
CREATE TRIGGER trg_costo_total BEFORE INSERT OR UPDATE ON public.actividades_parcela FOR EACH ROW EXECUTE FUNCTION public.fn_recalcular_costo_total();


--
-- Name: actividades_parcela trg_numero_actividad; Type: TRIGGER; Schema: public; Owner: postgres
--

-- Name: actividades_parcela trg_numero_actividad; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_numero_actividad BEFORE INSERT ON public.actividades_parcela FOR EACH ROW EXECUTE FUNCTION public.fn_asignar_numero_actividad();


--
CREATE TRIGGER trg_numero_actividad BEFORE INSERT ON public.actividades_parcela FOR EACH ROW EXECUTE FUNCTION public.fn_asignar_numero_actividad();


--
-- Name: parcelas trg_parcelas_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

-- Name: productos_actividad trg_productos_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_productos_updated_at BEFORE UPDATE ON public.productos_actividad FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
CREATE TRIGGER trg_productos_updated_at BEFORE UPDATE ON public.productos_actividad FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: usuarios trg_usuarios_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

