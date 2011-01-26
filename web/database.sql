
-- 	Copyright (c) 2009-2011 Alan Chandler
--    This file is part of AirHockey, an real time simulation of Air Hockey
--    for playing over the internet.

--    AirHockey is free software: you can redistribute it and/or modify
--    it under the terms of the GNU General Public License as published by
--    the Free Software Foundation, either version 3 of the License, or
--    (at your option) any later version.

--    AirHockey is distributed in the hope that it will be useful,
--    but WITHOUT ANY WARRANTY; without even the implied warranty of
--    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
--    GNU General Public License for more details.

--    You should have received a copy of the GNU General Public License
--    along with AirHockey (file supporting/COPYING.txt).  If not, 
--    see <http://www.gnu.org/licenses/>.



BEGIN;


CREATE TABLE event (
    eid integer PRIMARY KEY,
    title character varying
);

CREATE TABLE match (
    mid integer PRIMARY KEY,
    hid integer NOT NULL REFERENCES player(pid) ON UPDATE CASCADE ON DELETE CASCADE,
    aid integer NOT NULL REFERENCES player(pid) ON UPDATE CASCADE ON DELETE CASCADE,
    start_time bigint DEFAULT (strftime('%s','now')) NOT NULL,
    end_time bigint,
    last_activity bigint bigint DEFAULT (strftime('%s','now')) ,  --The time is recorded when ever activity occurs in the match
    eid bigint REFERENCES event(eid) ON UPDATE CASCADE ON DELETE SET NULL,  --Event ID, if null then a friendly match
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
    abandon character(1) --Set Non Null to indicate abandoned match
);

CREATE TABLE player (
    pid integer PRIMARY KEY, --user id from forum
    name character varying NOT NULL, -- display name from forum
    mu real DEFAULT 50 NOT NULL, -- ladder scoring param
    sigma double precision DEFAULT 16.6666666667 NOT NULL, -- ladder scoring param
    last_match bigint, --time of last match completed (needed in calculation of sigma)
    iid integer DEFAULT 0 NOT NULL, -- if not null uid of person being invited
    last_poll bigint DEFAULT (strftime('%s','now')) NOT NULL, --marks time online but not in a match
    state smallint DEFAULT 0 NOT NULL, -- 0= offline, 1=spectator, 2 = play anyone, 3 = invite only, 4 = invite accepted, 5 = in match, 6 = in practice
    last_state bigint DEFAULT (strftime('%s','now')) -- time of last state change, or score in a match
);
CREATE INDEX index_invite ON player(iid);


-- match including event title and players names
CREATE VIEW full_match AS
    SELECT m.hid, m.aid, m.start_time, m.end_time, m.last_activity, m.mid, m.eid, e.title, m.h1, m.h2, m.h3, m.h4, m.h5, m.h6, m.h7, m.a1, m.a2, m.a3, m.a4, m.a5, m.a6, m.a7, h.name AS hname, a.name AS aname, m.abandon FROM (((match m JOIN player h ON ((m.hid = h.pid))) JOIN player a ON ((m.aid = a.pid))) LEFT JOIN event e USING (eid));

END TRANSACTION;

-- set it all up as Write Ahead Log for max performance and minimum contention with other users (if available_.
PRAGMA journal_mode=WAL;

