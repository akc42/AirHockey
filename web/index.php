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

// Show all errors:
error_reporting(E_ALL);
/* 
Path to the pipe directory.  If you change it here, also change it in abort.php read.php, request.php and send.php 
*/
define('AIR_HOCKEY_PIPE_PATH',	'/home/alan/dev/airhock/db/');
define('AIR_HOCKEY_MAX_MATCHLIST_SIZE',		10);
define('AIR_HOCKEY_POLL',				10000);  //milliseconds delay between polls for new info

require_once($_SERVER['DOCUMENT_ROOT'].'/forum/SSI.php');
//If not logged in to the forum, not allowed any further so redirect to page to say so
if($user_info['is_guest']) {
	header( 'Location: airhockey.php' ) ;
	exit;
};
if(isset($user_info['id'])) { //check if this is SMFv2
    $uid =& $user_info['id'];
} else {
    $uid = $ID_MEMBER;
}
$name = &$user_info['name'];

// Make a fifo for this user if there isn't one already
$old_umask = umask(0007);
if(!file_exists(AIR_HOCKEY_PIPE_PATH."msg".$uid)) posix_mkfifo(AIR_HOCKEY_PIPE_PATH."msg".$uid,0660);
if(!file_exists(AIR_HOCKEY_PIPE_PATH."ack".$uid)) posix_mkfifo(AIR_HOCKEY_PIPE_PATH."ack".$uid,0660);
umask($old_umask);

//make sure there are no extant processes waiting on message any hanging reads will terminate
$pipe=fopen(AIR_HOCKEY_PIPE_PATH."msg".$uid,'r+');
usleep(10000);  //give the other side of the pipe a chance to wake up and notice
fclose($pipe);
$pipe=fopen(AIR_HOCKEY_PIPE_PATH."ack".$uid,'r+');
usleep(10000);  //give the other side of the pipe a chance to wake up and notice
fclose($pipe);
require_once('./db.inc');
$time = time();

// Set up a user record with type = spectator
dbQuery('BEGIN;');
$result=dbQuery('SELECT * FROM player WHERE pid = '.dbMakeSafe($uid).';');
if(dbNumRows($result) > 0) {
	dbQuery('UPDATE player SET last_poll = '.dbPostSafe($time).' , name = '
			.dbPostSafe($name).', state = '.SPECTATOR.', last_state = '.dbPostSafe($time).', iid = \'0\' WHERE pid = '.dbMakeSafe($uid).';');
} else {
	dbQuery('INSERT INTO player (pid,name,last_poll, state, last_state, mu, sigma, iid) VALUES ('
			.dbMakeSafe($uid).','.dbPostSafe($name).', '.dbPostSafe($time).','.SPECTATOR.','.dbPostSafe($time).', DEFAULT,DEFAULT,DEFAULT);');
}
dbQuery('COMMIT;');
dbFree($result);
//Timeout users who are supposed to be on line, but haven't contacted for a while
require('./timeout.inc');

function head_content() {
	global $time,$uid;
?>   <title>Melinda's Backups Air Hockey Ladder</title>
	<link rel="stylesheet" type="text/css" href="airh.css"/>
	<script src="ladder.js" type="text/javascript" charset="UTF-8"></script>
<script type="text/javascript">
	<!--
window.addEvent('domready', function() {
	MBahladder.init({user: <?php echo $uid;?>,pass : '<?php echo sha1("Air".$uid); ?>', t:<?php echo $time ?>},
		<?php echo SPECTATOR; ?>,<?php echo AIR_HOCKEY_POLL; ?>);
});
window.addEvent('unload', function() {
	MBahladder.logout();
	
});
	// -->
</script>
<?php
}	
function content_title() {
	echo 'Air Hockey Ladder';
}

function menu_items() {
?><a href="/forum"><img id="exittoforum" src="exit-f.gif" /></a>
<?php
}

function content() {
	global $uid,$name;
?>
	<p> An explanation of how to play can be found <b><a href="rules.php">here</a></b></p>
	<div id="matchlist">
		<div id="matchlistheader">Recent and Current Matches</div>
<?php
$nomatches = 0;
$result = dbQuery('SELECT * FROM full_match WHERE end_time IS NULL ORDER BY start_time DESC;');
while ($row=dbFetch($result)) {
	$nomatches++;
?>		<div id="<?php echo 'M'.$row['mid'] ; ?>" class="match">
<?php
	if (!is_null($row['eid'])) {
?>			<div class="eventtitle"><?php echo $row['title'] ; ?></div>
<?php
	}
?>			<div class="players">
				<div class="user"><?php echo $row['hname'] ; ?></div>
				<div class="user"><?php echo $row['aname'] ; ?></div>
			</div>
<?php
	for ($i=1;$i <= 7;$i++) {
		if (!is_null($row['h'.$i])) {
?>			<div class="game">
				<div class="score"><?php echo $row['h'.$i] ; ?></div>
				<div class="score"><?php echo $row['a'.$i] ; ?></div>
			</div>
<?php
		}
	}
?>			<div class="duration"><?php echo $row['start_time'] ; ?></div>
		</div>
<?php
}
dbFree($result);

if($nomatches < AIR_HOCKEY_MAX_MATCHLIST_SIZE) {
	$result = dbQuery('SELECT * FROM full_match WHERE end_time IS NOT NULL ORDER BY start_time DESC LIMIT '
							.dbMakeSafe(AIR_HOCKEY_MAX_MATCHLIST_SIZE - $nomatches).';');
	while ($row=dbFetch($result)) {
		$nomatches++;
?>		<div id="<?php echo 'M'.$row['mid'] ; ?>" class="match">
<?php
		if (!is_null($row['eid'])) {
?>			<div class="eventtitle"><?php echo $row['title'] ; ?></div>
<?php
		}
?>			<div class="players">
				<div class="user"><?php echo $row['hname'] ; ?></div>
				<div class="user"><?php echo $row['aname'] ; ?></div>
			</div>
<?php
		for ($i=1;$i <= 7;$i++) {
			if (!is_null($row['h'.$i])) {
?>			<div class="game">
				<div class="score"><?php echo $row['h'.$i] ; ?></div>
				<div class="score"><?php echo $row['a'.$i] ; ?></div>
			</div>
<?php
			}
		}
?>			<div class="endmatch"><?php echo $row['end_time'] ; ?></div>
		</div>
<?php
	}
	dbFree($result);
}
?>	</div>
		
	<div id="online">
		<div id="meOnline">
			<div id="meHeader"><?php echo $name ; ?></div>
			<div id="meOption">
				<div class="ps" id="<?php echo 'S'.PRACTICE; ?>" >Practice</div>
				<div class="ps" id="<?php echo 'S'.SPECTATOR; ?>" >Spectator<img src="tick.gif" alt="Selected" /></div>
				<div class="ps" id="<?php echo 'S'.INVITE; ?>" >By Invites Only</div>
				<div class="ps" id="<?php echo 'S'.ANYONE; ?>" >Will Play Anyone</div>
			</div>
			
		</div>
		<div id="onlineListHeader">Others Online</div>
<?php
$result=dbQuery('SELECT * FROM player WHERE state != 0 AND pid != '.dbMakeSafe($uid).' ORDER BY last_state DESC;');
while($row=dbFetch($result)) {
?>		<div id="<?php echo 'U'.$row['pid']; ?>" class="onlineUser"><div class="ouser"><?php echo $row['name'] ; ?></div><?php
	$state = $row['state'];
	if($state == ACCEPTED || $state == MATCH || $state == PRACTICE) {
?><div class="inmatch"><?php echo (($state == PRACTICE)?"P":"M") ; ?></div><?php
	} else {
		if ($state == ANYONE) {
?><div class="free">A</div><?php
		} else {
			if ($state == INVITE) {
				if ($row['iid'] == $uid) {
?><div class="inviteFrom">T</div><?php
				} else {
?><div class="byInvite">I</div><?php
				}
			} else {
?><div>&nbsp;</div><?php
			}
		}
	}
?></div>
<?php
}
dbFree($result);
?>	</div>
	<div id="ladder">
		<div id="ladderheader">Ladder (by Ranking)</div>
<?php
$result = dbQuery('SELECT name, score FROM player_rating ORDER BY score DESC;');
while($row = dbFetch($result)) {
?>		<div class="ladderentry" ><div class="ladder"><?php echo $row['name'] ; ?></div><div class="ranking"><?php echo (int) $row['score'] ;?></div></div>
<?php
}
?>	</div>
	<div style="clear:both"></div>
<?php
}
function foot_content () {
?>	<div id="copyright">Air Hockey <span id="version">php:<?php include('./version.inc');?></span> &copy; 2009-2011 Alan Chandler.  Licenced under the GPL</div>
<?php
}
require_once($_SERVER['DOCUMENT_ROOT'].'/inc/template.inc'); 
?>
