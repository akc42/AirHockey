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

/*
	Handles the case when a score occurs
*/

if(!(isset($_POST['uid'])  && isset($_POST['pass'])&& isset($_POST['m'])&& isset($_POST['g'])&& isset($_POST['h'])&& isset($_POST['a'])))
	die('Log - Hacking attempt - wrong parameters');
$uid = $_POST['uid']; //extra security for abort so it doesn't get missued
if ($_POST['pass'] != sha1("Air".$uid))
	die('Log - Hacking attempt got: '.$_POST['pass'].' expected: '.sha1("Air".$uid));

$mid = $_POST['m'];

require_once('./db.inc');

$g = $_POST['g'];

$match = $db->prepare("SELECT count(*) FROM match WHERE mid = ?");
$match->bindValue(1,$mid,PDO::PARAM_INT);
$db->beginTransaction();
$match->execute();
if($count->fetchColumn() == 1) {
	$match->closeCursor();
	if($g > 0) {
		$score = $db->prepare("UPDATE match SET last_activity = (strftime('%s','now')), h".$g" = ?, a".$g" = ? WHERE mid = ?");
		$score->bindValue(1,$_POST['h'],PDO::PARAM_INT);
		$score->bindValue(2,$_POST['a'].PDO::PARAM_INT);
		$score->bindValue(3,$mid,PDO::PARAM_INT);
		$score->execute();
		$score->closeCursor();
	} else {
		if($g == 0) {
			$endmatch = $db->prepare("UPDATE match SET  last_activity = (strftime('%s','now')), end_time = (strftime('%s','now')) WHERE mid = ?")
			$endmatch->bindValue(1,$mid,PDO::PARAM_INT);
			$endmatch->execute();
			$endmatch->closeCursor();
// so we need to update the players results 
			if($_POST['h'] == 7) {
				//winner was home player
				$winner = $row['hid'];
				$loser = $row['aid'];
			} else {
				$winner = $row['aid'];
				$loser= $row['hid'];
			}
			$musigma = $db->prepare("SELECT mu,sigma,last_match FROM player WHERE pid = ?");
			$musigma->bindValue(1,$winner,PDO::PARAM_INT);
			$musigma->execute()
			$w = $musigma->fetch(PDO::FETCH_ASSOC);
			$musigma->closeCursor();
			$musigma->bindValue(1,$loser,PDA::PARAM_INT);
			$musigma->execute();
			$l = $musigma->fetch(PDO::FETCH_ASSOC);
			$musigma->closeCursor();
			//use glicko method to update mu and sigma http://math.bu.edu/people/mg/glicko/glicko.doc/glicko.html
			$wns = max(30,min(sqrt(pow($w['sigma'],2) - (666*(time()-$w['last_match']))/864000),350))
			$lns = max(30,min(sqrt(pow($l['sigma'],2) - (666*(time()-$l['last_match']))/864000),350))
			$q=0.0057565;
			$wg = 1/sqrt(1+(3*$q*$q*pow($w['sigma'],2)/(2*M_PI)));
			$lg = 1/sqrt(1+(3*$q*$q*pow($l['sigma'],2)/(2*M_PI)));
			$wE = 1/(1+pow(10,-$lg*($w['mu']-$l['mu'])/400));
			$lE = 1/(1+pow(10,-$wg*($l['mu']-$w['mu'])/400));
			$wd2 = 1/($q*$q*$lg*$lg*$wE*(1-$wE));
			$ld2 = 1/($q*$q*$wg*$wg*$lE*(1-$lE));
			$w['mu'] += ($q/(1/($wns*$wns)+1/$wd2))*$lg*(1-$wE);
			$l['mu'] -= ($q/(1/($lns*$lns)+1/$ld2))*$lg*$lE;
			$w['sigma'] = sqrt(1/(1/($wns*$wns) + 1/$wd2));
			$l['sigma'] = sqrt(1/(1/($lns*$lns) + 1/$ld2));
			$update = $db->prepare("UPDATE player SET mu = ?, sigma = ? last_match = (strftime('%s','now')) WHERE pid = ?");
			$update->bindValue(1,$w['mu']);
			$update->bindValue(2,$w['sigma']);
			$update->bindvalue(3,$winner,PDO::PARAM_INT);
			$update->execute();
			$update->closeCursor();
			
			$update->bindValue(1,$l['mu']);
			$update->bindValue(2,$l['sigma']);
			$update->bindvalue(3,$loser,PDO::PARAM_INT);
			$update->execute();
			$update->closeCursor();
		} else {
			$abandon->prepate("UPDATE match SET  last_activity = (strftime('%s','now')), end_time = (strftime('%s','now')), abandon = 'A' WHERE mid = ?");
			$abandon->bindValue(1,$mid,PDO::PARAM_INT);
			$abandon->execute();
			$abandon->closeCursor();
		}
	}
	$db->commit();
	echo '{"OK":true}';
} else {
	$match->closeCursor();
	$db->rollBack();
	echo 'Match with mid = '.$mid.' does not exist';
}
?>

