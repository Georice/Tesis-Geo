-- ═══════════════════════════════════════════════════════════════════════════
-- GeoRice BD - 02_geo.sql
-- Módulo geográfico: zonas, parcelas, capas_parcela
-- ═══════════════════════════════════════════════════════════════════════════

SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;

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

-- Índices geográficos
-- Name: idx_capas_parcela_geometria; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_capas_parcela_geometria ON public.capas_parcela USING gist (geometria);


--
CREATE INDEX idx_capas_parcela_geometria ON public.capas_parcela USING gist (geometria);


--
-- Name: idx_capas_parcela_id; Type: INDEX; Schema: public; Owner: postgres
--

-- Name: idx_capas_parcela_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_capas_parcela_id ON public.capas_parcela USING btree (parcela_id);


--
CREATE INDEX idx_capas_parcela_id ON public.capas_parcela USING btree (parcela_id);


--
-- Name: idx_capas_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

-- Name: idx_capas_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_capas_updated_at ON public.capas_parcela USING btree (updated_at);


--
CREATE INDEX idx_capas_updated_at ON public.capas_parcela USING btree (updated_at);


--
-- Name: idx_ciclos_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

-- Name: idx_parcelas_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_parcelas_updated_at ON public.parcelas USING btree (updated_at);


--
CREATE INDEX idx_parcelas_updated_at ON public.parcelas USING btree (updated_at);


--
-- Name: idx_parcelas_usuario_id; Type: INDEX; Schema: public; Owner: postgres
--

-- Name: idx_parcelas_usuario_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_parcelas_usuario_id ON public.parcelas USING btree (usuario_id);


--
CREATE INDEX idx_parcelas_usuario_id ON public.parcelas USING btree (usuario_id);


--
-- Name: idx_productos_actividad_id; Type: INDEX; Schema: public; Owner: postgres
--

-- Name: idx_zonas_geometria; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_zonas_geometria ON public.zonas USING gist (geometria);


--
CREATE INDEX idx_zonas_geometria ON public.zonas USING gist (geometria);


--
-- Name: idx_zonas_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

-- Name: idx_zonas_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_zonas_updated_at ON public.zonas USING btree (updated_at);


--
CREATE INDEX idx_zonas_updated_at ON public.zonas USING btree (updated_at);


--
-- Name: idx_zonas_usuario_id; Type: INDEX; Schema: public; Owner: postgres
--

-- Name: idx_zonas_usuario_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_zonas_usuario_id ON public.zonas USING btree (usuario_id);


--
CREATE INDEX idx_zonas_usuario_id ON public.zonas USING btree (usuario_id);


--
-- Name: actividades_parcela trg_actividades_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--


-- Triggers geográficos
-- Name: capas_parcela trg_capas_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_capas_updated_at BEFORE UPDATE ON public.capas_parcela FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
CREATE TRIGGER trg_capas_updated_at BEFORE UPDATE ON public.capas_parcela FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: ciclos_actividad trg_ciclos_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

-- Name: parcelas trg_parcelas_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_parcelas_updated_at BEFORE UPDATE ON public.parcelas FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
CREATE TRIGGER trg_parcelas_updated_at BEFORE UPDATE ON public.parcelas FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: productos_actividad trg_productos_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

-- Name: zonas trg_zonas_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_zonas_updated_at BEFORE UPDATE ON public.zonas FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
CREATE TRIGGER trg_zonas_updated_at BEFORE UPDATE ON public.zonas FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: actividades_parcela actividades_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
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
-- Name: plantillas_ciclo; Type: TABLE; Schema: public; Owner: postgres
--

