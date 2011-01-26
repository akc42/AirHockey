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

if(!(isset($_POST['user'])  && isset($_POST['pass'])&& isset($_POST['t'])))
	die('Log - Hacking attempt - wrong parameters');
$uid = $_POST['user']; //extra security 
if ($_POST['pass'] != sha1("Air".$uid))
	die('Log - Hacking attempt got: '.$_POST['pass'].' expected: '.sha1("Air".$uid));

require_once('./db.inc');

$last = $_POST['t'];
$now = time();
$invitechange = false;
$oldiid = 0;
$oid = 0;

$pstmt = $db->prepare("SELECT * FROM player WHERE pid = ?");
$pustmt = $db->prepare("UPDATE player SET state = ?, last_state = ?, iid = ?, last_poll = (strftime('%s','now')) WHERE pid = ?");

$db->beginTransaction();
$pstmt->bindValue(1,$uid,PDO::PARAM_INT);
$pstmt->execute();

if(!($user=$pstmt->fetch(PDO_FETCH_ASSOC))) {
	$db->rollBack();
	die('Database Error - cannot find user '.$uid);
}
$pstmt->closeCursor();

$state = $user['state'];
if($state == MATCH || $state == PRACTICE) {
	$state = SPECTATOR ;
	$user['last_state'] = $now;
}

// First check if supposed to be joining a match
if($state == ACCEPTED) {
	//If I was going offline, or expecting to practice, I can't join match and must tell other end to abandon
	if(isset($_POST['state']) && ($_POST['state'] == OFFLINE || $_POST['state'] == PRACTICE)) {
		//Other end will be sitting reading my msg pipe

		$sendpipe=fopen(AIR_HOCKEY_PIPE_PATH.'msg'.$uid,'r+');
		fwrite($sendpipe,"$Abandon"); //Send the abandon
		fclose($sendpipe);
		$state = $_POST['state'];
		echo '{"state":"'.$state.'"}';
	} else {
		$state = MATCH ; //we will now be in a match
		echo '{"state":'.MATCH.',"mid":'.$user['iid'].'}';
	}
	$user['last_state'] = $now;
} 
if ($user['state'] == SPECTATOR || $user['state'] == ANYONE || $user['state'] == INVITE) {
	$mstmt = $db->prepare("INSERT INTO match (hid,aid,start_time,last_activity) VALUES ( ?,?,(strftime('%s','now')),(strftime('%s','now')))");
	$ustmt = $db->prepare("UPDATE player SET state = ".ACCEPTED.", iid = ?, last_state = (strftime('%s','now')) WHERE pid = ?");
	if(isset($_POST['state'])) {
		if($_POST['state'] == ANYONE) {
			//If I go to 'Anyone' state, I can immediately start a match with anyone else in that state - finding person longest in that state
			$astmt = $db->prepare("SELECT pid FROM player WHERE state = ".ANYONE." AND pid <> ? ORDER BY last_state;")
			$astmt->bindValue(1,$uid,PDO::PARAM_INT);
			$astmt->execute();
			if($pid = $astmt->fetchColumn()) {
				//OK found someone, so create a match and put him into the R state.
				$mstmt->bindValue(1,$pid,PDO::PARAM_INT);
				$mstmt->bindValue(2,$uid,PDO::PARAM_INT);
				$mstmt->execute();
				$mid = $db->lastInsertId();
				$mstmt->closeCursor();
				$ustmt->bindValue(1,$mid,PDO::PARAM_INT);
				$ustmt->bindValue(2,$pid,PDO::PARAM_INT);
				$ustmt->execute();
				$ustmt->closeCursor():
				$state = MATCH ;
				echo '{"state":'.MATCH.',"mid":'.$mid.'}';
			} else {
				$state = ANYONE ;
			}
			$astmt->closeCursor();
		} else {
			$state = $_POST['state'];
		}
		$user['last_state'] = $now;
	} else {
		if(isset($_POST['cmd'])) {
			if(!isset($_POST['oid'])) {
				$db->rollBack();
				die('Incorrect parameters - missing oid');
			}
			$pstmt->bindValue(1,$_POST['oid'],PDO::PARAM_INT);
			$pstmt->execute();
			if(!($row = $pstmt->fetch(PDO::FETCH_ASSOC))){
				$db->rollBack();
				die('Database Error - missing opponent '.$_POST['oid']);
			}
			//Check whether this user is still available to accept this command
			if($row['state'] == INVITE || $row['state'] == ANYONE) {
				//Yes opponent is in a state to receive a command
				$oid = $_POST['oid'];
				if($_POST['cmd'] == "I") {
					//To invite an opponent we just add his id into our user record
					$oldiid = $user['iid'];
					if($oldiid == $oid) {
						$user['iid'] = 0; //uninvite him if we had previously invited him
						$oid = 0;
					} else {
						$user['iid'] = $oid;
					}
					$state = INVITE;     //if user wasin't in invite mode, they are now.
					$user['last_state'] = $now;
				} else {
					if($_POST['cmd'] == "A") {
						$mstmt->bindValue(1,$oid,PDO::PARAM_INT);
						$mstmt->bindValue(2,$uid,PDO::PARAM_INT);
						$mstmt->execute();
						$mid = $db->lastInsertId();
						$mstmt->closeCursor();
						$ustmt->bindValue(1,$mid,PDO::PARAM_INT);
						$ustmt->bindValue(2,$oid,PDO::PARAM_INT);
						$ustmt->execute();
						$ustmt->closeCursor();
						$state = MATCH ;
						$user['last_state'] = $now;
						echo '{"state":'.MATCH.',"mid":'.$mid.'}';
					}
				}
			}
		}
	}
}
$pustmt->bindValue(1,$state,PDO::PARAM_INT);
$pustmt->bindValue(2,$user['last_state'],PDO::PARAM_INT);
$pustmt->bindValue(3,$user['iid'],PDO::PARAM_INT);
$pustmt->bindValue(4,$uid,PDO::PARAM_INT);
$pustmt->execute();
$pustmt->closeCursor();
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
	echo '{';
	if ($state != $user['state']) {
		echo '"state":'.$state.',';
	}
	$mstmt->execute();
	$matches = false;
	while($row = $mstmt->fetch(PDO::FETCH_ASSOC)) {
		if($matches) {
			echo ',';
		} else {
			echo '"matches":[' ;
			$matches = true;
		}
		echo '{"mid":'.$row['mid'] ;
		if (!is_null($row['abandon'])) {
			echo ',"abandon":true}' ;
		} else {
			if (!is_null($row['eid'])) echo ',"event":"'.$row['title'].'"';
			echo ',"hname":"'.$row['hname'].'","aname":"'.$row['aname'].'"';
			echo ',"stime":'.$row['start_time'] ;
			if (!is_null($row['end_time'])) echo ',"etime":'.$row['end_time'];
			if (!is_null($row['h1'])) {
				echo ',"games" ;[['.$row['h1'].','.$row['a1'].']';
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
	}
	if($matches) echo '],';
	$mstmt->closeCursor();
	$pstmt->execute()
	$users = false;
	while($row=$pstmt->fetch(PDO::FETCH_ASSOC)) {
		if($users) {
			echo ',';
		} else {
			echo '"users":[' ;
			$users = true;
		}
		$pid = $row['pid']; 
		echo '{"pid":'.$pid.',"name":"'.$row['name'].'","state":'.$row['state'] ;
		if ($pid == $oid ) {
			$oid = 0; // indicate that iid has been dealt with
			echo ',"invite":"T"}';
		} else {
			if ($row['iid'] == $uid) {
				//he has invited me so say so
				echo ',"invite":"F"}';
			} else {
				if($pid == $user['iid']) {
					echo ',"invite":"T"}'; // this is not new
				} else {
					echo '}';
				}
			}
		}
		if ($pid == $oldiid) $oldiid = 0; //say dealt with old iid
	}

	if ($oldiid != 0 ) {
		//There was no change to the user record we removed invite from so remove it now
		if ($users) {
			echo ',';
		} else {
			echo '"users":[' ;
			$users = true;
		}
		echo '{"pid":'.$oldiid.', "state":3}';
	}
	if ($oid !=0) {
		//No change to record we invited so include now
		if ($users) {
			echo ',';
		} else {
			echo '"users":[' ;
			$users = true;
		}
		echo '{"pid":'.$oid.',"state":3, "invite":"T"}';
	}
	if($users) echo '],';
	$pstmt->closeCursor();
	echo  '"t":'.$now.'}';
	$db->rollBack();
} else {
	if($state == PRACTICE ) {
		echo '{"state":'.PRACTICE.'}';
	}
}
?>
