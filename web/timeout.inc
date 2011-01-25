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
define('AIR_HOCKEY_MATCH_ABANDON', 10); //No of minutes before lack of match action assumes match to be abandoned
define('AIR_HOCKEY_MATCH_REMOVE', 100000); //Approx two months after match we remove friendlies (tournament matches are kept forever);

$rightnow = dbMakeSafe(time());
$offline=dbMakeSafe(time() - 60*AIR_HOCKEY_OFFLINE_USER);  //calculate when the last poll should have been
$abandon = dbMakeSafe(time() - 60*AIR_HOCKEY_MATCH_ABANDON);
$remove = dbMakeSafe(time() - 60*AIR_HOCKEY_MATCH_REMOVE);
dbQuery('BEGIN;');
$result = dbQuery('SELECT mid,hid,aid, start_time, end_time, last_activity FROM match WHERE last_activity < '.$abandon
		.' AND end_time IS NULL ;');
while ($row = dbFetch($result)) {
	dbQuery('UPDATE player SET state = '.OFFLINE.', last_state = '.$rightnow.' WHERE state = '.MATCH
			.' AND (pid = '.dbMakeSafe($row['hid']).' OR pid = '.dbMakeSafe($row['aid']).') ;');
	dbQuery('UPDATE match SET abandon = \'A\', last_activity = '.$rightnow.', end_time = '.$rightnow.' WHERE mid = '.dbMakeSafe($row['mid']).';');
}
dbQuery('UPDATE player SET state = '.OFFLINE.' , last_state = '.$rightnow
		.' WHERE ( last_poll < '.$offline.' AND state BETWEEN '.SPECTATOR.' AND '.INVITE.' )'
		.' OR ( last_poll < '.$abandon.' AND state BETWEEN '.MATCH.' AND '.PRACTICE.' );');
dbQuery('DELETE FROM match WHERE (start_time < '.$remove.' AND eid IS NULL) OR (abandon IS NOT NULL AND end_time < '.$abandon.') ;');
dbQuery('COMMIT;');
?>
