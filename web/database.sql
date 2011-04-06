
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

CREATE TABLE config (
	name text PRIMARY_KEY,
	value real
);
INSERT INTO config(name,value) VALUES('version',3);
INSERT INTO config(name,value) VALUES('MAX_MATCHLIST_SIZE',10); --Maximum Size of Matchlist on index page

-- Various timeouts
INSERT INTO config(name,value) VALUES('OFFLINE_USER',300); --No of seconds before online user goes offline through lack of activity
INSERT INTO config(name,value) VALUES('PRACTICE_ABANDON_REMOVE',1800); --No of seconds before practice or abandon matches are removed from list and marked for delete
INSERT INTO config(name,value) VALUES('DELETE_REMOVE',60); --No of seconds before deleted matches are removed from the database
INSERT INTO config(name,value) VALUES('MATCH_REMOVE', 60); --No of days after match we remove friendlies (tournament matches are kept forever);
INSERT INTO config(name,value) VALUES('PLAYER_REMOVE',300); --No of days we remove players with no activity (unless they are in a match being kept)

-- Data for model
INSERT INTO config(name,value) VALUES('POLL',10000); --milliseconds delay between polls for new info on main page
INSERT INTO config(name,value) VALUES('MODEL_TICK',33);	--milliseconds between calculating new table layout
INSERT INTO config(name,value) VALUES('OPPONENT_TIMEOUT',30000); --Milliseconds to wait for opponent to arrive in match (approx 30 secs)
INSERT INTO config(name,value) VALUES('MODEL_TIMEOUT',5000);  --Milliseconds to wait until assume comms running the model have died (approx 2 secs)
INSERT INTO config(name,value) VALUES('TIMEOUT_LIMIT',3);  --No of times model timeout can occur before aborting the whole thing
INSERT INTO config(name,value) VALUES('MODEL_MAX_SPEED',3.5);	--Max distance puck can travel in a millisecond
INSERT INTO config(name,value) VALUES('START_DELAY',5);		--Seconds after both sides have synchronised before puck is in play 
INSERT INTO config(name,value) VALUES('STARTUP_DELAY',800); --Milliseconds to start up model after we thing we are synchonised
INSERT INTO config(name,value) VALUES('MALLET_DELAY',500);   -- Millisecs between when mallet positions get sent
INSERT INTO config(name,value) VALUES('MYSIDE_TIMEOUT',	7);	--Seconds before a violation of too long my side
INSERT INTO config(name,value) VALUES('OFFSET_COUNT',10); --how many measurements of time offset do we need to get a good average
INSERT INTO config(name,value) VALUES('RESTART_DELAY',10);  --Seconds you have after foul or goal to place puck
INSERT INTO config(name,value) VALUES('CONTROL_DELAY',2000); --Milliseconds to have puck on your side to be "in Control" of it
INSERT INTO config(name,value) VALUES('INPLAY_DELAY',2); --Seconds after puck served that allowed to hit it
INSERT INTO config(name,value) VALUES('MATCH_POLL',60000); --Milliseconds between polls whilst in match to show still here
INSERT INTO config(name,value) VALUES('MALLET_POSITION',148);  --Mallet starting position measured in model coordinate from goal

-- Data only required when practicing
INSERT INTO config(name,value) VALUES('PRACTICE_STARTUP_DELAY',4000); --Milliseconds to start mallet moving towards puck initially
INSERT INTO config(name,value) VALUES('PRACTICE_DELAY',3500); --Milliseconds after Match Start that We move practice mallet 
INSERT INTO config(name,value) VALUES('PRACTICE_TICK',50); --Millisecond per tick in the Practice Model of the mallet
INSERT INTO config(name,value) VALUES('PRACTICE_CENTRE_X',560); -- X coordinate of centre of circle for mallets rest motion
INSERT INTO config(name,value) VALUES('PRACTICE_CENTRE_Y',2006); -- Y coordinate of centre of circle for mallets rest motion
INSERT INTO config(name,value) VALUES('PRACTICE_RADIUS',200); -- Radius of circle for mallets rest motion
INSERT INTO config(name,value) VALUES('PRACTICE_DISTANCE',0.3); -- Distance travelled by mallet in a millisecond (normal)
INSERT INTO config(name,value) VALUES('PRACTICE_SERVE_X',560); -- X Coordinate of Serve Position 
INSERT INTO config(name,value) VALUES('PRACTICE_SERVE_Y',1290); -- Y Coordinate of Serve Position
INSERT INTO config(name,value) VALUES('PRACTICE_RANDOM',40); --degree of randomness in Serve Position
INSERT INTO config(name,value) VALUES('PRACTICE_SERVE_DELAY',4000); -- Milliseconds request to start serving
INSERT INTO config(name,value) VALUES('PRACTICE_HIT_DELAY',2500); --Milliseconds after serving to start moving towards puck (to hit it)

CREATE TABLE event (
    eid integer PRIMARY KEY,
    title character varying
);

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

CREATE TABLE player (
    pid integer PRIMARY KEY, --user id from forum
    name character varying NOT NULL, -- display name from forum
    mu real DEFAULT 1500.0 NOT NULL, -- ladder scoring param
    sigma double precision DEFAULT 350.0 NOT NULL, -- ladder scoring param
    last_match bigint, --time of last match completed (needed in calculation of sigma)
    iid integer DEFAULT 0 NOT NULL, -- if not null uid of person being invited
    last_poll bigint DEFAULT (strftime('%s','now')) NOT NULL, --marks time online but not in a match
    state smallint DEFAULT 0 NOT NULL, -- 0= offline, 1=spectator, 2 = play anyone, 3 = invite only, 4 = invite accepted, 5 = in match, 6 = in practice
    last_state bigint DEFAULT (strftime('%s','now')) -- time of last state change, or score in a match
);
CREATE INDEX index_invite ON player(iid);


-- match including event title and players names
CREATE VIEW full_match AS
    SELECT hid, aid, start_time, end_time, last_activity, mid, m.eid AS eid, title, h1, h2, h3, h4, h5, h6, h7, a1, a2, a3, a4, a5, a6, a7, h.name AS hname, a.name AS aname, abandon FROM match m JOIN player h ON m.hid = h.pid LEFT JOIN player a ON m.aid = a.pid LEFT JOIN event e ON m.eid = e.eid;

END TRANSACTION;

-- set it all up as Write Ahead Log for max performance and minimum contention with other users (if available_.
--PRAGMA journal_mode=WAL;

