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

require_once('./db.inc');
$time = time();  //We need to set time BEFORE this following INSERT happens so its state change is seen.

$db->exec("PRAGMA foreign_keys = OFF");

$result = $db->query("SELECT count(*) FROM sqlite_master WHERE name = 'config' ;");
if(!($result && ($present = $result->fetchColumn()) && $present == '1')) {
	//NO CONFIG TABLE - so database must be at version 1 - update to version 2
	$result->closeCursor();
    $db->exec(file_get_contents('./update1.sql'));	    
} else {
	$result->closeCursor();
}

$version = get_param('version');
if($version < 3) {
    $db->exec(file_get_contents('./update2.sql'));
}

 
$exists = $db->prepare("SELECT count(*) AS ex FROM player WHERE pid = ?");
$exists->bindValue(1,$uid,PDO::PARAM_INT);
$db->beginTransaction();
$exists->execute();
if(($present = $exists->fetchColumn()) && $present == '1') {
	$exists->closeCursor();
	$update = $db->prepare("UPDATE player SET name = ?, last_poll = (strftime('%s','now')), last_state = (strftime('%s','now')), state = 1 WHERE pid = ?");
	$update->bindValue(1,$name);
	$update->bindValue(2,$uid,PDO::PARAM_INT);
	$update->execute();
	$update->closeCursor();
	unset($update);
} else {
	$exists->closeCursor();
	$insert = $db->prepare("INSERT INTO player(pid,name) VALUES (?,?)");
	$insert->bindValue(1,$uid,PDO::PARAM_INT);
	$insert->bindValue(2,$name);
	$insert->execute();
	$insert->closeCursor();
	unset($insert);
}
$db->commit();
unset($exists);
$db->exec("PRAGMA foreign_keys = ON");


//Timeout users who are supposed to be on line, but haven't contacted for a while
require('./timeout.inc');


// We delete any old fifo(s) for this user (to clear out stale messages) and create new ones
$old_umask = umask(0007);
if(file_exists(AIR_HOCKEY_DATABASE.AIR_HOCKEY_VARIANT."/msg".$uid)) unlink(AIR_HOCKEY_DATABASE.AIR_HOCKEY_VARIANT."/msg".$uid);
posix_mkfifo(AIR_HOCKEY_DATABASE.AIR_HOCKEY_VARIANT."/msg".$uid,0660);
if(file_exists(AIR_HOCKEY_DATABASE.AIR_HOCKEY_VARIANT."/ack".$uid)) unlink(AIR_HOCKEY_DATABASE.AIR_HOCKEY_VARIANT."/ack".$uid);
posix_mkfifo(AIR_HOCKEY_DATABASE.AIR_HOCKEY_VARIANT."/ack".$uid,0660);
umask($old_umask);

function site_get_page_title() {
	echo "Air Hockey Ladder";
}

function site_get_head_content() {
	global $uid,$time;
?> 
	<link rel="stylesheet" type="text/css" href="airh.css"/>
	<script src="/js/mootools-core-1.3-full-nocompat-yc.js" type="text/javascript" charset="UTF-8"></script>
	<script src="ladder.js" type="text/javascript" charset="UTF-8"></script>
<script type="text/javascript">
	<!--
window.addEvent('domready', function() {
	MBahladder.init({user: <?php echo $uid;?>,pass : '<?php echo sha1("Air".$uid); ?>', t:<?php echo $time ;?>,ahv:"<?php echo AIR_HOCKEY_VARIANT; ?>"},
		<?php echo SPECTATOR; ?>,<?php echo get_param('POLL'); ?> );
	document.id('exittoforum').addEvent('click', function() {
		MBahladder.logout();	
	});

});
	// -->
</script>
<?php
}
function site_get_body_class() {
	echo 'ladder';
}	
function site_get_section_title() {
	echo 'Air Hockey Club Room';
}

function site_get_application_info() {
?><a href="/forum"><img id="exittoforum" src="exit-f.gif" /></a>
<?php
}
function site_get_banner() {
}
function site_get_menu(){
?><li><a href="/forum"><span>Exit to Forum</span></a></li>
<?php
}
function site_get_content() {
	global $db,$uid,$name;
	$db->beginTransaction();
?>
	<p> An explanation of how to play can be found <b><a href="rules.php?ahv=<?php echo AIR_HOCKEY_VARIANT; ?>">here</a></b></p>
	<div id="matchlist">
		<div id="matchlistheader">Recent and Current Matches</div>
<?php
	$nomatches = 0;
	$result = $db->query('SELECT * FROM full_match WHERE end_time IS NULL ORDER BY start_time DESC;');
	while ($row=$result->fetch(PDO::FETCH_ASSOC)) {
		$nomatches++;
?>		<div id="<?php echo 'M'.$row['mid'] ; ?>" class="match">
<?php
		if (!is_null($row['eid'])) {
?>			<div class="eventtitle"><?php echo $row['title'] ; ?></div>
<?php
		}
?>			<div class="players">
				<div class="user"><?php echo $row['hname'] ; ?></div>
				<div class="user"><?php echo is_null($row['aname'])?'(PRACTICING)':$row['aname'] ; ?></div>
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
	$result->closeCursor();
	$matchlistsize = get_param('MAX_MATCHLIST_SIZE');
	if($nomatches < $matchlistsize) {
		$result = $db->query("SELECT * FROM full_match WHERE end_time IS NOT NULL AND ifnull(abandon,'') <> 'D' ORDER BY start_time DESC LIMIT "
								.($matchlistsize - $nomatches));
		while ($row=$result->fetch(PDO::FETCH_ASSOC)) {
			$nomatches++;
?>		<div id="<?php echo 'M'.$row['mid'] ; ?>" class="match">
<?php
			if (!is_null($row['eid'])) {
?>			<div class="eventtitle"><?php echo $row['title'] ; ?></div>
<?php
			}
?>			<div class="players">
				<div class="user"><?php echo $row['hname'] ; ?></div>
				<div class="user"><?php echo is_null($row['aname'])?'(PRACTICING)':$row['aname'] ; ?></div>
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
?>			<div class="endmatch<? if(!is_null($row['abandon']) && $row['abandon'] == 'A') echo ' abandon'; ?>"><?php echo $row['end_time'] ; ?></div>
		</div>
<?php
		}
		$result->closeCursor();
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
	$result=$db->prepare('SELECT * FROM player WHERE state <> '.OFFLINE.' AND pid <> ? ORDER BY last_state DESC;');
	$result->bindValue(1,$uid,PDO::PARAM_INT);
	$result->execute();
	while($row=$result->fetch(PDO::FETCH_ASSOC)) {
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
	$result->closeCursor();
?>	</div>
	<div id="ladder">
		<div id="ladderheader">Ladder (by Ranking)</div>
<?php
	$result = $db->prepare("SELECT name, (mu - 3 * sigma) AS score FROM player WHERE last_state > ? ORDER BY score DESC");
	$result->bindValue(1,time() - 86400*60,PDO::PARAM_INT);
	$result->execute();
	while($row = $result->fetch(PDO::FETCH_ASSOC)) {
?>		<div class="ladderentry" ><div class="ladder"><?php echo $row['name'] ; ?></div><div class="ranking"><?php echo (int) $row['score'] ;?></div></div>
<?php
	}
	$result->closeCursor();
?>	</div>
	<div style="clear:both"></div>
<?php
	$db->rollBack();
}
function site_get_application_attribution () {
?>Air Hockey <span id="version"><?php include('./version.inc');?></span> &copy; 2009-2011 Alan Chandler.  Licenced under the GPL<?php
}
function site_close_hook() {
}
require_once($_SERVER['DOCUMENT_ROOT'].'/inc/template.inc'); 
?>
