<?php
  /*
    Air Hockey
	Copyright (c) 2009 Alan Chandler
	Licenced under the GPL
*/
// Link to SMF forum as this is only for logged in members
// Show all errors:
error_reporting(E_ALL);
// Path to the air hockety directory:

define('AIR_HOCKEY_PATH', dirname($_SERVER['SCRIPT_FILENAME']).'/');
define('AIR_HOCKEY_PIPE_PATH',	AIR_HOCKEY_PATH.'pipes/');
define('AIR_HOCKEY_MAX_MATCHLIST_SIZE',		10);
define('AIR_HOCKEY_POLL',				10000);  //milliseconds delay between polls for new info

require_once(AIR_HOCKEY_PATH.'../forum/SSI.php');
//If not logged in to the forum, not allowed any further so redirect to page to say so
if($user_info['is_guest']) {
	header( 'Location: /static/airhockey.html' ) ;
	exit;
};
$uid = $ID_MEMBER;
$name = &$user_info['name'];

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
define ('AIRH',1);   //defined so we can control access to some of the files.
require_once('db.php');
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
require('timeout.php');


?><!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en" dir="ltr">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<title>Melinda's Backups Air Hockey Ladder</title>
	<link rel="stylesheet" type="text/css" href="airh.css"/>
	<!--[if lt IE 7]>
		<link rel="stylesheet" type="text/css" href="airh-ie.css"/>
	<![endif]-->
	<script src="/static/scripts/mootools-1.2.1-core-ac.js" type="text/javascript" charset="UTF-8"></script>
	<script src="ladder.js" type="text/javascript" charset="UTF-8"></script>
	<script src="version.js" type="text/javascript" charset="UTF-8"></script>
</head>
<body>
<script type="text/javascript">
var gaJsHost = (("https:" == document.location.protocol) ? "https://ssl." : "http://www.");
document.write(unescape("%3Cscript src='" + gaJsHost + "google-analytics.com/ga.js' type='text/javascript'%3E%3C/script%3E"));
</script>
<script type="text/javascript">
try {
var pageTracker = _gat._getTracker("UA-xxxxxxx-1");
pageTracker._trackPageview();
} catch(err) {}</script>


<script type="text/javascript">
	<!--
window.addEvent('domready', function() {
	MBahladder.init({user: <?php echo $uid;?>,pass : '<?php echo sha1("Air".$uid); ?>', t:<?php echo $time ?>},
		<?php echo SPECTATOR; ?>,<?php echo AIR_HOCKEY_POLL; ?>);
});
window.addEvent('unload', function() {
	MBahladder.logout(<?php echo OFFLINE; ?>);
	
});
	// -->
</script>

<table id="header" align="center" border="0" cellpadding="0" cellspacing="0" width="100%" >
<tbody>
	<tr>
	<td align="left" width="30" class="topbg_l" height="70">&nbsp;</td>
	<td align="left" colspan="2" class="topbg_r" valign="top"><a href="/" alt="Main Site Home Page">
		<img  style="margin-top: 24px;" src="/static/images/mb-logo-community.gif" alt="Melinda's Backups Community" border="0" /></a>	
		</td>
	<td align="right" width="400" class="topbg" valign="top">
	<span style="font-family: tahoma, sans-serif; margin-left: 5px;">Melinda's Backups Community</span>
	</td>
		<td align="right" width="25" class="topbg_r2" valign="top">
		<div id="nameContainer">
			<h1>Air Hockey Ladder</h1>
		</div>
		<!-- blank -->
		</td>
	</tr>
</tbody>
</table>
<div id="content">
	<p><img id="exittoforum" src="/static/images/exit-f.gif" />  An explanation of how to play can be found <b><a href="rules.html">here</a></b></p>
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
	<div style="clear:both"></div>
	<div id="copyright">Air Hockey <span id="version">php:<?php include('version.php');?> js:</span> &copy; 2009 Alan Chandler.  Licenced under the GPL</div>
</div>
</body>
</html>
