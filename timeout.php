<?php
if (!defined('AIRH'))
	die('Hacking attempt...');

define('AIR_HOCKEY_OFFLINE_USER',	5); //No of minutes before online user goes offline through lack of activity
define('AIR_HOCKEY_MATCH_ABANDON', 10); //No of minutes before lack of match action assumes match to be abandoned
define('AIR_HOCKEY_MATCH_REMOVE', 100000); //Approx two months after match we remove friendlies (tournament matches are kept forever);

$offline=time() - 60*AIR_HOCKEY_OFFLINE_USER;  //calculate when the last poll should have been
$abandon = time() - 60*AIR_HOCKEY_MATCH_ABANDON;
$remove = time() = 60*AIR_HOCKEY_MATCH_REMOVE;

dbQuery('BEGIN;');
$result = dbQuery('SELECT hid,aid, start_time, end_time, last_activity FROM match WHERE last_activity < '.dbMakeSafe($abandon).' AND end_time IS NULL ;');
while ($row = dbFetch($result)) {
	dbQuery('UPDATE user SET online_type = '.OFFLINE.' WHERE online_type = '.MATCH
			.' AND (uid = '.dbMakeSafe($row['hid']).' OR uid = '.dbMakeSafe($row['aid']).') ;');
	dbQuery('DELETE FROM match WHERE hid = '.dbMakeSafe($row['hid'])
			.' AND aid = '.dbMakeSafe($row['aid']).' AND start_time = '.dbMakeSafe($row['start_time']).';');
}
dbQuery('UPDATE user SET online_type = '.OFFLINE.' WHERE last_poll < '.dbMakeSafe($offline).' AND online_type BETWEEN 1 AND 3 ;');
dbQuery('DELETE FROM match WHERE start_time < '.dbMakeSafe($remove).' AND event IS NULL;');
dbQuery('COMMIT;');
?>