<?php
  /*
    Air Hockey - Match  module
	Copyright (c) 2009 Alan Chandler
	Licenced under the GPL
*/
if(!(isset($_POST['uid'])  && isset($_POST['pass'])&& isset($_POST['m'])&& isset($_POST['g'])&& isset($_POST['h'])&& isset($_POST['a'])))
	die('Log - Hacking attempt - wrong parameters');
$uid = $_POST['uid']; //extra security for abort so it doesn't get missued
if ($_POST['pass'] != sha1("Air".$uid))
	die('Log - Hacking attempt got: '.$_POST['pass'].' expected: '.sha1("Air".$uid));
// Show all errors:
error_reporting(E_ALL);
$mid = $_POST['m'];
// Path to the air hockety directory:
define ('AIRH',1);   //defined so we can control access to some of the files.
require_once('db.php');

dbQuery('BEGIN;');
$now = dbPostSafe(time());
$g = $_POST['g'];

$result = dbQuery('SELECT * FROM match WHERE mid = '.dbMakeSafe($mid).' ;');
if($row = dbFetch($result)) {
	dbFree($result);
	if($g > 0) {
		dbQuery('UPDATE match SET  last_activity = '.$now.', h'.$g.' = '.dbPostSafe($_POST['h']).' , a'.$g.' = '.dbPostSafe($_POST['a'])
				.' WHERE mid = '.dbMakeSafe($mid).' ;');
		dbQuery('UPDATE player SET last_poll = '.$now.' WHERE pid = '.$row['hid'].' OR pid = '.$row['aid'].' ;');
	} else {
		if($g == 0) {
			dbQuery('UPDATE match SET  last_activity = '.$now.', end_time = '.$now.' WHERE mid = '.dbMakeSafe($mid).' ;');
// so we need to update the players results 
			if($_POST['h'] == 7) {
				//winner was home player
				$winner = $row['hid'];
				$loser = $row['aid'];
			} else {
				$winner = $row['aid'];
				$loser= $row['hid'];
			}
			$result = dbQuery('SELECT pid, mu, sigma, new_sigma FROM player_rating WHERE pid = '.dbmakeSafe($winner).' ;');
			$w = dbFetch($result);
			dbFree($result);
			$result = dbQuery('SELECT pid, mu, sigma, new_sigma FROM player_rating WHERE pid = '.dbmakeSafe($loser).' ;');
			$l = dbFetch($result);
			dbFree($result);
			//use glicko method to update mu and sigma http://math.bu.edu/people/mg/glicko/glicko.doc/glicko.html
			$q=0.0057565;
			$wg = 1/sqrt(1+(3*$q*$q*pow($w['sigma'],2)/(2*M_PI)));
			$lg = 1/sqrt(1+(3*$q*$q*pow($l['sigma'],2)/(2*M_PI)));
			$wE = 1/(1+pow(10,-$lg*($w['mu']-$l['mu'])/400));
			$lE = 1/(1+pow(10,-$wg*($l['mu']-$w['mu'])/400));
			$wd2 = 1/($q*$q*$lg*$lg*$wE*(1-$wE));
			$ld2 = 1/($q*$q*$wg*$wg*$lE*(1-$lE));
			$w['mu'] += ($q/(1/($w['new_sigma']*$w['new_sigma'])+1/$wd2))*$lg*(1-$wE);
			$l['mu'] -= ($q/(1/($l['new_sigma']*$l['new_sigma'])+1/$ld2))*$lg*$lE;
			$w['sigma'] = sqrt(1/(1/($w['new_sigma']*$w['new_sigma']) + 1/$wd2));
			$l['sigma'] = sqrt(1/(1/($l['new_sigma']*$l['new_sigma']) + 1/$ld2));
			dbQuery('UPDATE player SET mu = '.dbPostSafe($w['mu']).' , sigma = '.dbPostSafe($w['sigma'])
									.' , last_match = '.$now.' WHERE pid = '.dbPostSafe($winner).' ;');
			dbQuery('UPDATE player SET mu = '.dbPostSafe($l['mu']).' , sigma = '.dbPostSafe($l['sigma'])
			.' , last_match = '.$now.' WHERE pid = '.dbPostSafe($loser).' ;');
		} else {
			dbQuery('UPDATE match SET  last_activity = '.$now.', end_time = '.$now.', abandon = \'A\' WHERE mid = '.dbMakeSafe($mid).' ;');
		}
	}
	dbQuery('COMMIT;');
	echo '{"OK":true}';
} else {
	dbQuery('ROLLBACK;');
	echo 'Match with mid = '.$mid.' does not exist';
}
?>
