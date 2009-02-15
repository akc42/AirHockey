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
-- Name: match; Type: TABLE; Schema: public; Owner: alan; Tablespace: 
--

CREATE TABLE match (
    hid integer NOT NULL,
    aid integer NOT NULL,
    hscore integer[],
    ascore integer[],
    start_time bigint DEFAULT date_part('epoch'::text, now()) NOT NULL,
    end_time bigint
);


ALTER TABLE public.match OWNER TO alan;

--
-- Name: TABLE match; Type: COMMENT; Schema: public; Owner: alan
--

COMMENT ON TABLE match IS 'match';


--
-- Name: user; Type: TABLE; Schema: public; Owner: alan; Tablespace: 
--

CREATE TABLE "user" (
    uid integer NOT NULL,
    name character varying NOT NULL,
    mu real DEFAULT 50 NOT NULL,
    sigma real DEFAULT 16.6666666667 NOT NULL,
    last_match bigint DEFAULT date_part('epoch'::text, now()) NOT NULL,
    online_type character(1) DEFAULT 'O'::bpchar NOT NULL,
    iid integer,
    last_poll bigint DEFAULT date_part('epoch'::text, now()) NOT NULL,
    invite_accepted boolean DEFAULT false
);


ALTER TABLE public."user" OWNER TO alan;

--
-- Name: TABLE "user"; Type: COMMENT; Schema: public; Owner: alan
--

COMMENT ON TABLE "user" IS 'Register Users';


--
-- Name: COLUMN "user".uid; Type: COMMENT; Schema: public; Owner: alan
--

COMMENT ON COLUMN "user".uid IS 'user id from forum';


--
-- Name: COLUMN "user".name; Type: COMMENT; Schema: public; Owner: alan
--

COMMENT ON COLUMN "user".name IS 'display name from forum';


--
-- Name: COLUMN "user".mu; Type: COMMENT; Schema: public; Owner: alan
--

COMMENT ON COLUMN "user".mu IS 'scoring';


--
-- Name: COLUMN "user".sigma; Type: COMMENT; Schema: public; Owner: alan
--

COMMENT ON COLUMN "user".sigma IS 'scoring';


--
-- Name: COLUMN "user".last_match; Type: COMMENT; Schema: public; Owner: alan
--

COMMENT ON COLUMN "user".last_match IS 'time (in seconds from 1970) of last match';


--
-- Name: COLUMN "user".online_type; Type: COMMENT; Schema: public; Owner: alan
--

COMMENT ON COLUMN "user".online_type IS 'O=opfflne, S=spectator, A=available, P=practicing, I=invite only, M=match';


--
-- Name: COLUMN "user".iid; Type: COMMENT; Schema: public; Owner: alan
--

COMMENT ON COLUMN "user".iid IS 'if not null uid of person being invited';


--
-- Name: COLUMN "user".invite_accepted; Type: COMMENT; Schema: public; Owner: alan
--

COMMENT ON COLUMN "user".invite_accepted IS 'Set true if either invite accepted or anyone match set up';


--
-- Name: match_pkey; Type: CONSTRAINT; Schema: public; Owner: alan; Tablespace: 
--

ALTER TABLE ONLY match
    ADD CONSTRAINT match_pkey PRIMARY KEY (hid, aid, start_time);


--
-- Name: user_pkey; Type: CONSTRAINT; Schema: public; Owner: alan; Tablespace: 
--

ALTER TABLE ONLY "user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (uid);


--
-- Name: index_invite; Type: INDEX; Schema: public; Owner: alan; Tablespace: 
--

CREATE INDEX index_invite ON "user" USING btree (iid);


--
-- Name: match_aid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: alan
--

ALTER TABLE ONLY match
    ADD CONSTRAINT match_aid_fkey FOREIGN KEY (aid) REFERENCES "user"(uid) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: match_hid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: alan
--

ALTER TABLE ONLY match
    ADD CONSTRAINT match_hid_fkey FOREIGN KEY (hid) REFERENCES "user"(uid) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_iid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: alan
--

ALTER TABLE ONLY "user"
    ADD CONSTRAINT user_iid_fkey FOREIGN KEY (iid) REFERENCES "user"(uid) ON UPDATE SET NULL ON DELETE SET NULL;


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

