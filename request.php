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

// First check if supposed to be joining a match
if($user['state'] == ACCEPTED) {
	//If I was going offline, or expecting to practice, I can't join match and must tell other end to abandon
	if(isset($_POST['state']) && ($_POST['state'] == OFFLINE || $_POST['state'] == PRACTICE)) {
		//Other end will be sitting reading my msg pipe

		$sendpipe=fopen(AIR_HOCKEY_PIPE_PATH.'msg'.$uid,'r+');
		$readpipe=fopen(AIR_HOCKEY_PIPE_PATH.'ack'.$uid,'r');
		fwrite($sendpipe,"$A"); //Send the abandon
		fclose($sendpipe);
		$response=fread($readpipe,10);
		fclose($readpipe); //
		$user['state'] = $_POST['state'];
		echo '{"State":"'.$user['state'].'"}';
	} else {
		$user['state'] = MATCH ; //we will now be in a match
		echo '{"State":'.MATCH.',"mid":'.$user['iid'].'}';
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
				$r = dbQuery('SELECT currval(\'match_mid_seq\'::regclass) AS mid;');
				$m = dbFetch($r);
				$mid = $m['mid'];
				dbFree($r);
				dbQuery('UPDATE player SET state = '.ACCEPTED.', iid = '.dbPostSage($mid).' WHERE pid = '.dbMakeSafe($row['pid']).';');
				$user['state'] = MATCH ;
				echo '{"State":'.MATCH.',"mid":'.$mid.'}';
			}
			dbFree($result);
		} else {
			$user['state'] = $_POST['state'];
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
					$invitechange = true;
					$oldiid = $user['iid'];
					$user['iid'] = $oid;
				} else {
					if($_POST['cmd'] == "A") {
						dbQuery('INSERT INTO match (mid,hid,aid,start_time,last_activity) VALUES(default,'.dbPostSafe($oid)
							.','.dbPostSafe($uid).','.dbPostSafe($now).','.dbPostSafe($now).');');
						$r = dbQuery('SELECT currval(\'match_mid_seq\'::regclass) AS mid;');
						$m = dbFetch($r);
						$mid = $m['mid'];
						dbFree($r);
						dbQuery('UPDATE player SET state = "R", iid = '.dbPostSafe($mid).', last_state = '.dbPostSafe($now).' WHERE pid = '.dbMakeSafe($oid).';');
						$user['state'] = MATCH ;
						echo '{"State":'.MATCH.',"mid":'.$mid.'}';
					}
				}
			}
		}
	}							

}

dbQuery('UPDATE player SET state = '.dbPostSafe($user['state']).', last_state = '.dbPostSafe($user['last_state'])
		.', iid = '.dbPostSafe($user['iid']).', last_poll = '.dbPostSafe($now).' WHERE pid = '.dbMakeSafe($uid).';');
dbQuery('COMMIT;');
if ($user['state'] == SPECTATOR || $user['state'] == ANYONE || $user['state'] == INVITE ) {

	$matches = false;

	echo '{';

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
			if (!isnull($row['eid'])) echo ',"event":"'.$row['title'].'"';
			echo ',"hname":"'.$row['hname'].'","aname":"'.$row['aname'].'"';
			echo ',"stime":'.$row['start_time'] ;
			if (!isnull($row['end_time'])) echo ',"etime":'.$row['end_time'];
			if (!isnull($row['h1'])) {
				echo ',"games" ;[['.$row['h1'].','.$row['a1'].']';
				for ($i=2;$i<=7;$i++) {
					if(!isnull($row['h'.i])) {
						echo ',['.$row['h'.i].','.$row['a'.i].']';
					} else {
						break;
					}
				}
				echo ']';
			}
			echo '}';
		}
		echo '],';
	}
	dbFree($result);
	$users = false;
	$result = dbQuery('SELECT * FROM player WHERE last_state >= '.$last.' ORDER BY last_state DESC;');
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
			if ($pid == $oid) {
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
			echo '{"pid":'.$oldiid.', "state":"I"}';
		}
		if ($oid !=0) {
			//No change to record we invited so include now
			if ($users) {
				echo ',';
			} else {
				$users = true;
			}
			echo '{"pid":'.$oid.', "state":"T"}';
		}
		echo '],';
	}
	echo  '"t":'.$now.'}';
} else {
	if($user['state'] == PRACTICE ) {
		echo '{"state":'.PRACTICE.'}';
	}
}
?>
