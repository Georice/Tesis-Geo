--
-- PostgreSQL database dump
--

\restrict E2KK3bnNhvkXC0y0ysKOCqWAOp6caGrQJZ5QIkDoj8uKDSgj4yLMeZOz2IdaXxn

-- Dumped from database version 17.9
-- Dumped by pg_dump version 17.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
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
    CONSTRAINT actividades_parcela_destino_check CHECK (((destino)::text = ANY ((ARRAY['piladora'::character varying, 'almacen'::character varying, 'directo'::character varying, 'otro'::character varying])::text[]))),
    CONSTRAINT actividades_parcela_nivel_dano_check CHECK (((nivel_dano)::text = ANY ((ARRAY['leve'::character varying, 'moderado'::character varying, 'severo'::character varying])::text[]))),
    CONSTRAINT actividades_parcela_tipo_check CHECK (((tipo)::text = ANY (ARRAY[('preparacion_suelo'::character varying)::text, ('inundacion'::character varying)::text, ('siembra_boleo'::character varying)::text, ('siembra_trasplante'::character varying)::text, ('riego'::character varying)::text, ('fertilizacion'::character varying)::text, ('fumigacion'::character varying)::text, ('deshierba'::character varying)::text, ('cosecha'::character varying)::text, ('rozar_quemar'::character varying)::text, ('soca_riego'::character varying)::text, ('soca_fertilizacion'::character varying)::text, ('soca_fumigacion'::character varying)::text, ('cosecha_soca'::character varying)::text, ('observacion'::character varying)::text])))
);


ALTER TABLE public.actividades_parcela OWNER TO postgres;

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

CREATE TABLE public.capas_parcela (
    id integer NOT NULL,
    parcela_id integer NOT NULL,
    tipo character varying(20) NOT NULL,
    geometria public.geometry(Geometry,4326) NOT NULL,
    ndvi_estimado numeric(4,2),
    fecha_actualizacion timestamp without time zone DEFAULT now(),
    CONSTRAINT capas_parcela_ndvi_estimado_check CHECK (((ndvi_estimado >= (0)::numeric) AND (ndvi_estimado <= (1)::numeric))),
    CONSTRAINT capas_parcela_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['activo'::character varying, 'descanso'::character varying, 'lindero'::character varying])::text[])))
);


ALTER TABLE public.capas_parcela OWNER TO postgres;

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


ALTER SEQUENCE public.capas_parcela_id_seq OWNER TO postgres;

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
    fecha_registro timestamp without time zone DEFAULT now()
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
    CONSTRAINT parcelas_ciclo_actual_check CHECK (((ciclo_actual)::text = ANY ((ARRAY['siembra_normal_boleo'::character varying, 'siembra_normal_trasplante'::character varying, 'soca'::character varying, 'resoca'::character varying, 'en_preparacion'::character varying])::text[]))),
    CONSTRAINT parcelas_estado_check CHECK (((estado)::text = ANY ((ARRAY['activo'::character varying, 'descanso'::character varying, 'cosechado'::character varying, 'preparacion'::character varying])::text[])))
);


ALTER TABLE public.parcelas OWNER TO postgres;

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


ALTER SEQUENCE public.parcelas_id_seq OWNER TO postgres;

--
-- Name: parcelas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.parcelas_id_seq OWNED BY public.parcelas.id;


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
    CONSTRAINT productos_actividad_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['herbicida'::character varying, 'fungicida'::character varying, 'insecticida'::character varying, 'fertilizante'::character varying, 'abono'::character varying, 'corrector'::character varying, 'bioestimulante'::character varying, 'otro'::character varying])::text[])))
);


ALTER TABLE public.productos_actividad OWNER TO postgres;

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
-- Name: zonas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.zonas (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    geometria public.geometry(Polygon,4326),
    fecha_creacion timestamp without time zone DEFAULT now()
);


ALTER TABLE public.zonas OWNER TO postgres;

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


ALTER SEQUENCE public.zonas_id_seq OWNER TO postgres;

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
-- Name: parcelas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parcelas ALTER COLUMN id SET DEFAULT nextval('public.parcelas_id_seq'::regclass);


--
-- Name: productos_actividad id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos_actividad ALTER COLUMN id SET DEFAULT nextval('public.productos_actividad_id_seq'::regclass);


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
-- Name: parcelas parcelas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parcelas
    ADD CONSTRAINT parcelas_pkey PRIMARY KEY (id);


--
-- Name: productos_actividad productos_actividad_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos_actividad
    ADD CONSTRAINT productos_actividad_pkey PRIMARY KEY (id);


--
-- Name: zonas zonas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.zonas
    ADD CONSTRAINT zonas_pkey PRIMARY KEY (id);


--
-- Name: idx_actividades_parcela_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_actividades_parcela_id ON public.actividades_parcela USING btree (parcela_id);


--
-- Name: idx_capas_parcela_geometria; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_capas_parcela_geometria ON public.capas_parcela USING gist (geometria);


--
-- Name: idx_capas_parcela_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_capas_parcela_id ON public.capas_parcela USING btree (parcela_id);


--
-- Name: idx_zonas_geometria; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_zonas_geometria ON public.zonas USING gist (geometria);


--
-- Name: actividades_parcela actividades_parcela_capa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actividades_parcela
    ADD CONSTRAINT actividades_parcela_capa_id_fkey FOREIGN KEY (capa_id) REFERENCES public.capas_parcela(id) ON DELETE SET NULL;


--
-- Name: actividades_parcela actividades_parcela_ciclo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actividades_parcela
    ADD CONSTRAINT actividades_parcela_ciclo_id_fkey FOREIGN KEY (ciclo_id) REFERENCES public.ciclos_actividad(id) ON DELETE SET NULL;


--
-- Name: actividades_parcela actividades_parcela_parcela_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actividades_parcela
    ADD CONSTRAINT actividades_parcela_parcela_id_fkey FOREIGN KEY (parcela_id) REFERENCES public.parcelas(id) ON DELETE CASCADE;


--
-- Name: capas_parcela capas_parcela_parcela_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.capas_parcela
    ADD CONSTRAINT capas_parcela_parcela_id_fkey FOREIGN KEY (parcela_id) REFERENCES public.parcelas(id) ON DELETE CASCADE;


--
-- Name: ciclos_actividad ciclos_actividad_parcela_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ciclos_actividad
    ADD CONSTRAINT ciclos_actividad_parcela_id_fkey FOREIGN KEY (parcela_id) REFERENCES public.parcelas(id) ON DELETE CASCADE;


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
-- PostgreSQL database dump complete
--

\unrestrict E2KK3bnNhvkXC0y0ysKOCqWAOp6caGrQJZ5QIkDoj8uKDSgj4yLMeZOz2IdaXxn

