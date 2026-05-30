--
-- PostgreSQL database dump
--

\restrict W6L6Z3XSyXKSuVxtDKCbv6haccqbImRttCnaoUALWLoZmuPj2ZvFwy6R90y5IUL

-- Dumped from database version 17.8
-- Dumped by pg_dump version 17.8

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bus; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bus (
    id_bus integer NOT NULL,
    capacite integer,
    etat character varying(20) DEFAULT 'disponible'::character varying,
    id_receveur integer,
    numero_bus character varying(50) NOT NULL,
    num_ligne integer,
    date_debut_affectation date,
    date_fin_affectation date,
    horaire_affecte time without time zone,
    image_url text
);


ALTER TABLE public.bus OWNER TO postgres;

--
-- Name: bus_id_bus_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bus_id_bus_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bus_id_bus_seq OWNER TO postgres;

--
-- Name: bus_id_bus_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bus_id_bus_seq OWNED BY public.bus.id_bus;


--
-- Name: demande_reinitialisation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.demande_reinitialisation (
    id integer NOT NULL,
    id_utilisateur integer,
    matricule character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    statut character varying(20) DEFAULT 'En attente'::character varying,
    date_demande timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.demande_reinitialisation OWNER TO postgres;

--
-- Name: demande_reinitialisation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.demande_reinitialisation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.demande_reinitialisation_id_seq OWNER TO postgres;

--
-- Name: demande_reinitialisation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.demande_reinitialisation_id_seq OWNED BY public.demande_reinitialisation.id;


--
-- Name: fiche_cloture_service; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fiche_cloture_service (
    id_fiche integer NOT NULL,
    total_collecte double precision DEFAULT 0 NOT NULL,
    heure_cloture timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    remarques text,
    id_service integer,
    id_responsable_cloture integer,
    statut character varying(50) DEFAULT 'En attente'::character varying,
    duree_minutes integer,
    motif_cloture character varying(255),
    heure_connexion timestamp with time zone
);


ALTER TABLE public.fiche_cloture_service OWNER TO postgres;

--
-- Name: fiche_cloture_service_id_fiche_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fiche_cloture_service_id_fiche_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fiche_cloture_service_id_fiche_seq OWNER TO postgres;

--
-- Name: fiche_cloture_service_id_fiche_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fiche_cloture_service_id_fiche_seq OWNED BY public.fiche_cloture_service.id_fiche;


--
-- Name: fiche_controleur_service; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fiche_controleur_service (
    id_fiche integer NOT NULL,
    id_controleur integer,
    heure_connexion timestamp with time zone,
    heure_cloture timestamp with time zone DEFAULT now(),
    nb_tickets_scannes integer DEFAULT 0,
    statut character varying(20) DEFAULT 'Validé'::character varying
);


ALTER TABLE public.fiche_controleur_service OWNER TO postgres;

--
-- Name: fiche_controleur_service_id_fiche_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fiche_controleur_service_id_fiche_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fiche_controleur_service_id_fiche_seq OWNER TO postgres;

--
-- Name: fiche_controleur_service_id_fiche_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fiche_controleur_service_id_fiche_seq OWNED BY public.fiche_controleur_service.id_fiche;


--
-- Name: guichet; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.guichet (
    id_guichet integer NOT NULL,
    nom_guichet character varying(100) NOT NULL,
    emplacement character varying(255),
    id_agent integer,
    statut character varying(50) DEFAULT 'Actif'::character varying,
    num_ligne integer,
    station_depart character varying(255)
);


ALTER TABLE public.guichet OWNER TO postgres;

--
-- Name: guichet_id_guichet_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.guichet_id_guichet_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.guichet_id_guichet_seq OWNER TO postgres;

--
-- Name: guichet_id_guichet_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.guichet_id_guichet_seq OWNED BY public.guichet.id_guichet;


--
-- Name: horaire_ligne; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.horaire_ligne (
    id_horaire integer NOT NULL,
    num_ligne integer NOT NULL,
    heure_depart time without time zone NOT NULL
);


ALTER TABLE public.horaire_ligne OWNER TO postgres;

--
-- Name: horaire_ligne_id_horaire_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.horaire_ligne_id_horaire_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.horaire_ligne_id_horaire_seq OWNER TO postgres;

--
-- Name: horaire_ligne_id_horaire_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.horaire_ligne_id_horaire_seq OWNED BY public.horaire_ligne.id_horaire;


--
-- Name: incident; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.incident (
    id_incident integer NOT NULL,
    type_incident character varying(100) NOT NULL,
    description text NOT NULL,
    numero_bus character varying(50),
    ligne character varying(100),
    rapporte_par character varying(100),
    date_incident timestamp with time zone DEFAULT now(),
    statut character varying(30) DEFAULT 'En attente'::character varying
);


ALTER TABLE public.incident OWNER TO postgres;

--
-- Name: incident_id_incident_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.incident_id_incident_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.incident_id_incident_seq OWNER TO postgres;

--
-- Name: incident_id_incident_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.incident_id_incident_seq OWNED BY public.incident.id_incident;


--
-- Name: ligne; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ligne (
    num_ligne integer NOT NULL,
    ville_depart character varying(100) NOT NULL,
    ville_arrivee character varying(100) NOT NULL,
    statut_ligne character varying(50) DEFAULT 'active'::character varying
);


ALTER TABLE public.ligne OWNER TO postgres;

--
-- Name: ligne_num_ligne_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ligne_num_ligne_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ligne_num_ligne_seq OWNER TO postgres;

--
-- Name: ligne_num_ligne_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ligne_num_ligne_seq OWNED BY public.ligne.num_ligne;


--
-- Name: service; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service (
    id_service integer NOT NULL,
    date_service date,
    statut_service character varying(50),
    num_ligne integer,
    id_bus integer,
    id_receveur integer,
    statut character varying(20) DEFAULT 'En cours'::character varying,
    date_debut timestamp with time zone DEFAULT now(),
    date_fin timestamp with time zone,
    station_actuelle character varying(100),
    horaire character varying(20),
    voyage_complet boolean DEFAULT false
);


ALTER TABLE public.service OWNER TO postgres;

--
-- Name: service_id_service_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.service_id_service_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.service_id_service_seq OWNER TO postgres;

--
-- Name: service_id_service_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.service_id_service_seq OWNED BY public.service.id_service;


--
-- Name: tarif; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tarif (
    id_tarif integer NOT NULL,
    prix_par_km double precision,
    frais_fixes double precision,
    date_mise_a_jour timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    red_etudiant double precision DEFAULT 0,
    red_militaire double precision DEFAULT 0,
    red_handicape double precision DEFAULT 0,
    red_senior double precision DEFAULT 0
);


ALTER TABLE public.tarif OWNER TO postgres;

--
-- Name: tarif_id_tarif_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tarif_id_tarif_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tarif_id_tarif_seq OWNER TO postgres;

--
-- Name: tarif_id_tarif_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tarif_id_tarif_seq OWNED BY public.tarif.id_tarif;


--
-- Name: ticket; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket (
    id_ticket integer NOT NULL,
    qr_code character varying(255) NOT NULL,
    montant_total double precision NOT NULL,
    date_emission timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    id_service integer,
    id_reservation integer,
    id_vendeur integer,
    type_ticket character varying(50) DEFAULT 'Directe'::character varying,
    date_voyage date,
    siege character varying(10),
    station_depart character varying(100),
    station_arrivee character varying(100),
    type_tarif character varying(50),
    id_agent integer,
    arret_depart character varying(255),
    arret_arrivee character varying(255),
    type_reduction character varying(255),
    distance_km numeric,
    code_ticket character varying(255),
    est_imprime boolean,
    date_impression timestamp without time zone,
    num_ligne integer,
    heure_depart character varying(255),
    id_bus integer,
    id_type_tarification integer,
    id_type_bagage integer,
    prix_bagage numeric,
    est_scanne boolean DEFAULT false,
    date_scan timestamp without time zone,
    id_controleur integer
);


ALTER TABLE public.ticket OWNER TO postgres;

--
-- Name: ticket_id_ticket_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ticket_id_ticket_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ticket_id_ticket_seq OWNER TO postgres;

--
-- Name: ticket_id_ticket_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ticket_id_ticket_seq OWNED BY public.ticket.id_ticket;


--
-- Name: trajet; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trajet (
    id_trajet integer NOT NULL,
    arret character varying(100),
    distance_km double precision,
    num_ligne integer,
    id_tarif integer,
    duree_minutes integer DEFAULT 0,
    statut character varying(20) DEFAULT 'Actif'::character varying NOT NULL
);


ALTER TABLE public.trajet OWNER TO postgres;

--
-- Name: trajet_id_trajet_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.trajet_id_trajet_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.trajet_id_trajet_seq OWNER TO postgres;

--
-- Name: trajet_id_trajet_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.trajet_id_trajet_seq OWNED BY public.trajet.id_trajet;


--
-- Name: type_bagage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.type_bagage (
    id_type_bagage integer NOT NULL,
    code character varying(50) NOT NULL,
    libelle character varying(100) NOT NULL,
    prix numeric NOT NULL,
    actif boolean DEFAULT true
);


ALTER TABLE public.type_bagage OWNER TO postgres;

--
-- Name: type_bagage_id_type_bagage_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.type_bagage_id_type_bagage_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.type_bagage_id_type_bagage_seq OWNER TO postgres;

--
-- Name: type_bagage_id_type_bagage_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.type_bagage_id_type_bagage_seq OWNED BY public.type_bagage.id_type_bagage;


--
-- Name: type_tarification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.type_tarification (
    id_type_tarification integer NOT NULL,
    code character varying(50) NOT NULL,
    libelle character varying(100) NOT NULL,
    categorie character varying(50) NOT NULL,
    mode_calcul character varying(50) NOT NULL,
    valeur numeric NOT NULL,
    actif boolean DEFAULT true,
    remarque text
);


ALTER TABLE public.type_tarification OWNER TO postgres;

--
-- Name: type_tarification_id_type_tarification_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.type_tarification_id_type_tarification_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.type_tarification_id_type_tarification_seq OWNER TO postgres;

--
-- Name: type_tarification_id_type_tarification_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.type_tarification_id_type_tarification_seq OWNED BY public.type_tarification.id_type_tarification;


--
-- Name: utilisateur; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.utilisateur (
    id_utilisateur integer NOT NULL,
    nom character varying(100) NOT NULL,
    prenom character varying(100) NOT NULL,
    matricule character varying(50) NOT NULL,
    mot_de_passe text NOT NULL,
    role character varying(20) NOT NULL,
    email character varying(100),
    num_tel character varying(15),
    est_bloque boolean DEFAULT false,
    image_url character varying(255),
    CONSTRAINT utilisateur_role_check CHECK (((role)::text = ANY ((ARRAY['ADMIN'::character varying, 'AGENT'::character varying, 'RECEVEUR'::character varying, 'CONTROLEUR'::character varying])::text[])))
);


ALTER TABLE public.utilisateur OWNER TO postgres;

--
-- Name: utilisateur_id_utilisateur_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.utilisateur_id_utilisateur_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.utilisateur_id_utilisateur_seq OWNER TO postgres;

--
-- Name: utilisateur_id_utilisateur_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.utilisateur_id_utilisateur_seq OWNED BY public.utilisateur.id_utilisateur;


--
-- Name: bus id_bus; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bus ALTER COLUMN id_bus SET DEFAULT nextval('public.bus_id_bus_seq'::regclass);


--
-- Name: demande_reinitialisation id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.demande_reinitialisation ALTER COLUMN id SET DEFAULT nextval('public.demande_reinitialisation_id_seq'::regclass);


--
-- Name: fiche_cloture_service id_fiche; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiche_cloture_service ALTER COLUMN id_fiche SET DEFAULT nextval('public.fiche_cloture_service_id_fiche_seq'::regclass);


--
-- Name: fiche_controleur_service id_fiche; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiche_controleur_service ALTER COLUMN id_fiche SET DEFAULT nextval('public.fiche_controleur_service_id_fiche_seq'::regclass);


--
-- Name: guichet id_guichet; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guichet ALTER COLUMN id_guichet SET DEFAULT nextval('public.guichet_id_guichet_seq'::regclass);


--
-- Name: horaire_ligne id_horaire; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.horaire_ligne ALTER COLUMN id_horaire SET DEFAULT nextval('public.horaire_ligne_id_horaire_seq'::regclass);


--
-- Name: incident id_incident; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incident ALTER COLUMN id_incident SET DEFAULT nextval('public.incident_id_incident_seq'::regclass);


--
-- Name: ligne num_ligne; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ligne ALTER COLUMN num_ligne SET DEFAULT nextval('public.ligne_num_ligne_seq'::regclass);


--
-- Name: service id_service; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service ALTER COLUMN id_service SET DEFAULT nextval('public.service_id_service_seq'::regclass);


--
-- Name: tarif id_tarif; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tarif ALTER COLUMN id_tarif SET DEFAULT nextval('public.tarif_id_tarif_seq'::regclass);


--
-- Name: ticket id_ticket; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket ALTER COLUMN id_ticket SET DEFAULT nextval('public.ticket_id_ticket_seq'::regclass);


--
-- Name: trajet id_trajet; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trajet ALTER COLUMN id_trajet SET DEFAULT nextval('public.trajet_id_trajet_seq'::regclass);


--
-- Name: type_bagage id_type_bagage; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_bagage ALTER COLUMN id_type_bagage SET DEFAULT nextval('public.type_bagage_id_type_bagage_seq'::regclass);


--
-- Name: type_tarification id_type_tarification; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_tarification ALTER COLUMN id_type_tarification SET DEFAULT nextval('public.type_tarification_id_type_tarification_seq'::regclass);


--
-- Name: utilisateur id_utilisateur; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilisateur ALTER COLUMN id_utilisateur SET DEFAULT nextval('public.utilisateur_id_utilisateur_seq'::regclass);


--
-- Data for Name: bus; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bus (id_bus, capacite, etat, id_receveur, numero_bus, num_ligne, date_debut_affectation, date_fin_affectation, horaire_affecte, image_url) FROM stdin;
4	52	En service	\N	B-102	6	\N	\N	08:00:00	uploads/buses/bus-1777212975950-737001230.jpg
6	42	En service	\N	B-110	9	\N	\N	21:00:00	uploads/buses/bus-1777292595900-105145998.jpg
5	40	En service	19	B-106	9	2026-04-27	\N	06:30:00	uploads/buses/bus-1777292525900-700503850.jpg
3	40	En service	3	B-100	6	2026-04-27	\N	08:30:00	uploads/buses/bus-1776260950035-126471000.jpg
2	48	En service	\N	B-108	8	\N	\N	08:00:00	uploads/buses/bus-1777212988806-232669825.jpg
\.


--
-- Data for Name: demande_reinitialisation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.demande_reinitialisation (id, id_utilisateur, matricule, email, statut, date_demande) FROM stdin;
1	1	AG2024-001	bamin@gmail.com	Traité	2026-04-09 15:33:09.911999
3	12	ag-007	cristronald768@gmail.com	Traité	2026-04-13 14:22:25.018062
5	3	REC-014	ayarisami@gmail.com	En attente	2026-04-26 17:55:38.488378
6	7	14789	alibensalah@gmail.com	En attente	2026-04-26 18:04:08.814413
7	17	11111	karim@yahoo.fr	En attente	2026-04-26 18:08:35.973389
8	13	12345	arbi@gmail.com	En attente	2026-05-19 16:35:34.932551
\.


--
-- Data for Name: fiche_cloture_service; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fiche_cloture_service (id_fiche, total_collecte, heure_cloture, remarques, id_service, id_responsable_cloture, statut, duree_minutes, motif_cloture, heure_connexion) FROM stdin;
1	0	2026-04-26 18:36:18.661	\N	5	\N	Validé	0	Voyage terminé	\N
2	8.339	2026-04-27 00:44:35.037	\N	6	3	Validé	15	Voyage terminé	\N
3	44.92625	2026-04-27 13:45:47.662	\N	7	3	En attente	4	INCIDENT: Panne moteur	\N
4	0	2026-04-27 13:54:16.721	\N	8	3	En attente	7	INCIDENT: Panne moteur	\N
5	23.583750000000002	2026-04-27 16:25:16.608	\N	9	19	En attente	5	Voyage terminé	\N
6	0	2026-05-04 01:13:02.518	\N	10	3	En attente	8	Voyage terminé	\N
7	47.83	2026-05-10 20:28:25.742041	\N	\N	18	En attente	0	Fin de service guichet	2026-05-10 20:27:47.28+01
8	0	2026-05-10 20:49:01.562	\N	12	3	En attente	6	Voyage terminé	\N
9	0	2026-05-10 20:52:20.678	\N	13	3	En attente	0	Voyage terminé	2026-05-10 20:52:12.221+01
10	0	2026-05-11 16:49:13.119468	\N	\N	18	En attente	1	Fin de service guichet	2026-05-11 16:47:19.281+01
11	35.886	2026-05-12 19:59:03.136	\N	18	3	En attente	39	Voyage terminé	2026-05-12 19:19:31.056+01
12	0	2026-05-12 20:25:36.336	\N	20	3	En attente	0	Voyage terminé	2026-05-12 20:25:15.103+01
13	7.120000000000001	2026-05-12 20:37:24.247	\N	21	3	En attente	11	Voyage terminé	2026-05-12 20:26:13.851+01
14	0	2026-05-12 20:39:08.601	\N	22	3	En attente	0	Voyage terminé	2026-05-12 20:39:02.989+01
15	0	2026-05-18 14:45:24.839992	\N	\N	21	En attente	18	Fin de service guichet	2026-05-18 14:26:32.686+01
16	55.400000000000006	2026-05-19 16:02:38.172	\N	26	3	En attente	57	Voyage terminé	2026-05-19 15:05:05.621+01
17	133.875	2026-05-19 16:13:02.567303	\N	\N	21	En attente	8	Fin de service guichet	2026-05-19 16:04:31.64+01
18	163	2026-05-19 16:28:11.681175	\N	\N	18	En attente	0	Fin de service guichet	2026-05-19 16:27:14.672+01
19	29.25	2026-05-25 12:33:30.830948	\N	\N	18	En attente	2	Fin de service guichet	2026-05-25 12:31:16.347+01
20	15.475000000000001	2026-05-25 12:43:40.194	\N	28	3	En attente	4	Voyage terminé	2026-05-25 12:39:09.166+01
21	0	2026-05-25 15:10:58.012	\N	29	3	En attente	0	Voyage terminé	2026-05-25 15:10:03.437+01
22	0	2026-05-25 15:16:17.528	\N	30	3	En attente	0	Voyage terminé	2026-05-25 15:15:37.844+01
23	0	2026-05-25 15:37:52.318	\N	31	3	En attente	0	Voyage terminé	2026-05-25 15:36:57.216+01
24	83.5	2026-05-25 16:53:34.616354	\N	\N	20	En attente	4	Fin de service guichet	2026-05-25 16:49:13.008+01
25	2.9000000000000004	2026-05-25 16:56:46.355	\N	32	3	En attente	1	Voyage terminé	2026-05-25 16:55:01.262+01
\.


--
-- Data for Name: fiche_controleur_service; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fiche_controleur_service (id_fiche, id_controleur, heure_connexion, heure_cloture, nb_tickets_scannes, statut) FROM stdin;
1	17	2026-05-12 20:57:52.703+01	2026-05-12 20:59:58.533886+01	0	Validé
2	17	2026-05-12 21:01:20.485+01	2026-05-12 21:01:35.800939+01	1	Validé
3	17	2026-05-14 17:45:29.676+01	2026-05-14 17:48:01.987233+01	1	Validé
4	17	2026-05-25 12:43:55.24+01	2026-05-25 12:45:07.496653+01	1	Validé
5	17	2026-05-25 16:56:57.842+01	2026-05-25 16:58:24.499973+01	0	Validé
\.


--
-- Data for Name: guichet; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.guichet (id_guichet, nom_guichet, emplacement, id_agent, statut, num_ligne, station_depart) FROM stdin;
5	Guichet Sousse	Sousse	7	Actif	\N	\N
7	Guichet Tunis	Tunis	20	Actif	\N	\N
6	Guichet Rades	Rades	\N	Actif	\N	\N
8	guichet sfax	sfax	21	Actif	\N	\N
\.


--
-- Data for Name: horaire_ligne; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.horaire_ligne (id_horaire, num_ligne, heure_depart) FROM stdin;
13	4	06:30:00
14	4	07:30:00
15	4	08:30:00
16	4	10:00:00
24	8	08:00:00
25	8	10:20:00
26	6	08:00:00
27	6	08:30:00
38	9	01:00:00
39	9	06:30:00
40	9	21:00:00
\.


--
-- Data for Name: incident; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.incident (id_incident, type_incident, description, numero_bus, ligne, rapporte_par, date_incident, statut) FROM stdin;
1	panne_mecanique [moyenne]	Il ya une panne dans le moteur du bus	B-100	6	sami ayari	2026-04-20 17:29:17.209+01	Résolu
3	retard [faible]	FRHBFHRBFB	B-106	9	sami ayari	2026-05-04 01:14:36.907+01	Résolu
2	probleme_securite [moyenne]	ggvgvgvgvg	B-106	9	sami ayari	2026-05-04 01:10:32.028+01	Résolu
4	panne_mecanique [moyenne]	Panne mécanique	B-108	8	sami ayari	2026-05-25 12:41:29.266+01	Résolu
\.


--
-- Data for Name: ligne; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ligne (num_ligne, ville_depart, ville_arrivee, statut_ligne) FROM stdin;
4	Rades	Tunis	Active
8	Sousse	Tunis	Active
6	Rades	borj cedria	Active
9	Tunis	jerba	Active
\.


--
-- Data for Name: service; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.service (id_service, date_service, statut_service, num_ligne, id_bus, id_receveur, statut, date_debut, date_fin, station_actuelle, horaire, voyage_complet) FROM stdin;
14	2026-05-10	\N	9	5	3	Terminé	2026-05-10 22:45:39.997119+01	2026-05-11 18:59:34.431887+01	jerba	22:45	t
16	2026-05-11	\N	8	2	3	Terminé	2026-05-11 17:25:22.508044+01	2026-05-12 19:19:15.03144+01	Bir Bouragba	17:25	f
2	2026-04-07	\N	\N	3	\N	Terminé	2026-04-20 16:06:15.005788+01	2026-04-24 13:48:40.992719+01	ezzahra lycée	\N	f
17	2026-05-11	\N	9	5	3	Terminé	2026-05-11 18:59:41.393522+01	2026-05-12 19:25:28.875136+01	Tunis	18:59	f
18	2026-05-12	\N	8	2	3	Terminé	2026-05-12 19:19:31.056932+01	2026-05-12 19:59:03.136+01	Sousse	19:19	f
3	2026-04-24	\N	6	3	\N	Terminé	2026-04-24 13:49:00.094056+01	2026-04-24 16:21:12.404083+01	borj cedria	08:00	t
20	2026-05-12	\N	8	2	3	Terminé	2026-05-12 20:25:15.103147+01	2026-05-12 20:25:36.336+01	Sousse	20:25	f
4	2026-04-26	\N	6	3	\N	Terminé	2026-04-26 14:38:51.906059+01	2026-04-26 18:13:30.310114+01	borj cedria	08:00	t
5	2026-04-26	\N	6	3	\N	Terminé	2026-04-26 18:36:02.197949+01	2026-04-26 18:36:18.661+01	borj cedria	08:00	t
6	2026-04-27	\N	6	3	3	Terminé	2026-04-27 00:28:52.389515+01	2026-04-27 00:44:35.037+01	borj cedria	08:00	t
7	2026-04-27	\N	9	5	3	Terminé	2026-04-27 13:41:13.517353+01	2026-04-27 13:45:47.662+01	Sousse	06:30	f
8	2026-04-27	\N	9	5	3	Terminé	2026-04-27 13:46:24.514773+01	2026-04-27 13:54:16.721+01	Tunis	21:00	f
29	2026-05-25	\N	8	2	3	Terminé	2026-05-25 15:10:03.437556+01	2026-05-25 15:10:58.012+01	Tunis	15:09	f
9	2026-04-27	\N	9	5	19	Terminé	2026-04-27 16:19:36.091858+01	2026-04-27 16:25:16.608+01	jerba	06:30	t
10	2026-05-04	\N	9	5	3	Terminé	2026-05-04 01:04:35.587926+01	2026-05-04 01:13:02.518+01	Tunis	06:30	f
21	2026-05-12	\N	8	2	3	Terminé	2026-05-12 20:26:13.851387+01	2026-05-12 20:37:24.247+01	Enfidha	20:25	f
22	2026-05-12	\N	8	2	3	Terminé	2026-05-12 20:39:02.989119+01	2026-05-12 20:39:08.601+01	Sousse	20:39	f
12	2026-05-10	\N	9	5	3	Terminé	2026-05-10 20:42:05.596105+01	2026-05-10 20:49:01.562+01	Tunis	20:42	t
13	2026-05-10	\N	9	5	3	Terminé	2026-05-10 20:52:12.221751+01	2026-05-10 20:52:20.678+01	Sousse	20:52	f
11	2026-05-04	\N	6	3	3	Terminé	2026-05-04 01:05:02.074114+01	2026-05-10 22:46:22.697191+01	Rades	08:00	f
1	2026-04-07	\N	\N	2	\N	Terminé	2026-04-20 16:06:15.005788+01	2026-05-10 22:51:35.311785+01	\N	\N	f
15	2026-05-10	\N	8	2	3	Terminé	2026-05-10 22:51:43.402429+01	2026-05-11 17:14:15.627073+01	Sousse	22:51	f
30	2026-05-25	\N	9	5	3	Terminé	2026-05-25 15:15:37.844931+01	2026-05-25 15:16:17.528+01	Tunis	15:15	f
23	2026-05-12	\N	8	2	3	Terminé	2026-05-12 20:45:57.803606+01	2026-05-15 17:22:59.626225+01	Tunis	20:45	t
24	2026-05-15	\N	8	2	3	Terminé	2026-05-15 17:23:07.265075+01	2026-05-18 20:45:47.390693+01	Sousse	17:23	f
25	2026-05-18	\N	8	2	3	Terminé	2026-05-18 20:45:54.207464+01	2026-05-19 15:04:48.731054+01	Enfidha	20:45	f
26	2026-05-19	\N	8	2	3	Terminé	2026-05-19 15:05:05.621341+01	2026-05-19 16:02:38.172+01	Kalaa sghira	15:04	f
19	2026-05-12	\N	9	5	3	Terminé	2026-05-12 19:26:37.789955+01	2026-05-19 19:57:55.739399+01	Sfax	19:26	f
27	2026-05-22	\N	8	2	3	Terminé	2026-05-22 15:13:26.996822+01	2026-05-25 12:38:54.258425+01	Kalaa sghira	15:13	f
31	2026-05-25	\N	9	5	3	Terminé	2026-05-25 15:36:57.216395+01	2026-05-25 15:37:52.318+01	jerba	15:36	f
28	2026-05-25	\N	8	2	3	Terminé	2026-05-25 12:39:09.166499+01	2026-05-25 12:43:40.194+01	Bouficha	12:39	f
32	2026-05-25	\N	8	2	3	Terminé	2026-05-25 16:55:01.262766+01	2026-05-25 16:56:46.355+01	Tunis	16:54	f
\.


--
-- Data for Name: tarif; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tarif (id_tarif, prix_par_km, frais_fixes, date_mise_a_jour, red_etudiant, red_militaire, red_handicape, red_senior) FROM stdin;
1	0.2	1.5	2026-05-14 17:39:11.620071	\N	\N	\N	\N
\.


--
-- Data for Name: ticket; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket (id_ticket, qr_code, montant_total, date_emission, id_service, id_reservation, id_vendeur, type_ticket, date_voyage, siege, station_depart, station_arrivee, type_tarif, id_agent, arret_depart, arret_arrivee, type_reduction, distance_km, code_ticket, est_imprime, date_impression, num_ligne, heure_depart, id_bus, id_type_tarification, id_type_bagage, prix_bagage, est_scanne, date_scan, id_controleur) FROM stdin;
1	TKT979373	1.4712	2026-04-14 18:42:23.642235	\N	\N	\N	Directe	2026-04-14	A1	Rades	ezzahra lycée	Étudiant	7	\N	\N	\N	\N	TKT979373	\N	\N	6	08:00	4	\N	\N	\N	f	\N	\N
2	TKT806847	1.2872999999999999	2026-04-14 18:44:54.785596	\N	\N	\N	Directe	2026-04-14	A2	Rades	ezzahra lycée	Handicapé	7	\N	\N	\N	\N	TKT806847	\N	\N	6	08:00	4	\N	\N	\N	f	\N	\N
3	TKT701283	1.5246	2026-04-14 20:28:09.12454	\N	\N	\N	Directe	2026-04-14	A3	Rades	ezzahra	Handicapé	7	\N	\N	\N	\N	TKT701283	\N	\N	6	08:30	3	\N	\N	\N	f	\N	\N
4	TKT668735	1.839	2026-04-14 21:09:39.264447	\N	\N	\N	Directe	2026-04-14	A3	Rades	ezzahra lycée	Tarif Plein	7	\N	\N	\N	\N	TKT668735	\N	\N	6	08:00	4	\N	\N	\N	f	\N	\N
5	TKT539694	1.2872999999999999	2026-04-15 14:27:54.685333	\N	\N	\N	Directe	2026-04-15	A1	Rades	ezzahra lycée	Handicapé	7	\N	\N	\N	\N	TKT539694	\N	\N	6	08:00	4	\N	\N	\N	f	\N	\N
6	TKT2914	1.2872999999999999	2026-04-15 14:28:06.578001	\N	\N	\N	Directe	2026-04-15	A1	Rades	ezzahra lycée	Handicapé	7	\N	\N	\N	\N	TKT2914	\N	\N	6	08:00	4	\N	\N	\N	f	\N	\N
7	TKT422855	6.1	2026-04-20 20:55:34.947441	\N	\N	\N	Directe	2026-04-20	A1	Rades	ezzahra lycée	Expédition 5 DT	7	\N	\N	\N	\N	TKT422855	\N	\N	6	08:00	4	14	1	1.1	f	\N	\N
8	TKT649866	0.45975	2026-04-20 21:22:46.536617	\N	\N	\N	Directe	2026-04-20	A2	Rades	ezzahra lycée	Conv. Douane	\N	\N	\N	\N	\N	TKT649866	\N	\N	6	08:00	3	10	\N	0	f	\N	\N
9	TKT838394	2.178	2026-04-20 21:37:54.10559	\N	\N	\N	Directe	2026-04-20	A3	Rades	ezzahra	Tarif normal (Plein rapide)	7	\N	\N	\N	\N	TKT838394	\N	\N	6	08:00	4	1	\N	0	f	\N	\N
10	TKT981681	2.178	2026-04-20 21:45:54.841494	\N	\N	\N	Directe	2026-04-20	A4	Rades	ezzahra	Tarif normal (Plein rapide)	7	\N	\N	\N	\N	TKT981681	\N	\N	6	08:00	4	1	\N	0	f	\N	\N
11	TKT14626	2.178	2026-04-20 21:52:57.392613	\N	\N	\N	Directe	2026-04-20	B2	Rades	ezzahra	Tarif normal (Plein rapide)	7	\N	\N	\N	\N	TKT14626	\N	\N	6	08:00	4	1	\N	0	t	2026-04-20 22:00:33.732859	\N
12	TKT461824	2.589	2026-04-20 22:07:43.264412	\N	\N	\N	Directe	2026-04-20	G5	Rades	ezzahra	50% rédu.	7	\N	\N	\N	\N	TKT461824	\N	\N	6	08:00	4	3	2	1.5	t	2026-04-20 22:11:35.674598	\N
14	TKT242715	11.64	2026-04-23 14:41:30.345276	\N	\N	\N	Directe	2026-04-23	A1	Sousse	Bir Bouragba	Tarif normal (Plein rapide)	7	\N	\N	\N	\N	TKT242715	\N	\N	8	08:00	2	1	1	1.1	f	\N	\N
16	TKT897721	3.278	2026-04-24 13:53:59.023122	3	\N	\N	Directe	2026-04-24	A1	Rades	ezzahra	Tarif normal (Plein rapide)	\N	\N	\N	\N	\N	TKT897721	\N	\N	6	08:00	3	1	1	1.1	f	\N	\N
17	TKT236084	0.45975	2026-04-24 14:03:34.081136	3	\N	\N	Directe	2026-04-24	A2	Rades	ezzahra lycée	Conv. Douane	\N	\N	\N	\N	\N	TKT236084	\N	\N	6	08:00	3	10	\N	0	f	\N	\N
18	TKT166422	1.839	2026-04-24 14:22:08.525398	\N	\N	\N	Directe	2026-04-24	A3	Rades	ezzahra lycée	Tarif normal (Plein rapide)	7	\N	\N	\N	\N	TKT166422	\N	\N	6	08:00	4	1	\N	0	f	\N	\N
19	TKT565083	2.178	2026-04-24 14:27:59.739835	3	\N	\N	Directe	2026-04-24	A3	Rades	ezzahra	Tarif normal (Plein rapide)	7	\N	\N	\N	\N	TKT565083	\N	\N	6	08:30	3	1	\N	0	f	\N	\N
20	TKT520996	85.28175	2026-04-24 16:20:43.649359	3	\N	\N	Directe	2026-04-24	A1	ezzahra	borj cedria	25% rédu.	\N	\N	\N	\N	\N	TKT520996	\N	\N	6	16:20	3	2	\N	0	f	\N	\N
21	TKT214834	1.839	2026-04-24 21:20:10.815713	\N	\N	\N	Directe	2026-04-24	A4	Rades	ezzahra lycée	Tarif normal (Plein rapide)	7	\N	\N	\N	\N	TKT214834	\N	\N	6	08:00	4	1	\N	0	f	\N	\N
23	TKT504955	1.839	2026-04-26 13:20:45.637195	\N	\N	\N	Directe	2026-04-26	A2	Rades	ezzahra lycée	Tarif normal (Plein rapide)	7	\N	\N	\N	\N	TKT504955	\N	\N	6	08:30	3	1	\N	0	f	\N	\N
24	TKT697922	2.178	2026-04-26 13:23:22.628784	\N	\N	\N	Directe	2026-04-26	A2	Rades	ezzahra	Tarif normal (Plein rapide)	7	\N	\N	\N	\N	TKT697922	\N	\N	6	08:00	4	1	\N	0	f	\N	\N
25	TKT639069	2.178	2026-04-26 13:27:00.075182	\N	\N	\N	Directe	2026-04-26	A3	Rades	ezzahra	Tarif normal (Plein rapide)	7	\N	\N	\N	\N	TKT639069	\N	\N	6	08:00	4	1	\N	0	f	\N	\N
26	TKT299216	1.839	2026-04-26 13:34:27.546001	\N	\N	\N	Directe	2026-04-26	A3	Rades	ezzahra lycée	Tarif normal (Plein rapide)	7	\N	\N	\N	\N	TKT299216	\N	\N	6	08:30	3	1	\N	0	f	\N	\N
27	TKT546142	2.178	2026-04-26 14:40:24.86538	\N	\N	\N	Directe	2026-04-26	A4	Rades	ezzahra	Tarif normal (Plein rapide)	7	\N	\N	\N	\N	TKT546142	\N	\N	6	08:00	4	1	\N	0	f	\N	\N
28	TKT452362	1.839	2026-04-26 15:05:31.668215	4	\N	\N	Directe	2026-04-26	A1	ezzahra	borj cedria 	Tarif normal (Plein rapide)	\N	\N	\N	\N	\N	TKT452362	\N	\N	6	15:05	3	1	\N	0	t	2026-04-26 15:11:43.980394	\N
29	TKT597671	2.178	2026-04-26 20:29:43.460132	\N	\N	\N	Directe	2026-04-26	A5	Rades	ezzahra	Tarif normal (Plein rapide)	7	\N	\N	\N	\N	TKT597671	\N	\N	6	08:00	4	1	\N	0	t	2026-04-26 20:30:49.251769	17
31	TKT566097	1.839	2026-04-26 23:39:42.003344	\N	\N	\N	Directe	2026-04-27	A1	Rades	ezzahra lycée	Tarif normal (Plein rapide)	7	\N	\N	\N	\N	TKT566097	\N	\N	6	08:30	3	1	\N	0	f	\N	\N
32	TKT57966	3.678	2026-04-26 23:46:37.460105	\N	\N	\N	Directe	2026-04-28	A1	Rades	ezzahra	Tarif normal (Plein rapide)	7	\N	\N	\N	\N	TKT57966	\N	\N	6	08:00	4	1	2	1.5	f	\N	\N
33	TKT949513	1.839	2026-04-27 00:05:35.584471	\N	\N	\N	Réservations	2026-04-28	A2	Rades	ezzahra lycée	Tarif normal (Plein rapide)	7	\N	\N	\N	\N	TKT949513	\N	\N	6	08:00	4	1	\N	0	f	\N	\N
34	TKT883355	2.5170000000000003	2026-04-27 00:22:38.585961	\N	\N	\N	Réservations	2026-04-28	A3	Rades	borj cedria 	Tarif normal (Plein rapide)	7	\N	\N	\N	\N	TKT883355	\N	\N	6	08:00	4	1	\N	0	f	\N	\N
35	TKT979143	11.1	2026-04-27 00:30:24.523399	4	\N	\N	Vente Directe	2026-04-26	A1	Rades	borj cedria 	Expédition 10 DT	\N	\N	\N	\N	\N	TKT979143	\N	\N	6	00:29	3	15	1	1.1	f	\N	\N
36	TKT552854	1.8877500000000003	2026-04-27 00:31:30.722447	4	\N	\N	Vente Directe	2026-04-26	A2	Rades	borj cedria 	25% rédu.	\N	\N	\N	\N	\N	TKT552854	\N	\N	6	00:31	3	2	\N	0	f	\N	\N
37	TKT132121	1.839	2026-04-27 00:32:47.180015	4	\N	\N	Vente Directe	2026-04-26	A2	Rades	ezzahra lycée	Tarif normal (Plein rapide)	\N	\N	\N	\N	\N	TKT132121	\N	\N	6	00:32	3	1	\N	0	f	\N	\N
38	TKT998133	1.5	2026-04-27 00:39:33.442496	4	\N	\N	Vente Directe	2026-04-26	A5	Rades	ezzahra	Plein	7	\N	\N	\N	\N	TKT998133	\N	\N	6	00:40	3	\N	\N	0	f	\N	\N
39	TKT945299	2	2026-04-27 00:40:31.331377	6	\N	\N	Vente Directe	2026-04-26	A6	Rades	ezzahra	Plein	7	\N	\N	\N	\N	TKT945299	\N	\N	6	00:45	3	\N	\N	0	f	\N	\N
40	TKT614365	3	2026-04-27 00:43:08.243234	6	\N	\N	Vente Directe	2026-04-26	G4	Rades	ezzahra lycée	Expédition 3 DT	3	\N	\N	\N	\N	TKT614365	\N	\N	6	00:42	3	13	\N	0	f	\N	\N
41	TKT920384	1.3792499999999999	2026-04-27 00:43:41.852868	6	\N	\N	Vente Directe	2026-04-26	A2	ezzahra lycée	ezzahra	25% rédu.	3	\N	\N	\N	\N	TKT920384	\N	\N	6	00:43	3	2	\N	0	f	\N	\N
42	TKT569127	1.95975	2026-04-27 00:44:17.188494	6	\N	\N	Vente Directe	2026-04-26	A1	ezzahra	borj cedria 	Conv. Militaire	3	\N	\N	\N	\N	TKT569127	\N	\N	6	00:44	3	9	2	1.5	f	\N	\N
43	TKT751685	19.385	2026-04-27 13:36:41.101264	\N	\N	\N	Vente Directe	2026-04-27	A1	Tunis	Sousse	Tarif normal (Plein rapide)	18	\N	\N	\N	\N	TKT751685	\N	\N	9	06:30	5	1	2	1.5	f	\N	\N
44	TKT118234	5.571250000000001	2026-04-27 13:42:43.897606	7	\N	\N	Vente Directe	2026-04-27	A2	Tunis	Sousse	Conv. Militaire	3	\N	\N	\N	\N	TKT118234	\N	\N	9	13:42	5	9	1	1.1	f	\N	\N
45	TKT458338	39.355000000000004	2026-04-27 13:44:51.602637	7	\N	\N	Vente Directe	2026-04-27	A3	Sousse	Médnine	Tarif normal (Plein rapide)	3	\N	\N	\N	\N	TKT458338	\N	\N	9	13:43	5	1	\N	0	f	\N	\N
13	TKT100944	2.45975	2026-04-21 14:41:58.561732	\N	\N	\N	Directe	2026-04-21	A4	Rades	ezzahra lycée	Conv. Militaire	7	\N	\N	\N	\N	TKT100944	\N	\N	6	08:00	4	9	\N	2	f	\N	\N
15	TKT273646	13.105	2026-04-23 15:10:27.401076	\N	\N	\N	Directe	2026-04-23	A3	Sousse	Grombelia	Tarif normal (Plein rapide)	7	\N	\N	\N	\N	TKT273646	\N	\N	8	08:00	2	1	\N	2	f	\N	\N
48	TKT745483	4.47125	2026-04-27 16:13:25.427602	\N	\N	\N	Vente Directe	2026-04-27	A3	Tunis	Sousse	Conv. Militaire	18	\N	\N	\N	\N	TKT745483	\N	\N	9	06:30	5	9	\N	0	f	\N	\N
49	TKT954993	23.583750000000002	2026-04-27 16:20:39.85478	9	\N	\N	Vente Directe	2026-04-27	A1	Sousse	Gabés	25% rédu.	19	\N	\N	\N	\N	TKT954993	\N	\N	9	16:20	5	2	\N	0	f	\N	\N
51	TKT419290	47.83	2026-04-27 16:27:26.667625	\N	\N	\N	Vente Directe	2026-04-27	B2	Tunis	Gabés	Tarif normal (Plein rapide)	18	\N	\N	\N	\N	TKT419290	\N	\N	9	06:30	5	1	\N	0	f	\N	\N
50	TKT533320	47.83	2026-04-27 16:27:13.894154	\N	\N	\N	Vente Directe	2026-04-27	B2	Tunis	Gabés	Tarif normal (Plein rapide)	18	\N	\N	\N	\N	TKT533320	\N	\N	9	06:30	5	1	\N	0	t	2026-04-27 16:27:45.760298	17
52	TKT640909	61.39	2026-04-28 18:15:52.275863	\N	\N	\N	Vente Directe	2026-04-28	A1	Tunis	jerba houmet souk	Tarif normal (Plein rapide)	18	\N	\N	\N	\N	TKT640909	\N	\N	9	06:30	5	1	\N	0	f	\N	\N
53	TKT911955	55.74	2026-04-30 14:13:40.488609	\N	\N	\N	Vente Directe	2026-04-30	G3	Tunis	Médnine	Tarif normal (Plein rapide)	18	\N	\N	\N	\N	TKT911955	\N	\N	9	06:30	5	1	\N	0	f	\N	\N
54	TKT578569	32.010000000000005	2026-04-30 14:18:20.149418	\N	\N	\N	Vente Directe	2026-04-30	A2	Tunis	Sfax	Tarif normal (Plein rapide)	18	\N	\N	\N	\N	TKT578569	\N	\N	9	06:30	5	1	\N	0	f	\N	\N
55	TKT576206	17.885	2026-04-30 15:52:27.676907	\N	\N	\N	Vente Directe	2026-04-30	A1	Tunis	Sousse	Tarif normal (Plein rapide)	18	\N	\N	\N	\N	TKT576206	\N	\N	9	06:30	5	1	\N	0	f	\N	\N
56	TKT840669	32.010000000000005	2026-05-03 15:03:54.546655	\N	\N	\N	Vente Directe	2026-05-03	A1	Tunis	Sfax	Tarif normal (Plein rapide)	18	\N	\N	\N	\N	TKT840669	\N	\N	9	21:00	6	1	\N	0	f	\N	\N
57	TKT921748	47.83	2026-05-10 20:27:59.719682	\N	\N	\N	Vente Directe	2026-05-10	A1	Tunis	Gabés	Tarif normal (Plein rapide)	18	\N	\N	\N	\N	TKT921748	\N	\N	9	21:00	6	1	\N	0	f	\N	\N
58	TKT431977	3.14625	2026-05-10 23:05:59.432891	15	\N	\N	Vente Directe	2026-05-10	A2	Sousse	Enfidha	75% G. Nationale	3	\N	\N	\N	\N	TKT431977	\N	\N	8	08:00	2	5	2	1.5	f	\N	\N
59	TKT426692	6.585	2026-05-12 19:33:53.987903	18	\N	\N	Vente Directe	2026-05-12	A1	Sousse	Enfidha	Tarif normal (Plein rapide)	3	\N	\N	\N	\N	TKT426692	\N	\N	8	19:32	2	1	\N	0	f	\N	\N
61	TKT649793	17.885	2026-05-12 19:50:29.290234	\N	\N	\N	Vente Directe	2026-05-12	A2	Tunis	Sousse	Tarif normal (Plein rapide)	18	\N	\N	\N	\N	TKT649793	\N	\N	9	21:00	6	1	\N	0	f	\N	\N
62	TKT757650	10.540000000000001	2026-05-12 19:52:28.029619	18	\N	\N	Vente Directe	2026-05-12	A2	Sousse	Bir Bouragba	Tarif normal (Plein rapide)	3	\N	\N	\N	\N	TKT757650	\N	\N	8	19:52	2	1	\N	0	f	\N	\N
63	TKT125529	3.391	2026-05-12 19:55:04.147558	18	\N	\N	Vente Directe	2026-05-12	A4	Sousse	Kalaa sghira	Tarif normal (Plein rapide)	3	\N	\N	\N	\N	TKT125529	\N	\N	8	19:54	2	1	1	1.1	f	\N	\N
64	TKT410148	7.6850000000000005	2026-05-12 19:56:57.727615	18	\N	\N	Vente Directe	2026-05-12	C3	Sousse	Enfidha	Tarif normal (Plein rapide)	3	\N	\N	\N	\N	TKT410148	\N	\N	8	19:56	2	1	1	1.1	f	\N	\N
65	TKT103668	7.6850000000000005	2026-05-12 19:58:52.769369	18	\N	\N	Vente Directe	2026-05-12	C4	Sousse	Enfidha	Tarif normal (Plein rapide)	3	\N	\N	\N	\N	TKT103668	\N	\N	8	19:58	2	1	1	1.1	f	\N	\N
66	TKT732272	7.120000000000001	2026-05-12 20:36:59.992005	21	\N	\N	Vente Directe	2026-05-12	G3	Enfidha	Grombelia	Tarif normal (Plein rapide)	3	\N	\N	\N	\N	TKT732272	\N	\N	8	20:36	2	1	1	1.1	f	\N	\N
67	TKT284168	33.11000000000001	2026-05-12 20:40:46.709931	19	\N	\N	Vente Directe	2026-05-12	B3	Tunis	Sfax	Tarif normal (Plein rapide)	3	\N	\N	\N	\N	TKT284168	\N	\N	9	20:40	5	1	1	1.1	f	\N	\N
68	TKT556289	19.385	2026-05-12 21:00:42.938392	\N	\N	\N	Vente Directe	2026-05-12	A2	Tunis	Sousse	Tarif normal (Plein rapide)	18	\N	\N	\N	\N	TKT556289	\N	\N	9	21:00	6	1	2	1.5	t	2026-05-12 21:01:22.884649	17
69	TKT661382	20	2026-05-14 17:46:18.812614	\N	\N	\N	Vente Directe	2026-05-14	Soute	Sfax	Médnine	Expédition 20 DT	21	\N	\N	\N	\N	TKT661382	\N	\N	9	00:00	6	16	\N	0	t	2026-05-14 17:47:06.370396	17
70	TKT157400	2.9000000000000004	2026-05-15 17:23:25.415592	24	\N	\N	Vente Directe	2026-05-15	A1	Sousse	Kalaa sghira	Tarif normal (Plein rapide)	3	\N	\N	\N	\N	TKT157400	\N	\N	8	17:23	2	1	\N	0	f	\N	\N
71	TKT352848	10.5	2026-05-18 20:47:45.646687	25	\N	\N	Vente Directe	2026-05-18	A2	Sousse	Enfidha	Tarif normal (Plein rapide)	3	\N	\N	\N	\N	TKT352848	\N	\N	8	20:47	2	1	\N	0	f	\N	\N
72	TKT13595	10.1	2026-05-18 20:51:33.045515	25	\N	\N	Vente Directe	2026-05-18	A1	Kalaa sghira	Bouficha	Tarif normal (Plein rapide)	3	\N	\N	\N	\N	TKT13595	\N	\N	8	20:51	2	1	\N	0	f	\N	\N
73	TKT286706	43.5	2026-05-19 14:59:36.999331	\N	\N	\N	Vente Directe	2026-05-19	A1	Sfax	Médnine	Tarif normal (Plein rapide)	21	\N	\N	\N	\N	TKT286706	\N	\N	9	00:00	6	1	\N	0	f	\N	\N
74	TKT940468	2.9000000000000004	2026-05-19 15:49:08.11195	26	\N	\N	Vente Directe	2026-05-19	A1	Sousse	Kalaa sghira	Tarif normal (Plein rapide)	3	\N	\N	\N	\N	TKT940468	\N	\N	8	15:48	2	1	\N	0	f	\N	\N
75	TKT427252	16.1	2026-05-19 15:49:45.642483	26	\N	\N	Vente Directe	2026-05-19	A1	Kalaa sghira	Bir Bouragba	Tarif normal (Plein rapide)	3	\N	\N	\N	\N	TKT427252	\N	\N	8	15:49	2	1	\N	0	f	\N	\N
76	TKT674417	9.100000000000001	2026-05-19 16:00:55.379356	26	\N	\N	Vente Directe	2026-05-19	A1	Kalaa sghira	Enfidha	Tarif normal (Plein rapide)	3	\N	\N	\N	\N	TKT674417	\N	\N	8	16:00	2	1	\N	0	f	\N	\N
77	TKT655818	9.100000000000001	2026-05-19 16:01:39.055758	26	\N	\N	Vente Directe	2026-05-19	A1	Kalaa sghira	Enfidha	Tarif normal (Plein rapide)	3	\N	\N	\N	\N	TKT655818	\N	\N	8	16:01	2	1	\N	0	f	\N	\N
78	TKT423684	9.100000000000001	2026-05-19 16:01:57.201528	26	\N	\N	Vente Directe	2026-05-19	A2	Kalaa sghira	Enfidha	Tarif normal (Plein rapide)	3	\N	\N	\N	\N	TKT423684	\N	\N	8	16:01	2	1	\N	0	f	\N	\N
79	TKT766570	9.100000000000001	2026-05-19 16:02:08.117511	26	\N	\N	Vente Directe	2026-05-19	A3	Kalaa sghira	Enfidha	Tarif normal (Plein rapide)	3	\N	\N	\N	\N	TKT766570	\N	\N	8	16:01	2	1	\N	0	f	\N	\N
80	TKT674472	29.5	2026-05-19 16:04:43.468613	\N	\N	\N	Vente Directe	2026-05-19	A1	Sfax	Gabés	Tarif normal (Plein rapide)	21	\N	\N	\N	\N	TKT674472	\N	\N	9	00:00	6	1	\N	0	f	\N	\N
81	TKT980984	7.375	2026-05-19 16:10:07.510845	\N	\N	\N	Vente Directe	2026-05-19	A1	Sfax	Gabés	75% PMR (personne mobilité réduite)	21	\N	\N	\N	\N	TKT980984	\N	\N	9	00:00	6	4	\N	0	f	\N	\N
82	TKT316656	53.5	2026-05-19 16:12:24.154644	\N	\N	\N	Vente Directe	2026-05-19	A1	Sfax	jerba houmet souk	Tarif normal (Plein rapide)	21	\N	\N	\N	\N	TKT316656	\N	\N	9	00:00	6	1	\N	0	f	\N	\N
83	TKT628835	43.5	2026-05-19 16:17:19.562699	\N	\N	\N	Vente Directe	2026-05-19	A1	Sfax	Médnine	Tarif normal (Plein rapide)	21	\N	\N	\N	\N	TKT628835	\N	\N	9	00:00	6	1	\N	0	t	2026-05-19 16:17:56.267786	17
84	TKT164697	22.125	2026-05-19 16:26:32.304835	\N	\N	\N	Vente Directe	2026-05-19	A1	Sfax	Gabés	25% rédu.	21	\N	\N	\N	\N	TKT164697	\N	\N	9	00:00	6	2	\N	0	f	\N	\N
85	TKT12793	53.5	2026-05-19 16:26:54.017663	\N	\N	\N	Vente Directe	2026-05-19	A1	Sfax	jerba houmet souk	Tarif normal (Plein rapide)	21	\N	\N	\N	\N	TKT12793	\N	\N	9	00:00	6	1	\N	0	f	\N	\N
86	TKT116523	55.5	2026-05-19 16:27:28.846189	\N	\N	\N	Vente Directe	2026-05-19	A1	Tunis	Sfax	Tarif normal (Plein rapide)	18	\N	\N	\N	\N	TKT116523	\N	\N	9	21:00	6	1	\N	0	f	\N	\N
87	TKT258015	107.5	2026-05-19 16:27:49.455479	\N	\N	\N	Vente Directe	2026-05-19	A2	Tunis	jerba houmet souk	Tarif normal (Plein rapide)	18	\N	\N	\N	\N	TKT258015	\N	\N	9	21:00	6	1	\N	0	f	\N	\N
88	TKT289157	15.25	2026-05-19 16:28:50.052287	\N	\N	\N	Vente Directe	2026-05-19	A3	Tunis	Sousse	50% rédu.	18	\N	\N	\N	\N	TKT289157	\N	\N	9	21:00	6	3	\N	0	f	\N	\N
22	TKT149641	5.5445	2026-04-26 12:58:46.253269	\N	\N	\N	Directe	2026-04-26	A1	Rades	ezzahra	75% Hand.	7	\N	\N	\N	\N	TKT149641	\N	\N	6	08:00	4	4	\N	5	t	2026-04-26 13:02:44.724277	\N
30	TKT627950	7.178	2026-04-26 23:36:12.183342	\N	\N	\N	Directe	2026-04-26	B5	Rades	ezzahra	Tarif normal (Plein rapide)	7	\N	\N	\N	\N	TKT627950	\N	\N	6	08:00	4	1	\N	5	f	\N	\N
47	TKT829475	13.002500000000001	2026-04-27 14:21:31.401215	\N	\N	\N	Vente Directe	2026-04-27	A2	Tunis	Sfax	Conv. Militaire	18	\N	\N	\N	\N	TKT829475	\N	\N	9	06:30	5	9	\N	5	f	\N	\N
46	TKT610908	13.002500000000001	2026-04-27 14:19:23.826339	\N	\N	\N	Vente Directe	2026-04-27	A2	Tunis	Sfax	Conv. Militaire	18	\N	\N	\N	\N	TKT610908	\N	\N	9	06:30	5	9	\N	5	t	2026-04-27 14:21:55.132591	17
60	TKT408947	27.23	2026-05-12 19:34:47.221442	\N	\N	\N	Vente Directe	2026-05-12	A1	Sfax	Médnine	Tarif normal (Plein rapide)	21	\N	\N	\N	\N	TKT408947	\N	\N	9	00:00	6	1	\N	2	f	\N	\N
89	TKT824031	2.1	2026-05-19 23:12:06.083622	\N	\N	\N	Réservations	2026-05-20	A1	Rades	ezzahra lycée	Tarif normal (Plein rapide)	7	\N	\N	\N	\N	TKT824031	\N	\N	6	08:00	4	1	\N	0	f	\N	\N
90	TKT442419	10.5	2026-05-22 15:14:07.031283	27	\N	\N	Vente Directe	2026-05-22	A1	Sousse	Enfidha	Tarif normal (Plein rapide)	3	\N	\N	\N	\N	TKT442419	\N	\N	8	15:13	2	1	\N	0	f	\N	\N
91	TKT264738	43.5	2026-05-22 15:16:32.209299	\N	\N	\N	Vente Directe	2026-05-22	A1	Sfax	Médnine	Tarif normal (Plein rapide)	21	\N	\N	\N	\N	TKT264738	\N	\N	9	00:00	6	1	\N	0	t	2026-05-22 15:17:05.613622	17
93	TKT618433	3.3750000000000004	2026-05-25 12:40:00.486571	28	\N	\N	Vente Directe	2026-05-25	A1	Kalaa sghira	Enfidha	75% PMR (personne mobilité réduite)	3	\N	\N	\N	\N	TKT618433	\N	\N	8	12:39	2	4	1	1.1	f	\N	\N
94	TKT206026	3.6	2026-05-25 12:40:45.21406	28	\N	\N	Vente Directe	2026-05-25	A2	Enfidha	Bouficha	Tarif normal (Plein rapide)	3	\N	\N	\N	\N	TKT206026	\N	\N	8	12:40	2	1	1	1.1	f	\N	\N
95	TKT9325	8.5	2026-05-25 12:43:28.448345	28	\N	\N	Vente Directe	2026-05-25	I2	Bouficha	Grombelia	Tarif normal (Plein rapide)	3	\N	\N	\N	\N	TKT9325	\N	\N	8	12:43	2	1	\N	0	f	\N	\N
92	TKT799914	29.25	2026-05-25 12:32:21.792627	\N	\N	\N	Vente Directe	2026-05-25	A1	Tunis	Sfax	50% rédu.	18	\N	\N	\N	\N	TKT799914	\N	\N	9	21:00	6	3	2	1.5	t	2026-05-25 12:44:21.133403	17
96	TKT362121	83.5	2026-05-25 16:51:04.822768	\N	\N	\N	Vente Directe	2026-05-25	A2	Tunis	Gabés	Tarif normal (Plein rapide)	20	\N	\N	\N	\N	TKT362121	\N	\N	9	21:00	6	1	\N	0	f	\N	\N
97	TKT958350	2.9000000000000004	2026-05-25 16:55:29.05936	32	\N	\N	Vente Directe	2026-05-25	A1	Sousse	Kalaa sghira	Tarif normal (Plein rapide)	3	\N	\N	\N	\N	TKT958350	\N	\N	8	16:55	2	1	\N	0	f	\N	\N
\.


--
-- Data for Name: trajet; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.trajet (id_trajet, arret, distance_km, num_ligne, id_tarif, duree_minutes, statut) FROM stdin;
41	Megrine Riadh	1	4	\N	0	Actif
42	Sidi Rzig	3	4	\N	0	Actif
43	Mégrine chaker 	4	4	\N	0	Actif
44	Saint Gaubain	8	4	\N	0	Actif
45	Tunis Marine	10	4	\N	0	Actif
56	Kalaa sghira	7	8	\N	0	Actif
57	Enfidha	45	8	\N	0	Actif
58	Bouficha	50	8	\N	0	Actif
59	Bir Bouragba	80	8	\N	0	Actif
60	Grombelia	85	8	\N	0	Actif
61	ezzahra lycée	3	6	\N	0	Actif
62	ezzahra	6	6	\N	0	Actif
63	borj cedria 	9	6	\N	0	Actif
84	Sousse	145	9	\N	60	Actif
85	Sfax	270	9	\N	120	Actif
86	Gabés	410	9	\N	1800	Actif
87	Médnine	480	9	\N	240	Actif
88	jerba houmet souk	530	9	\N	300	Actif
\.


--
-- Data for Name: type_bagage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.type_bagage (id_type_bagage, code, libelle, prix, actif) FROM stdin;
1	BAG_INF_250	Bagage < 250 km	1100	t
2	BAG_SUP_250	Bagage > 250 km	1500	t
\.


--
-- Data for Name: type_tarification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.type_tarification (id_type_tarification, code, libelle, categorie, mode_calcul, valeur, actif, remarque) FROM stdin;
2	RED_25	25% rédu.	VOYAGEUR	PERCENT_RESTANT	75	t	\N
3	RED_50	50% rédu.	VOYAGEUR	PERCENT_RESTANT	50	t	\N
5	GN_75	75% G. Nationale	VOYAGEUR	PERCENT_RESTANT	25	t	\N
6	RED_10	10% rédu.	VOYAGEUR	PERCENT_RESTANT	90	t	\N
7	RED_20	20% rédu.	VOYAGEUR	PERCENT_RESTANT	80	t	\N
8	FAVEUR	Titre faveur	VOYAGEUR	PERCENT_RESTANT	0	t	\N
9	CONV_MIL	Conv. Militaire	CONVENTION	PERCENT_RESTANT	25	t	\N
10	CONV_DOU	Conv. Douane	CONVENTION	PERCENT_RESTANT	25	t	\N
11	CONV_INT	Conv. M. Intérieur	CONVENTION	PERCENT_RESTANT	25	t	\N
12	CONV_CIV	Conv. P. Civile	CONVENTION	PERCENT_RESTANT	25	t	\N
13	EX_3	Expédition 3 DT	EXPEDITION	FIXE	3000	t	\N
14	EX_5	Expédition 5 DT	EXPEDITION	FIXE	5000	t	\N
15	EX_10	Expédition 10 DT	EXPEDITION	FIXE	10000	t	\N
1	PLEIN	Tarif normal (Plein rapide)	VOYAGEUR	PERCENT_RESTANT	100	t	\N
4	HAND_75	75% PMR (personne mobilité réduite)	VOYAGEUR	PERCENT_RESTANT	25	t	\N
16	EX_20	Expédition 20 DT	EXPEDITION	FIXE	20000	t	\N
\.


--
-- Data for Name: utilisateur; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.utilisateur (id_utilisateur, nom, prenom, matricule, mot_de_passe, role, email, num_tel, est_bloque, image_url) FROM stdin;
10	neili	omar	ADM-002	123456789	ADMIN	omarneili308@gmail.com	27 550 144	f	uploads/users/user-1776606249796-199835683.jpg
8	awidi	ghada	rec-4569	123456	RECEVEUR	ghadaawidi@gmail.com	25 147 896	f	uploads/users/user-1777219662386-538635055.jpg
1	Ben Ahmed	Amine	AG2024-001	3668e5ff	AGENT	bamin@gmail.com	23 024 571	f	uploads/users/user-1777219693285-741423821.jpg
7	ben salah	ali	14789	123456	AGENT	alibensalah@gmail.com	25 145 123	f	uploads/users/user-1777219705845-237931668.jpg
9	ben sami	ahmed	rec-1478	123456	RECEVEUR	ahmedbensami@gmail.com	92 589 623	f	uploads/users/user-1777219728226-822514215.jpg
14	hamdi	amine	10101	123456789	RECEVEUR	aminehamdi@gmail.com	26 896 321	f	uploads/users/user-1777219745479-310312108.jpg
17	karim	karim	11111	123456	CONTROLEUR	karim@yahoo.fr	25 365 896	f	uploads/users/user-1777219756884-718003412.jpg
12	mejri	ali	ag-007	8a7a19d5	AGENT	cristronald768@gmail.com	25 256 325	f	uploads/users/user-1777219766593-275164931.jpg
18	ouerfelli	amine	78945	123456	AGENT	amineouerfelli20@gmail.com	25 417 963	f	uploads/users/user-1777293314634-771982961.jpg
19	shlili	adel	20045	123456	RECEVEUR	adelshili@gmail.com	92 521 147 	f	uploads/users/user-1777294209848-858183109.jpg
3	ayari	sami	REC-014	123456789	RECEVEUR	ayarisami@gmail.com	26 547 263	f	uploads/users/user-1777219678785-998813686.jpg
20	kamel	ali	98765	123456	AGENT	kamelali@gmail.com	96 255 147	f	uploads/users/user-1777555742053-326274536.jpg
21	louay	ben said	32165	123456	AGENT	louaybensaid@gmail.com	28 741 523	f	uploads/users/user-1778521580650-85115890.png
13	arbii	kamel	12345	123456	AGENT	arbi@gmail.com	23 547 896	f	uploads/users/user-1777219642057-62079214.jpg
\.


--
-- Name: bus_id_bus_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bus_id_bus_seq', 6, true);


--
-- Name: demande_reinitialisation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.demande_reinitialisation_id_seq', 8, true);


--
-- Name: fiche_cloture_service_id_fiche_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fiche_cloture_service_id_fiche_seq', 25, true);


--
-- Name: fiche_controleur_service_id_fiche_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fiche_controleur_service_id_fiche_seq', 5, true);


--
-- Name: guichet_id_guichet_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.guichet_id_guichet_seq', 8, true);


--
-- Name: horaire_ligne_id_horaire_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.horaire_ligne_id_horaire_seq', 40, true);


--
-- Name: incident_id_incident_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.incident_id_incident_seq', 4, true);


--
-- Name: ligne_num_ligne_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ligne_num_ligne_seq', 9, true);


--
-- Name: service_id_service_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.service_id_service_seq', 32, true);


--
-- Name: tarif_id_tarif_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tarif_id_tarif_seq', 1, true);


--
-- Name: ticket_id_ticket_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_id_ticket_seq', 97, true);


--
-- Name: trajet_id_trajet_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.trajet_id_trajet_seq', 88, true);


--
-- Name: type_bagage_id_type_bagage_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.type_bagage_id_type_bagage_seq', 4, true);


--
-- Name: type_tarification_id_type_tarification_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.type_tarification_id_type_tarification_seq', 16, true);


--
-- Name: utilisateur_id_utilisateur_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.utilisateur_id_utilisateur_seq', 21, true);


--
-- Name: bus bus_numero_bus_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bus
    ADD CONSTRAINT bus_numero_bus_key UNIQUE (numero_bus);


--
-- Name: bus bus_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bus
    ADD CONSTRAINT bus_pkey PRIMARY KEY (id_bus);


--
-- Name: demande_reinitialisation demande_reinitialisation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.demande_reinitialisation
    ADD CONSTRAINT demande_reinitialisation_pkey PRIMARY KEY (id);


--
-- Name: fiche_cloture_service fiche_cloture_service_id_service_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiche_cloture_service
    ADD CONSTRAINT fiche_cloture_service_id_service_key UNIQUE (id_service);


--
-- Name: fiche_cloture_service fiche_cloture_service_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiche_cloture_service
    ADD CONSTRAINT fiche_cloture_service_pkey PRIMARY KEY (id_fiche);


--
-- Name: fiche_controleur_service fiche_controleur_service_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiche_controleur_service
    ADD CONSTRAINT fiche_controleur_service_pkey PRIMARY KEY (id_fiche);


--
-- Name: guichet guichet_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guichet
    ADD CONSTRAINT guichet_pkey PRIMARY KEY (id_guichet);


--
-- Name: horaire_ligne horaire_ligne_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.horaire_ligne
    ADD CONSTRAINT horaire_ligne_pkey PRIMARY KEY (id_horaire);


--
-- Name: incident incident_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incident
    ADD CONSTRAINT incident_pkey PRIMARY KEY (id_incident);


--
-- Name: ligne ligne_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ligne
    ADD CONSTRAINT ligne_pkey PRIMARY KEY (num_ligne);


--
-- Name: service service_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service
    ADD CONSTRAINT service_pkey PRIMARY KEY (id_service);


--
-- Name: tarif tarif_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tarif
    ADD CONSTRAINT tarif_pkey PRIMARY KEY (id_tarif);


--
-- Name: ticket ticket_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket
    ADD CONSTRAINT ticket_pkey PRIMARY KEY (id_ticket);


--
-- Name: ticket ticket_qr_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket
    ADD CONSTRAINT ticket_qr_code_key UNIQUE (qr_code);


--
-- Name: trajet trajet_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trajet
    ADD CONSTRAINT trajet_pkey PRIMARY KEY (id_trajet);


--
-- Name: type_bagage type_bagage_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_bagage
    ADD CONSTRAINT type_bagage_code_key UNIQUE (code);


--
-- Name: type_bagage type_bagage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_bagage
    ADD CONSTRAINT type_bagage_pkey PRIMARY KEY (id_type_bagage);


--
-- Name: type_tarification type_tarification_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_tarification
    ADD CONSTRAINT type_tarification_code_key UNIQUE (code);


--
-- Name: type_tarification type_tarification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_tarification
    ADD CONSTRAINT type_tarification_pkey PRIMARY KEY (id_type_tarification);


--
-- Name: utilisateur utilisateur_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_email_key UNIQUE (email);


--
-- Name: utilisateur utilisateur_matricule_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_matricule_key UNIQUE (matricule);


--
-- Name: utilisateur utilisateur_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_pkey PRIMARY KEY (id_utilisateur);


--
-- Name: bus bus_id_receveur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bus
    ADD CONSTRAINT bus_id_receveur_fkey FOREIGN KEY (id_receveur) REFERENCES public.utilisateur(id_utilisateur);


--
-- Name: bus bus_num_ligne_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bus
    ADD CONSTRAINT bus_num_ligne_fkey FOREIGN KEY (num_ligne) REFERENCES public.ligne(num_ligne) ON DELETE SET NULL;


--
-- Name: demande_reinitialisation demande_reinitialisation_id_utilisateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.demande_reinitialisation
    ADD CONSTRAINT demande_reinitialisation_id_utilisateur_fkey FOREIGN KEY (id_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- Name: fiche_cloture_service fiche_cloture_service_id_responsable_cloture_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiche_cloture_service
    ADD CONSTRAINT fiche_cloture_service_id_responsable_cloture_fkey FOREIGN KEY (id_responsable_cloture) REFERENCES public.utilisateur(id_utilisateur);


--
-- Name: fiche_cloture_service fiche_cloture_service_id_service_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiche_cloture_service
    ADD CONSTRAINT fiche_cloture_service_id_service_fkey FOREIGN KEY (id_service) REFERENCES public.service(id_service);


--
-- Name: fiche_controleur_service fiche_controleur_service_id_controleur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiche_controleur_service
    ADD CONSTRAINT fiche_controleur_service_id_controleur_fkey FOREIGN KEY (id_controleur) REFERENCES public.utilisateur(id_utilisateur);


--
-- Name: guichet guichet_id_agent_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guichet
    ADD CONSTRAINT guichet_id_agent_fkey FOREIGN KEY (id_agent) REFERENCES public.utilisateur(id_utilisateur) ON DELETE SET NULL;


--
-- Name: horaire_ligne horaire_ligne_num_ligne_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.horaire_ligne
    ADD CONSTRAINT horaire_ligne_num_ligne_fkey FOREIGN KEY (num_ligne) REFERENCES public.ligne(num_ligne) ON DELETE CASCADE;


--
-- Name: service service_id_bus_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service
    ADD CONSTRAINT service_id_bus_fkey FOREIGN KEY (id_bus) REFERENCES public.bus(id_bus);


--
-- Name: service service_id_receveur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service
    ADD CONSTRAINT service_id_receveur_fkey FOREIGN KEY (id_receveur) REFERENCES public.utilisateur(id_utilisateur);


--
-- Name: service service_num_ligne_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service
    ADD CONSTRAINT service_num_ligne_fkey FOREIGN KEY (num_ligne) REFERENCES public.ligne(num_ligne);


--
-- Name: ticket ticket_id_controleur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket
    ADD CONSTRAINT ticket_id_controleur_fkey FOREIGN KEY (id_controleur) REFERENCES public.utilisateur(id_utilisateur);


--
-- Name: ticket ticket_id_service_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket
    ADD CONSTRAINT ticket_id_service_fkey FOREIGN KEY (id_service) REFERENCES public.service(id_service);


--
-- Name: ticket ticket_id_type_bagage_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket
    ADD CONSTRAINT ticket_id_type_bagage_fkey FOREIGN KEY (id_type_bagage) REFERENCES public.type_bagage(id_type_bagage);


--
-- Name: ticket ticket_id_type_tarification_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket
    ADD CONSTRAINT ticket_id_type_tarification_fkey FOREIGN KEY (id_type_tarification) REFERENCES public.type_tarification(id_type_tarification);


--
-- Name: ticket ticket_id_vendeur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket
    ADD CONSTRAINT ticket_id_vendeur_fkey FOREIGN KEY (id_vendeur) REFERENCES public.utilisateur(id_utilisateur);


--
-- Name: trajet trajet_id_tarif_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trajet
    ADD CONSTRAINT trajet_id_tarif_fkey FOREIGN KEY (id_tarif) REFERENCES public.tarif(id_tarif);


--
-- Name: trajet trajet_num_ligne_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trajet
    ADD CONSTRAINT trajet_num_ligne_fkey FOREIGN KEY (num_ligne) REFERENCES public.ligne(num_ligne);


--
-- PostgreSQL database dump complete
--

\unrestrict W6L6Z3XSyXKSuVxtDKCbv6haccqbImRttCnaoUALWLoZmuPj2ZvFwy6R90y5IUL

