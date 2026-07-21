-- ═══════════════════════════════════════════════════════════════════════════
-- GeoRice BD - 03_ciclos_fases.sql
-- Módulo de ciclos agrícolas: ciclos_actividad, fases_ciclo, plantillas_ciclo
-- ═══════════════════════════════════════════════════════════════════════════

SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

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
    -- Actividades sueltas (creadas fuera de un ciclo, sin plantilla) son
    -- válidas: simplemente no tienen fase asignada. No es un error.
    IF NEW.ciclo_id IS NULL THEN
        NEW.fase_id := NULL;
        RETURN NEW;
    END IF;

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
        -- Tipos ambiguos sin orden_plantilla explícito: no se puede inferir
        -- a qué fase pertenece (p. ej. "riego" aparece más de una vez en la
        -- plantilla). Antes esto rechazaba la actividad entera; ahora
        -- queda ligada al ciclo pero sin fase — el usuario puede agregarla
        -- igual (p. ej. una actividad manual sin elegir fase específica) y
        -- corregirla después si hace falta.
        IF NEW.tipo = ANY(v_tipos_ambiguos) THEN
            NEW.fase_id := NULL;
            RETURN NEW;
        END IF;

        -- Tipos no ambiguos: buscar la primera (única) ocurrencia en plantillas_ciclo
        SELECT orden INTO v_orden
        FROM plantillas_ciclo
        WHERE tipo_ciclo = v_tipo_ciclo
          AND tipo_actividad = NEW.tipo
        ORDER BY orden
        LIMIT 1;

        IF v_orden IS NULL THEN
            -- Tipo libre que no pertenece a ninguna plantilla (p. ej.
            -- "observacion"): válido, se liga al ciclo pero sin fase.
            NEW.fase_id := NULL;
            RETURN NEW;
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


ALTER FUNCTION public.fn_asignar_fase() OWNER TO postgres;

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


ALTER FUNCTION public.fn_asignar_numero_actividad() OWNER TO postgres;

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


ALTER TABLE public.ciclos_actividad OWNER TO postgres;

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


ALTER SEQUENCE public.ciclos_actividad_id_seq OWNER TO postgres;

--
-- Name: ciclos_actividad_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ciclos_actividad_id_seq OWNED BY public.ciclos_actividad.id;


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


ALTER TABLE public.fases_ciclo OWNER TO postgres;

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


ALTER SEQUENCE public.fases_ciclo_id_seq OWNER TO postgres;

--
-- Name: fases_ciclo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fases_ciclo_id_seq OWNED BY public.fases_ciclo.id;


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


ALTER TABLE public.plantillas_ciclo OWNER TO postgres;

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


ALTER SEQUENCE public.plantillas_ciclo_id_seq OWNER TO postgres;

--
-- Name: plantillas_ciclo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.plantillas_ciclo_id_seq OWNED BY public.plantillas_ciclo.id;


--
-- Name: ciclos_actividad id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ciclos_actividad ALTER COLUMN id SET DEFAULT nextval('public.ciclos_actividad_id_seq'::regclass);


--
-- Name: fases_ciclo id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fases_ciclo ALTER COLUMN id SET DEFAULT nextval('public.fases_ciclo_id_seq'::regclass);


--
-- Name: plantillas_ciclo id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plantillas_ciclo ALTER COLUMN id SET DEFAULT nextval('public.plantillas_ciclo_id_seq'::regclass);


--
-- Name: ciclos_actividad ciclos_actividad_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ciclos_actividad
    ADD CONSTRAINT ciclos_actividad_pkey PRIMARY KEY (id);


--
-- Name: fases_ciclo fases_ciclo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fases_ciclo
    ADD CONSTRAINT fases_ciclo_pkey PRIMARY KEY (id);


--
-- Name: fases_ciclo uq_fases_codigo_tipo; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fases_ciclo
    ADD CONSTRAINT uq_fases_codigo_tipo UNIQUE (codigo, tipo_ciclo);


--
-- Name: plantillas_ciclo plantillas_ciclo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plantillas_ciclo
    ADD CONSTRAINT plantillas_ciclo_pkey PRIMARY KEY (id);


--
-- Name: plantillas_ciclo uq_plantillas_tipo_orden; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plantillas_ciclo
    ADD CONSTRAINT uq_plantillas_tipo_orden UNIQUE (tipo_ciclo, orden);


-- Índices de ciclos y fases
-- Name: idx_ciclos_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ciclos_updated_at ON public.ciclos_actividad USING btree (updated_at);


-- Triggers de ciclos
-- Name: ciclos_actividad trg_ciclos_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_ciclos_updated_at BEFORE UPDATE ON public.ciclos_actividad FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


-- FK constraints de ciclos (requieren parcelas de 02_geo.sql y usuarios de 01_auth.sql)
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
