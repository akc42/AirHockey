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
    Air Hockey - Request  module
		Handles all requests from main index page to update.  The main index page polls on a regular basis for status from elsewhere, but
		also calls this module when there is a status change (ie player elects to change is state)
	
	Manditory parameters
		user - user id
		pass - password to protect
		t - server time of last contact with database (normally returned from this module, but on first contact it will be index.php)
	Optional parameters
		state - new state if I am trying to change my state to something else
 		cmd - set if trying to tell opponent something ('I' = invite opponent, 'A' = accept opponents invite)
		oid - the opponent we are trying to tell - if cmd is set

*/
/* copied from index.php */
define('AIR_HOCKEY_PIPE_PATH',	'/home/alan/dev/airhock/db/');

if(!(isset($_POST['user'])  && isset($_POST['pass'])&& isset($_POST['t'])  && isset($_POST['state'])) || (isset($_POST['cmd']) && !isset($_POST['oid'])))
	die('Log - Hacking attempt - wrong parameters');
$uid = $_POST['user']; //extra security 
if ($_POST['pass'] != sha1("Air".$uid))
	die('Log - Hacking attempt got: '.$_POST['pass'].' expected: '.sha1("Air".$uid));

require_once('./db.inc');

$last = $_POST['t'];

$state = $_POST['state'];
$opponent = 0;

$pstmt = $db->prepare("SELECT * FROM player WHERE pid = ?");
$pstmt->bindValue(1,$uid,PDO::PARAM_INT);

$db->beginTransaction();
$pstmt->execute();

if(!($user=$pstmt->fetch(PDO::FETCH_ASSOC))) {
	$db->rollBack();
	die('Database Error - cannot find user '.$uid);
}
$pstmt->closeCursor();

//lets echo this now - then we have a time set that is before all other actions
echo '{"t":'.time();

if ($user['state'] == ACCEPTED) {
	//someone accepted us - we need to deal with this
	if($state == INVITE || $state == ANYONE) {
		// I go to this match
		$state = MATCH ; //we will now be in a match
		echo ',"state":'.MATCH.',"mid":'.$user['iid'];
	} else {
		// I am not able to accept so we must abandon things
		//Other end will be sitting reading my msg pipe

		$sendpipe=fopen(AIR_HOCKEY_PIPE_PATH.'msg'.$uid,'r+');
		fwrite($sendpipe,"$Abandon"); //Send the abandon
		fclose($sendpipe);
		echo ',"state":'.$state ;
	}
} else {
	$oid = false;  //No player to play with at the moment
	if ($state == ANYONE) {
		//See if anyone to play with
		$anyone = $db->prepare("
			SELECT pid 
			FROM player 
			WHERE pid <> ?  AND (state = ".ANYONE." OR (state = ".INVITE." AND iid = ? ))
			ORDER BY state DESC, last_state ASC"
		);
		$anyone->bindValue(1,$uid,PDO::PARAM_INT);
		$anyone->bindValue(2,$uid,PDO::PARAM_INT);
		$anyone->execute();
		$oid = $anyone->fetchColumn();
		$anyone->closeCursor();
	} else {
		if ($state == INVITE) {
			if(isset($_POST['cmd'])) {
				if ($_POST['cmd'] == 'A') {
					$oid = $_POST['oid']; 
				} else {
					$opponent = $_POST['oid'];
					//reuse old statement to go find the other guy
					$pstmt->bindValue(1,$opponent,PDO::PARAM_INT);
					$pstmt->execute();
					if($row = $pstmt->fetch(PDO::FETCH_ASSOC)){
						//we found him, so now we need to check he can accept invites.
						if($row['state'] == INVITE || $row['state'] == ANYONE) {
							//To invite an opponent we just add his id into our user record
							if($user['iid'] == $opponent) {
								$user['iid'] = 0; //uninvite him if we had previously invited him
							} else {
								$user['iid'] = $opponent;
							}
						} else {
							$user['iid'] = 0;  //can't invite him if he won't allow it
						}
					} else {
						$user['iid'] = 0;
					}
					$user['state'] = 0; //Force an update to this player record
				}
			}
		} 
	}
	if($oid) {
		//OK found someone, so create a match and put him into the Master Satestate.
		$newmatch = $db->prepare("INSERT INTO match (hid,aid) VALUES ( ?,?)");
		$newmatch->bindValue(1,$oid,PDO::PARAM_INT);
		$newmatch->bindValue(2,$uid,PDO::PARAM_INT);
		$newmatch->execute();
		$mid = $db->lastInsertId();
		$newmatch->closeCursor();
		//mark him as accepted
		$newmatch = $db->prepare("UPDATE player SET state = ".ACCEPTED.", iid = ?, last_state = (strftime('%s','now')) WHERE pid = ?");
		$newmatch->bindValue(1,$mid,PDO::PARAM_INT);
		$newmatch->bindValue(2,$oid,PDO::PARAM_INT);
		$newmatch->execute();
		$newmatch->closeCursor();
		$state = MATCH ;
		$user['iid'] = 0;  //going to set my mid too
		echo ',"state":'.MATCH.',"mid":'.$mid;
	} else {
		echo ',"state":'.$state;
	}
}
if ($state != $user['state'] ) {
	//mark state change
	$newstate = $db->prepare("
		UPDATE player SET state = ?, last_state = (strftime('%s','now')), iid = ?, last_poll = (strftime('%s','now')) WHERE pid = ?
	");
	$newstate->bindValue(1,$state,PDO::PARAM_INT);
	$newstate->bindValue(2,$user['iid'],PDO::PARAM_INT);
	$newstate->bindValue(3,$uid,PDO::PARAM_INT);
	$newstate->execute();
	$newstate->closeCursor();
	
}

$db->commit();
//Timeout users who are supposed to be on line, but haven't contacted for a while and old matches.
require('./timeout.inc');

if ($state == SPECTATOR || $state == ANYONE || $state == INVITE ) {

	$mstmt = $db->prepare("SELECT * FROM full_match WHERE last_activity >= ? ORDER BY start_time DESC");
	$pstmt = $db->prepare("SELECT * FROM player WHERE last_state >= ? AND pid <> ? ORDER BY last_state DESC");
	$mstmt->bindValue(1,$_POST['t'],PDO::PARAM_INT);
	$pstmt->bindValue(1,$_POST['t'],PDO::PARAM_INT);
	$pstmt->bindValue(2,$uid,PDO::PARAM_INT);
	$db->beginTransaction();
	$mstmt->execute();
	$matches = false;
	while($row = $mstmt->fetch(PDO::FETCH_ASSOC)) {
		if($matches) {
			echo ',';
		} else {
			echo ',"matches":[' ;
			$matches = true;
		}
		echo '{"mid":'.$row['mid'] ;
		if (!is_null($row['abandon'])) {
			if($row['abandon'] == 'A') {
				echo ',"abandon":true' ;
			} else {
				if($row['abandon'] == 'D') echo ',"deletion":true';
			}
		} 
		if (!is_null($row['eid'])) echo ',"event":"'.$row['title'].'"';
		echo ',"hname":"'.$row['hname'].'","aname":"';
		if(is_null($row['aname'])) {
			echo '(PRACTICING)';
		} else {
			echo $row['aname'] ;
		}
		echo '","stime":'.$row['start_time'] ;
		if (!is_null($row['end_time'])) echo ',"etime":'.$row['end_time'];
		if (!is_null($row['h1'])) {
			echo ',"games":[['.$row['h1'].','.$row['a1'].']';
			for ($i=2;$i<=7;$i++) {
				if(!is_null($row['h'.$i])) {
					echo ',['.$row['h'.$i].','.$row['a'.$i].']';
				} else {
					break;
				}
			}
			echo ']';
		}
		echo '}';
		
	}
	if($matches) echo ']';
	$mstmt->closeCursor();
	$pstmt->execute();
	$users = false;
	while($row=$pstmt->fetch(PDO::FETCH_ASSOC)) {
		if($users) {
			echo ',';
		} else {
			echo ',"users":[' ;
			$users = true;
		}
		$pid = $row['pid']; 
		echo '{"pid":'.$pid.',"name":"'.$row['name'].'","state":'.$row['state'] ;
		if ($pid == $user['iid'] && $state == INVITE ) {
			echo ',"invite":"T"}';
		} else {
			if ($row['iid'] == $uid && $row['state'] == INVITE) {
				//he has invited me so say so
				echo ',"invite":"F"}';
			} else {
				echo '}';
			}
		}
		if($pid == $opponent)  $opponent = 0;
	}

	if ($opponent != 0 ) {
		//This user hasn't appeared in the above list, but we just changed the invite state
		if ($users) {
			echo ',';
		} else {
			echo ',"users":[' ;
			$users = true;
		}
		echo '{"pid":'.$opponent.', "state":3';
		if ($state = INVITE && $user['iid'] != 0 ) echo ', "invite":"T"';
		echo '}';
	}
	if($users) echo ']';
	$pstmt->closeCursor();
	$db->rollBack();
}

// last thing to do is close off the json response

echo '}' ;

