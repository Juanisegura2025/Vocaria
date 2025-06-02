--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Homebrew)
-- Dumped by pg_dump version 14.18 (Homebrew)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: conversations; Type: TABLE; Schema: public; Owner: vocaria_user
--

CREATE TABLE public.conversations (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying(200) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.conversations OWNER TO vocaria_user;

--
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: vocaria_user
--

CREATE SEQUENCE public.conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.conversations_id_seq OWNER TO vocaria_user;

--
-- Name: conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vocaria_user
--

ALTER SEQUENCE public.conversations_id_seq OWNED BY public.conversations.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: vocaria_user
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    content text NOT NULL,
    is_user boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.messages OWNER TO vocaria_user;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: vocaria_user
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.messages_id_seq OWNER TO vocaria_user;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vocaria_user
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: vocaria_user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    hashed_password character varying(128) NOT NULL,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO vocaria_user;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: vocaria_user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO vocaria_user;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vocaria_user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: conversations id; Type: DEFAULT; Schema: public; Owner: vocaria_user
--

ALTER TABLE ONLY public.conversations ALTER COLUMN id SET DEFAULT nextval('public.conversations_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: vocaria_user
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: vocaria_user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: vocaria_user
--

COPY public.conversations (id, user_id, title, created_at, updated_at) FROM stdin;
1	1	Mi primera conversación con Vocaria	2025-05-30 13:00:29.003216-03	\N
2	1	Test Conversation	2025-05-30 13:13:50.60784-03	\N
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: vocaria_user
--

COPY public.messages (id, conversation_id, content, is_user, created_at) FROM stdin;
1	1	Hello Vocaria!	t	2025-05-30 13:13:50.783683-03
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: vocaria_user
--

COPY public.users (id, username, email, hashed_password, is_active, created_at) FROM stdin;
1	juan	juan@vocaria.com	ecd71870d1963316a97e3ac3408c9835ad8cf0f3c1bc703527c30265534f75ae	t	2025-05-30 12:57:35.060185-03
2	testuser	test@vocaria.com	ecd71870d1963316a97e3ac3408c9835ad8cf0f3c1bc703527c30265534f75ae	t	2025-05-30 13:13:50.279317-03
3	testuser2	test2@vocaria.com	ecd71870d1963316a97e3ac3408c9835ad8cf0f3c1bc703527c30265534f75ae	t	2025-05-30 13:24:33.71675-03
4	juan2	juan2@vocaria.com	$2b$12$sgJZ5YoswcDSCT5r8/dnvefGbQVfWBeu9KC/5pUoONEDWpbHbYpkS	t	2025-05-31 21:52:51.591075-03
\.


--
-- Name: conversations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: vocaria_user
--

SELECT pg_catalog.setval('public.conversations_id_seq', 2, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: vocaria_user
--

SELECT pg_catalog.setval('public.messages_id_seq', 1, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: vocaria_user
--

SELECT pg_catalog.setval('public.users_id_seq', 4, true);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: vocaria_user
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: vocaria_user
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: vocaria_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_conversations_id; Type: INDEX; Schema: public; Owner: vocaria_user
--

CREATE INDEX ix_conversations_id ON public.conversations USING btree (id);


--
-- Name: ix_messages_id; Type: INDEX; Schema: public; Owner: vocaria_user
--

CREATE INDEX ix_messages_id ON public.messages USING btree (id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: vocaria_user
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: vocaria_user
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_users_username; Type: INDEX; Schema: public; Owner: vocaria_user
--

CREATE UNIQUE INDEX ix_users_username ON public.users USING btree (username);


--
-- Name: conversations conversations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vocaria_user
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vocaria_user
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id);


--
-- PostgreSQL database dump complete
--

