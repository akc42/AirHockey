--
-- PostgreSQL database dump
--

SET client_encoding = 'UTF8';
SET standard_conforming_strings = off;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET escape_string_warning = off;

--
-- Name: melindas_air; Type: COMMENT; Schema: -; Owner: melindas_air
--

COMMENT ON DATABASE melindas_air IS 'Air hockey database';


SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: event; Type: TABLE; Schema: public; Owner: melindas_air; Tablespace: 
--

CREATE TABLE event (
    eid integer NOT NULL,
    title character varying
);


ALTER TABLE public.event OWNER TO melindas_air;

--
-- Name: TABLE event; Type: COMMENT; Schema: public; Owner: melindas_air
--

COMMENT ON TABLE event IS 'Generic Table to hold event titles';


--
-- Name: event_eid_seq; Type: SEQUENCE; Schema: public; Owner: melindas_air
--

CREATE SEQUENCE event_eid_seq
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;


ALTER TABLE public.event_eid_seq OWNER TO melindas_air;

--
-- Name: event_eid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: melindas_air
--

ALTER SEQUENCE event_eid_seq OWNED BY event.eid;


--
-- Name: match; Type: TABLE; Schema: public; Owner: melindas_air; Tablespace: 
--

CREATE TABLE match (
    hid integer NOT NULL,
    aid integer NOT NULL,
    start_time bigint DEFAULT date_part('epoch'::text, now()) NOT NULL,
    end_time bigint,
    last_activity bigint DEFAULT date_part('epoch'::text, now()),
    mid integer NOT NULL,
    eid bigint,
    h1 smallint,
    h2 smallint,
    h3 smallint,
    h4 smallint,
    h5 smallint,
    h6 smallint,
    h7 smallint,
    a1 smallint,
    a2 smallint,
    a3 smallint,
    a4 smallint,
    a5 smallint,
    a6 smallint,
    a7 smallint,
    abandon character(1)
);


ALTER TABLE public.match OWNER TO melindas_air;

--
-- Name: TABLE match; Type: COMMENT; Schema: public; Owner: melindas_air
--

COMMENT ON TABLE match IS 'match';


--
-- Name: COLUMN match.last_activity; Type: COMMENT; Schema: public; Owner: melindas_air
--

COMMENT ON COLUMN match.last_activity IS 'The time is recorded when ever activity occurs in the match';


--
-- Name: COLUMN match.eid; Type: COMMENT; Schema: public; Owner: melindas_air
--

COMMENT ON COLUMN match.eid IS 'Event ID, if null then a friendly match';


--
-- Name: COLUMN match.abandon; Type: COMMENT; Schema: public; Owner: melindas_air
--

COMMENT ON COLUMN match.abandon IS 'Set Non Null to indicate abandoned match';


--
-- Name: player; Type: TABLE; Schema: public; Owner: melindas_air; Tablespace: 
--

CREATE TABLE player (
    pid integer NOT NULL,
    name character varying NOT NULL,
    mu real DEFAULT 50 NOT NULL,
    sigma real DEFAULT 16.6666666667 NOT NULL,
    last_match bigint DEFAULT date_part('epoch'::text, now()) NOT NULL,
    iid integer DEFAULT 0 NOT NULL,
    last_poll bigint DEFAULT date_part('epoch'::text, now()) NOT NULL,
    state smallint DEFAULT 0 NOT NULL,
    last_state bigint DEFAULT date_part('epoch'::text, now())
);


ALTER TABLE public.player OWNER TO melindas_air;

--
-- Name: TABLE player; Type: COMMENT; Schema: public; Owner: melindas_air
--

COMMENT ON TABLE player IS 'Users who may play';


--
-- Name: COLUMN player.pid; Type: COMMENT; Schema: public; Owner: melindas_air
--

COMMENT ON COLUMN player.pid IS 'user id from forum';


--
-- Name: COLUMN player.name; Type: COMMENT; Schema: public; Owner: melindas_air
--

COMMENT ON COLUMN player.name IS 'display name from forum';


--
-- Name: COLUMN player.mu; Type: COMMENT; Schema: public; Owner: melindas_air
--

COMMENT ON COLUMN player.mu IS 'scoring';


--
-- Name: COLUMN player.sigma; Type: COMMENT; Schema: public; Owner: melindas_air
--

COMMENT ON COLUMN player.sigma IS 'scoring';


--
-- Name: COLUMN player.last_match; Type: COMMENT; Schema: public; Owner: melindas_air
--

COMMENT ON COLUMN player.last_match IS 'time (in seconds from 1970) of last match';


--
-- Name: COLUMN player.iid; Type: COMMENT; Schema: public; Owner: melindas_air
--

COMMENT ON COLUMN player.iid IS 'if not null uid of person being invited';


--
-- Name: COLUMN player.state; Type: COMMENT; Schema: public; Owner: melindas_air
--

COMMENT ON COLUMN player.state IS '0= offline, 1=spectator, 2 = play anyone, 3 = invite only, 4 = invite accepted, 5 = in match, 6 = in practice';


--
-- Name: COLUMN player.last_state; Type: COMMENT; Schema: public; Owner: melindas_air
--

COMMENT ON COLUMN player.last_state IS 'Time of last state change';


--
-- Name: full_match; Type: VIEW; Schema: public; Owner: melindas_air
--

CREATE VIEW full_match AS
    SELECT m.hid, m.aid, m.start_time, m.end_time, m.last_activity, m.mid, m.eid, e.title, m.h1, m.h2, m.h3, m.h4, m.h5, m.h6, m.h7, m.a1, m.a2, m.a3, m.a4, m.a5, m.a6, m.a7, h.name AS hname, a.name AS aname, m.abandon FROM (((match m JOIN player h ON ((m.hid = h.pid))) JOIN player a ON ((m.aid = a.pid))) LEFT JOIN event e USING (eid));


ALTER TABLE public.full_match OWNER TO melindas_air;

--
-- Name: VIEW full_match; Type: COMMENT; Schema: public; Owner: melindas_air
--

COMMENT ON VIEW full_match IS 'match including event title and players names';


--
-- Name: match_mid_seq; Type: SEQUENCE; Schema: public; Owner: melindas_air
--

CREATE SEQUENCE match_mid_seq
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;


ALTER TABLE public.match_mid_seq OWNER TO melindas_air;

--
-- Name: match_mid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: melindas_air
--

ALTER SEQUENCE match_mid_seq OWNED BY match.mid;


--
-- Name: eid; Type: DEFAULT; Schema: public; Owner: melindas_air
--

ALTER TABLE event ALTER COLUMN eid SET DEFAULT nextval('event_eid_seq'::regclass);


--
-- Name: mid; Type: DEFAULT; Schema: public; Owner: melindas_air
--

ALTER TABLE match ALTER COLUMN mid SET DEFAULT nextval('match_mid_seq'::regclass);


--
-- Name: event_pkey; Type: CONSTRAINT; Schema: public; Owner: melindas_air; Tablespace: 
--

ALTER TABLE ONLY event
    ADD CONSTRAINT event_pkey PRIMARY KEY (eid);


--
-- Name: match_pkey; Type: CONSTRAINT; Schema: public; Owner: melindas_air; Tablespace: 
--

ALTER TABLE ONLY match
    ADD CONSTRAINT match_pkey PRIMARY KEY (mid);


--
-- Name: user_pkey; Type: CONSTRAINT; Schema: public; Owner: melindas_air; Tablespace: 
--

ALTER TABLE ONLY player
    ADD CONSTRAINT user_pkey PRIMARY KEY (pid);


--
-- Name: index_invite; Type: INDEX; Schema: public; Owner: melindas_air; Tablespace: 
--

CREATE INDEX index_invite ON player USING btree (iid);


--
-- Name: match_aid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: melindas_air
--

ALTER TABLE ONLY match
    ADD CONSTRAINT match_aid_fkey FOREIGN KEY (aid) REFERENCES player(pid) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: match_eid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: melindas_air
--

ALTER TABLE ONLY match
    ADD CONSTRAINT match_eid_fkey FOREIGN KEY (eid) REFERENCES event(eid) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: match_hid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: melindas_air
--

ALTER TABLE ONLY match
    ADD CONSTRAINT match_hid_fkey FOREIGN KEY (hid) REFERENCES player(pid) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

