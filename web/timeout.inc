<?php
/*
 	Copyright (c) 2009-2011 Alan Chandler
    This file is part of AirHockey, an real time simulation of Air Hockey
    for playing over the internet.

    AirHockey is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    AirHockey is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with AirHockey (file supporting/COPYING.txt).  If not, 
    see <http://www.gnu.org/licenses/>.

*/

define('AIR_HOCKEY_OFFLINE_USER',	5); //No of minutes before online user goes offline through lack of activity
define('AIR_HOCKEY_MATCH_ABANDON',30); //No of minutes before abandon matches are removed
define('AIR_HOCKEY_MATCH_REMOVE', 60); //No of days after match we remove friendlies (tournament matches are kept forever);
define('AIR_HOCKEY_PLAYER_REMOVE',300); //No of days we remove players with no activity (unless they are in a match being kept)

$players = $db->prepare("UPDATE player SET state = ".OFFLINE." WHERE last_poll < ? ");
$players->bindValue(1,time() - 60*AIR_HOCKEY_OFFLINE_USER,PDO::PARAM_INT);

$abandon = $db->prepare(" 
UPDATE match SET abandon = 'A', last_activity = (strftime('%s','now')), end_time = (strftime('%s','now')) 
WHERE mid IN (
	SELECT mid 
	FROM match 
	JOIN player h ON match.hid = h.pid
	JOIN player a ON match.aid = a.pid
	WHERE
		end_time IS NULL
		AND h.state = ".OFFLINE."
		AND a.state = ".OFFLINE."
)");

$mremove = $db->prepare("DELETE FROM match WHERE (start_time < ? AND  eid IS NULL) OR (abandon IS NOT NULL AND end_time < ? )");
$mremove->bindValue(1,time() - 86400*AIR_HOCKEY_MATCH_REMOVE,PDO::PARAM_INT);
$mremove->bindValue(2,time() - 60*AIR_HOCKEY_MATCH_ABANDON,PDO::PARAM_INT);

$premove = $db->prepare("
DELETE FROM player 
WHERE 
	last_poll < ? 
	AND pid NOT IN (
		SELECT hid AS pid FROM match h
		UNION 
		SELECT aid AS pid FROM match a
	)
");
$premove->bindValue(1,time() - 86400*AIR_HOCKEY_PLAYER_REMOVE,PDO::PARAM_INT);

$db->beginTransaction();

$players->execute(); //Mark all players with no polling going on for a while as OFFLINE
$players->closeCursor();
$abandon->execute();  //abandon matches they had not already finished and both players are offline
$abandon->closeCursor();
$mremove->execute(); //remove stale matches
$mremove->closeCursor();
$premove->execute(); //remove stale users
$premove->clostCursor();

$db->commit();
?>
