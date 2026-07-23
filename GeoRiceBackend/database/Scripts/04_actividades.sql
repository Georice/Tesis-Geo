-- ═══════════════════════════════════════════════════════════════════════════
-- GeoRice BD - 04_actividades.sql
-- Módulo de actividades: actividades_parcela, productos_actividad
-- Tablas hijas normalizadas (1:1 con actividades_parcela, según tipo):
-- detalle_riego, detalle_fumigacion, detalle_fertilizacion, detalle_cosecha,
-- detalle_mano_obra, detalle_maquinaria
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

CREATE FUNCTION public.fn_recalcular_costo_producto() RETURNS trigger
LANGUAGE plpgsql AS $$
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
DECLARE
    v_costo_mano_obra  NUMERIC;
    v_costo_maquinaria NUMERIC;
BEGIN
    -- costo_mano_obra y costo_maquinaria viven en las tablas hijas 1:1
    -- (detalle_mano_obra / detalle_maquinaria), no en actividades_parcela.
    SELECT costo_mano_obra INTO v_costo_mano_obra
    FROM public.detalle_mano_obra WHERE actividad_id = NEW.id;

    SELECT costo_maquinaria INTO v_costo_maquinaria
    FROM public.detalle_maquinaria WHERE actividad_id = NEW.id;

    NEW.costo_total_actividad :=
        COALESCE(v_costo_mano_obra,  0) +
        COALESCE(v_costo_maquinaria, 0) +
        COALESCE(NEW.costo_insumos,  0);
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_recalcular_costo_total() OWNER TO postgres;

--
-- Name: fn_sync_costo_actividad(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_sync_costo_actividad() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Fuerza el UPDATE de actividades_parcela para que trg_costo_total
    -- (fn_recalcular_costo_total) vuelva a sumar mano de obra/maquinaria/insumos.
    UPDATE public.actividades_parcela
       SET costo_total_actividad = costo_total_actividad
     WHERE id = COALESCE(NEW.actividad_id, OLD.actividad_id);
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.fn_sync_costo_actividad() OWNER TO postgres;

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


ALTER FUNCTION public.fn_calcular_costo_mano_obra() OWNER TO postgres;

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


ALTER FUNCTION public.fn_calcular_costo_maquinaria() OWNER TO postgres;

--
-- Name: actividades_parcela; Type: TABLE; Schema: public; Owner: postgres
--

SET default_tablespace = '';

SET default_table_access_method = heap;

CREATE TABLE public.actividades_parcela (
    id integer NOT NULL,
    parcela_id integer NOT NULL,
    capa_id integer,
    tipo character varying(30) NOT NULL,
    fecha timestamp without time zone DEFAULT now() NOT NULL,
    insumo character varying(100),
    cantidad numeric(10,2),
    unidad character varying(20),
    observaciones text,
    fecha_registro timestamp without time zone DEFAULT now(),
    metodo character varying(50),
    nivel_alerta character varying(20) DEFAULT 'normal'::character varying,
    ciclo_id integer,
    estado character varying(20) DEFAULT 'pendiente'::character varying,
    fecha_inicio timestamp without time zone,
    fecha_fin timestamp without time zone,
    updated_at timestamp without time zone DEFAULT now(),
    created_by text,
    updated_by text,
    numero_actividad integer,
    costo_insumos numeric(10,2),
    costo_total_actividad numeric(10,2),
    orden_plantilla integer,
    fase_id integer,
    CONSTRAINT actividades_parcela_tipo_check CHECK (((tipo)::text = ANY (ARRAY[('preparacion_suelo'::character varying)::text, ('inundacion'::character varying)::text, ('siembra_boleo'::character varying)::text, ('siembra_trasplante'::character varying)::text, ('riego'::character varying)::text, ('fertilizacion'::character varying)::text, ('fumigacion'::character varying)::text, ('deshierba'::character varying)::text, ('cosecha'::character varying)::text, ('rozar_quemar'::character varying)::text, ('soca_riego'::character varying)::text, ('soca_fertilizacion'::character varying)::text, ('soca_fumigacion'::character varying)::text, ('cosecha_soca'::character varying)::text, ('observacion'::character varying)::text])))
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

COMMENT ON COLUMN public.actividades_parcela.costo_total_actividad IS 'costo_mano_obra (detalle_mano_obra) + costo_maquinaria (detalle_maquinaria) + costo_insumos';


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
-- Name: detalle_riego; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalle_riego (
    actividad_id integer NOT NULL,
    lamina_agua numeric(8,2)
);


ALTER TABLE public.detalle_riego OWNER TO postgres;

--
-- Name: TABLE detalle_riego; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.detalle_riego IS 'Datos específicos de actividades tipo riego/inundacion/soca_riego';


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


ALTER TABLE public.detalle_fumigacion OWNER TO postgres;

--
-- Name: TABLE detalle_fumigacion; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.detalle_fumigacion IS 'Datos específicos de actividades tipo fumigacion/soca_fumigacion';


--
-- Name: detalle_fertilizacion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalle_fertilizacion (
    actividad_id integer NOT NULL
);


ALTER TABLE public.detalle_fertilizacion OWNER TO postgres;

--
-- Name: TABLE detalle_fertilizacion; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.detalle_fertilizacion IS 'Datos específicos de actividades tipo fertilizacion/soca_fertilizacion (reservada para futuras columnas)';


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


ALTER TABLE public.detalle_cosecha OWNER TO postgres;

--
-- Name: TABLE detalle_cosecha; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.detalle_cosecha IS 'Datos específicos de actividades tipo cosecha/cosecha_soca';


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


ALTER TABLE public.detalle_mano_obra OWNER TO postgres;

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


ALTER TABLE public.detalle_maquinaria OWNER TO postgres;

--
-- Name: TABLE detalle_maquinaria; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.detalle_maquinaria IS 'Uso de maquinaria (tractor, drone, cosechadora) en cualquier actividad';


--
-- Name: actividades_parcela id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actividades_parcela ALTER COLUMN id SET DEFAULT nextval('public.actividades_parcela_id_seq'::regclass);


--
-- Name: productos_actividad id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos_actividad ALTER COLUMN id SET DEFAULT nextval('public.productos_actividad_id_seq'::regclass);


--
-- Name: actividades_parcela actividades_parcela_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actividades_parcela
    ADD CONSTRAINT actividades_parcela_pkey PRIMARY KEY (id);


--
-- Name: productos_actividad productos_actividad_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos_actividad
    ADD CONSTRAINT productos_actividad_pkey PRIMARY KEY (id);


--
-- Name: detalle_riego detalle_riego_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_riego
    ADD CONSTRAINT detalle_riego_pkey PRIMARY KEY (actividad_id);


--
-- Name: detalle_fumigacion detalle_fumigacion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_fumigacion
    ADD CONSTRAINT detalle_fumigacion_pkey PRIMARY KEY (actividad_id);


--
-- Name: detalle_fertilizacion detalle_fertilizacion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_fertilizacion
    ADD CONSTRAINT detalle_fertilizacion_pkey PRIMARY KEY (actividad_id);


--
-- Name: detalle_cosecha detalle_cosecha_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_cosecha
    ADD CONSTRAINT detalle_cosecha_pkey PRIMARY KEY (actividad_id);


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


-- Índices de actividades y productos
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


-- Triggers de actividades y productos
-- Name: actividades_parcela trg_actividades_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_actividades_updated_at BEFORE UPDATE ON public.actividades_parcela FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: actividades_parcela trg_asignar_fase; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_asignar_fase BEFORE INSERT OR UPDATE OF tipo, ciclo_id, orden_plantilla ON public.actividades_parcela FOR EACH ROW EXECUTE FUNCTION public.fn_asignar_fase();


--
-- Name: actividades_parcela trg_numero_actividad; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_numero_actividad BEFORE INSERT ON public.actividades_parcela FOR EACH ROW EXECUTE FUNCTION public.fn_asignar_numero_actividad();


--
-- Name: actividades_parcela trg_costo_total; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_costo_total BEFORE INSERT OR UPDATE ON public.actividades_parcela FOR EACH ROW EXECUTE FUNCTION public.fn_recalcular_costo_total();


--
-- Name: productos_actividad trg_costo_producto; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_costo_producto BEFORE INSERT OR UPDATE ON public.productos_actividad FOR EACH ROW EXECUTE FUNCTION public.fn_recalcular_costo_producto();


--
-- Name: productos_actividad trg_productos_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_productos_updated_at BEFORE UPDATE ON public.productos_actividad FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: detalle_mano_obra trg_calcular_mano_obra; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_calcular_mano_obra BEFORE INSERT OR UPDATE ON public.detalle_mano_obra FOR EACH ROW EXECUTE FUNCTION public.fn_calcular_costo_mano_obra();


--
-- Name: detalle_maquinaria trg_calcular_maquinaria; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_calcular_maquinaria BEFORE INSERT OR UPDATE ON public.detalle_maquinaria FOR EACH ROW EXECUTE FUNCTION public.fn_calcular_costo_maquinaria();


--
-- Name: detalle_mano_obra trg_sync_costo_mano_obra; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_sync_costo_mano_obra AFTER INSERT OR UPDATE OR DELETE ON public.detalle_mano_obra FOR EACH ROW EXECUTE FUNCTION public.fn_sync_costo_actividad();


--
-- Name: detalle_maquinaria trg_sync_costo_maquinaria; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_sync_costo_maquinaria AFTER INSERT OR UPDATE OR DELETE ON public.detalle_maquinaria FOR EACH ROW EXECUTE FUNCTION public.fn_sync_costo_actividad();


-- FK constraints de actividades y productos (requieren parcelas/capas_parcela de 02, ciclos/fases de 03, usuarios de 01)
-- Name: actividades_parcela actividades_parcela_parcela_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actividades_parcela
    ADD CONSTRAINT actividades_parcela_parcela_id_fkey FOREIGN KEY (parcela_id) REFERENCES public.parcelas(id) ON DELETE CASCADE;


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
-- Name: actividades_parcela actividades_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actividades_parcela
    ADD CONSTRAINT actividades_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: actividades_parcela actividades_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actividades_parcela
    ADD CONSTRAINT actividades_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: productos_actividad productos_actividad_actividad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos_actividad
    ADD CONSTRAINT productos_actividad_actividad_id_fkey FOREIGN KEY (actividad_id) REFERENCES public.actividades_parcela(id) ON DELETE CASCADE;


--
-- Name: detalle_riego detalle_riego_actividad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_riego
    ADD CONSTRAINT detalle_riego_actividad_id_fkey FOREIGN KEY (actividad_id) REFERENCES public.actividades_parcela(id) ON DELETE CASCADE;


--
-- Name: detalle_fumigacion detalle_fumigacion_actividad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_fumigacion
    ADD CONSTRAINT detalle_fumigacion_actividad_id_fkey FOREIGN KEY (actividad_id) REFERENCES public.actividades_parcela(id) ON DELETE CASCADE;


--
-- Name: detalle_fertilizacion detalle_fertilizacion_actividad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_fertilizacion
    ADD CONSTRAINT detalle_fertilizacion_actividad_id_fkey FOREIGN KEY (actividad_id) REFERENCES public.actividades_parcela(id) ON DELETE CASCADE;


--
-- Name: detalle_cosecha detalle_cosecha_actividad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_cosecha
    ADD CONSTRAINT detalle_cosecha_actividad_id_fkey FOREIGN KEY (actividad_id) REFERENCES public.actividades_parcela(id) ON DELETE CASCADE;


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
