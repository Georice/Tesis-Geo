-- ═══════════════════════════════════════════════════════════════════════════
-- GeoRice BD - 01_auth.sql
-- Módulo de autenticación: usuarios y refresh_tokens
--
-- IMPORTANTE: "usuarios" es propiedad de MagnaRice (gestionada con Prisma).
-- id es TEXT (sin default en DB — la app lo genera con crypto.randomUUID()
-- al crear), y las columnas createdAt/updatedAt son camelCase tal cual las
-- creó Prisma. No tiene columnas rol/estado propias: el rol efectivo se
-- resuelve en runtime uniendo por cédula contra "socios" (ver 05_socios.sql).
-- ═══════════════════════════════════════════════════════════════════════════

SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

-- Name: fn_set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--
-- Usada por las tablas geo (zonas/parcelas/capas_parcela/...), no por
-- usuarios/socios (esas dos las gestiona Prisma a nivel de ORM).

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
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.usuarios (
    id          TEXT         NOT NULL,
    email       TEXT         NOT NULL,
    password    TEXT         NOT NULL,
    nombre      TEXT         NOT NULL,
    apellido    TEXT         NOT NULL,
    activo      BOOLEAN      NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cedula      VARCHAR(10),
    CONSTRAINT usuarios_pkey PRIMARY KEY (id)
);

ALTER TABLE public.usuarios OWNER TO postgres;

CREATE UNIQUE INDEX IF NOT EXISTS usuarios_email_key  ON public.usuarios (email);
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_cedula_key ON public.usuarios (cedula);

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    usuario_id text NOT NULL,
    token_hash character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    creado_en timestamp without time zone DEFAULT now(),
    revocado boolean DEFAULT false
);


ALTER TABLE public.refresh_tokens OWNER TO postgres;

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


ALTER SEQUENCE public.refresh_tokens_id_seq OWNER TO postgres;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


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


-- Índices de refresh_tokens
-- Name: idx_refresh_tokens_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refresh_tokens_hash ON public.refresh_tokens USING btree (token_hash);


--
-- Name: idx_refresh_tokens_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refresh_tokens_usuario ON public.refresh_tokens USING btree (usuario_id);


-- FK constraints de refresh_tokens
-- Name: refresh_tokens refresh_tokens_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_usuario_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;
