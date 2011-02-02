
-- 	Copyright (c) 2011 Alan Chandler
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


-- updates database to version 2 from version 1

BEGIN;
CREATE TABLE config (
	name text PRIMARY_KEY,
	value text
);
INSERT INTO config(name,value) VALUES('version','2');

ALTER TABLE match RENAME TO tmpmatch;

CREATE TABLE match (
    mid integer PRIMARY KEY,
    hid integer NOT NULL REFERENCES player(pid) ON UPDATE CASCADE ON DELETE CASCADE,
    aid integer REFERENCES player(pid) ON UPDATE CASCADE ON DELETE SET NULL,
    start_time bigint DEFAULT (strftime('%s','now')) NOT NULL,
    end_time bigint,
    last_activity bigint DEFAULT (strftime('%s','now')) NOT NULL,  --The time is recorded when ever activity occurs in the match
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
    abandon character(1) --Set Non Null to indicate abandoned match  A= abandoned P = finished practice D= may be deleted
);


INSERT INTO match SELECT * FROM tmpmatch;
DROP TABLE tmpmatch;

-- match including event title and players names
DROP VIEW full_match;

CREATE VIEW full_match AS
    SELECT hid, aid, start_time, end_time, last_activity, mid, m.eid AS eid, title, h1, h2, h3, h4, h5, h6, h7, a1, a2, a3, a4, a5, a6, a7, h.name AS hname, a.name AS aname, abandon FROM match m JOIN player h ON m.hid = h.pid LEFT JOIN player a ON m.aid = a.pid LEFT JOIN event e ON m.eid = e.eid;

END TRANSACTION;

