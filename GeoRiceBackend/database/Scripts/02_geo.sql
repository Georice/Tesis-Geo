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

SET default_tablespace = '';

SET default_table_access_method = heap;

-- Name: zonas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.zonas (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    geometria public.geometry(Polygon,4326),
    fecha_creacion timestamp without time zone DEFAULT now(),
    usuario_id text NOT NULL,
    updated_at timestamp without time zone DEFAULT now(),
    created_by text,
    updated_by text
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
    created_by text,
    updated_by text,
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
    usuario_id text NOT NULL,
    updated_at timestamp without time zone DEFAULT now(),
    created_by text,
    updated_by text,
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
-- Name: zonas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.zonas ALTER COLUMN id SET DEFAULT nextval('public.zonas_id_seq'::regclass);


--
-- Name: capas_parcela id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.capas_parcela ALTER COLUMN id SET DEFAULT nextval('public.capas_parcela_id_seq'::regclass);


--
-- Name: parcelas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parcelas ALTER COLUMN id SET DEFAULT nextval('public.parcelas_id_seq'::regclass);


--
-- Name: zonas zonas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.zonas
    ADD CONSTRAINT zonas_pkey PRIMARY KEY (id);


--
-- Name: capas_parcela capas_parcela_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.capas_parcela
    ADD CONSTRAINT capas_parcela_pkey PRIMARY KEY (id);


--
-- Name: parcelas parcelas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parcelas
    ADD CONSTRAINT parcelas_pkey PRIMARY KEY (id);


-- Índices de zonas, parcelas y capas_parcela
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
-- Name: idx_parcelas_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_parcelas_updated_at ON public.parcelas USING btree (updated_at);


--
-- Name: idx_parcelas_usuario_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_parcelas_usuario_id ON public.parcelas USING btree (usuario_id);


-- Triggers de zonas, parcelas y capas_parcela
-- Name: zonas trg_zonas_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_zonas_updated_at BEFORE UPDATE ON public.zonas FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: capas_parcela trg_capas_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_capas_updated_at BEFORE UPDATE ON public.capas_parcela FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: parcelas trg_parcelas_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_parcelas_updated_at BEFORE UPDATE ON public.parcelas FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


-- FK constraints de zonas, parcelas y capas_parcela (requieren usuarios de 01_auth.sql)
-- Name: zonas zonas_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.zonas
    ADD CONSTRAINT zonas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE RESTRICT;


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
-- Name: capas_parcela capas_parcela_parcela_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.capas_parcela
    ADD CONSTRAINT capas_parcela_parcela_id_fkey FOREIGN KEY (parcela_id) REFERENCES public.parcelas(id) ON DELETE CASCADE;


--
-- Name: capas_parcela capas_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.capas_parcela
    ADD CONSTRAINT capas_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: capas_parcela capas_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.capas_parcela
    ADD CONSTRAINT capas_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.usuarios(id) ON DELETE SET NULL;
