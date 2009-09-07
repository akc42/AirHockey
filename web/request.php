<?php
  /*
    Air Hockey - Request  module
		Handles all requests from main index page to update
	
	Manditory parameters
		user - user id
		pass - password to protect
		t - server time of last contact with database (normally returned from this module, but on first contact it will be index.php)
	Optional parameters
		state - new state if I am trying to change my state to something else
 		cmd - set if trying to tell opponent something ('I' = invite opponent, 'A' = accept opponents invite)
		oid - the opponent we are trying to tell - if cmd is set

	Copyright (c) 2009 Alan Chandler
	Licenced under the GPL
*/

define('AIR_HOCKEY_PATH', dirname($_SERVER['SCRIPT_FILENAME']).'/');
define('AIR_HOCKEY_PIPE_PATH',	AIR_HOCKEY_PATH.'pipes/');

if(!(isset($_POST['user'])  && isset($_POST['pass'])&& isset($_POST['t'])))
	die('Log - Hacking attempt - wrong parameters');
$uid = $_POST['user']; //extra security 
if ($_POST['pass'] != sha1("Air".$uid))
	die('Log - Hacking attempt got: '.$_POST['pass'].' expected: '.sha1("Air".$uid));

// Show all errors:
error_reporting(E_ALL);
// Path to the air hockety directory:
define ('AIRH',1);   //defined so we can control access to some of the files.
require_once('db.php');

$last = dbMakeSafe($_POST['t']);
$now = time();
$invitechange = false;
$oldiid = 0;
$oid = 0;

dbQuery('BEGIN;');
$result=dbQuery('SELECT * FROM player WHERE pid = '.dbMakeSafe($uid).';');
if(!($user=dbFetch($result))) {
	dbQuery('ROLLBACK;');
	die('Database Error - cannot find user '.$uid);
}
dbFree($result);

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
	if(isset($_POST['state'])) {
		if($_POST['state'] == ANYONE) {
			//If I go to 'Anyone' state, I can immediately start a match with anyone else in that state - finding person longest in that state
			$result=dbQuery('SELECT * FROM player WHERE state = '.ANYONE.' AND pid <> '.dbMakeSafe($uid).' ORDER BY last_state;');
			if($row = dbFetch($result)) {
				//OK found someone, so create a match and put him into the R state.
				dbQuery('INSERT INTO match (mid,hid,aid,start_time,last_activity) VALUES(default,'
							.dbPostSafe($row['pid']).','.dbPostSafe($uid).','.dbPostSafe($now).','.dbPostSafe($now).');');
				$r = dbQuery('SELECT currval(\'match_mid_seq\') AS mid;');
				$m = dbFetch($r);
				$mid = $m['mid'];
				dbFree($r);
				dbQuery('UPDATE player SET state = '.ACCEPTED.', iid = '.dbPostSafe($mid).' WHERE pid = '.dbMakeSafe($row['pid']).';');
				$state = MATCH ;
				echo '{"state":'.MATCH.',"mid":'.$mid.'}';
			} else {
				$state = ANYONE ;
			}
			dbFree($result);
		} else {
			$state = $_POST['state'];
		}
		$user['last_state'] = $now;
	} else {
		if(isset($_POST['cmd'])) {
			if(!isset($_POST['oid'])) {
				dbQuery('ROLLBACK;');
				die('Incorrect parameters - missing oid');
			}
			$result=dbQuery('SELECT * FROM player WHERE pid = '.dbMakeSafe($_POST['oid']).';');
			if(!($row = dbFetch($result))){
				dbQuery('ROLLBACK;');
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
						dbQuery('INSERT INTO match (mid,hid,aid,start_time,last_activity) VALUES(default,'.dbMakeSafe($oid)
							.','.dbPostSafe($uid).','.dbPostSafe($now).','.dbPostSafe($now).');');
						$r = dbQuery('SELECT currval(\'match_mid_seq\') AS mid;');
						$m = dbFetch($r);
						$mid = $m['mid'];
						dbFree($r);
						dbQuery('UPDATE player SET state = '.ACCEPTED.', iid = '.dbPostSafe($mid).', last_state = '.dbPostSafe($now)
								.' WHERE pid = '.dbMakeSafe($oid).';');
						$state = MATCH ;
						$user['last_state'] = $now;
						echo '{"state":'.MATCH.',"mid":'.$mid.'}';
					}
				}
			}
		}
	}
}
dbQuery('UPDATE player SET state = '.dbPostSafe($state).', last_state = '.dbPostSafe($user['last_state'])
		.', iid = '.dbMakeSafe($user['iid']).', last_poll = '.dbPostSafe($now).' WHERE pid = '.dbMakeSafe($uid).';');
dbQuery('COMMIT;');

//Timeout users who are supposed to be on line, but haven't contacted for a while and old matches.
require('timeout.php');

if ($state == SPECTATOR || $state == ANYONE || $state == INVITE ) {

	$matches = false;

	echo '{';
	if ($state != $user['state']) {
		echo '"state":'.$state.',';
	}
	$result = dbQuery('SELECT * FROM full_match WHERE last_activity >= '.$last.' ORDER BY start_time DESC;');
	if(dbNumRows($result) != 0) {
		echo '"matches":[' ;
		while($row = dbFetch($result)) {
			if($matches) {
				echo ',';
			} else {
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
		echo '],';
	}
	dbFree($result);
	$users = false;
	$result = dbQuery('SELECT * FROM player WHERE last_state >= '.$last.' AND pid != '.dbMakeSafe($uid).' ORDER BY last_state DESC;');
	if (dbNumRows($result) != 0 || $oid != 0 || $oldiid != 0) {
		echo '"users":[' ;
		while($row=dbFetch($result)) {
			if($users) {
				echo ',';
			} else {
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
				$users = true;
			}
			echo '{"pid":'.$oldiid.', "state":3}';
		}
		if ($oid !=0) {
			//No change to record we invited so include now
			if ($users) {
				echo ',';
			} else {
				$users = true;
			}
			echo '{"pid":'.$oid.',"state":3, "invite":"T"}';
		}
		echo '],';
	}
	echo  '"t":'.$now.'}';
} else {
	if($state == PRACTICE ) {
		echo '{"state":'.PRACTICE.'}';
	}
}
?>
