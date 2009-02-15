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

// Set up a user record with type = spectator
dbQuery('BEGIN;');
$result=dbQuery('SELECT * FROM player WHERE pid = '.dbMakeSafe($uid).';');
if(dbNumRows($result) > 0) {
	dbQuery('UPDATE player SET last_poll = DEFAULT, name = '
			.dbPostSafe($name).', state = '.SPECTATOR.', last_state = DEFAULT WHERE pid = '.dbMakeSafe($uid).';');
} else {
	dbQuery('INSERT INTO player (pid,name,last_poll, state, last_state, mu, sigma) VALUES ('
			.dbMakeSafe($uid).','.dbPostSafe($name).', DEFAULT,'.SPECTATOR.',DEFAULT, DEFAULT,DEFAULT);');
}
dbQuery('COMMIT;');

//Timeout users who are supposed to be on line, but haven't contacted for a while
require('timeout.php');

$time = time();

?><!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en" dir="ltr">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<title>Melinda's Backups Air Hockey Ladder</title>
	<link rel="stylesheet" type="text/css" href="airh.css"/>
	<!--[if lt IE 7]>
		<link rel="stylesheet" type="text/css" href="airh-ie.css"/>
	<![endif]-->
	<script src="/static/scripts/mootools-1.2-core.js" type="text/javascript" charset="UTF-8"></script>
	<script src="ladder.js" type="text/javascript" charset="UTF-8"></script>
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
	MBahladder.init({uid: <?php echo $uid;?>,
				name: '<?php echo $name ; ?>',
				password : '<?php echo sha1("Air".$uid); ?>'},<?php echo $time ?>); 
});
window.addEvent('unload', function() {
	MBahladder.logout();
	
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
	<a href="/forum"><img src="/static/images/exit-f.gif" /></a>
	<div id="matchlist">
		<div id="matchlistheader">Recent and Current Matches</div>
		<div class="match">
			<div class="eventtitle">The Melinda Trophy</div>
			<div class="players">
				<div class="user">Less Confused Today</div>
				<div class="user">Vickster</div>
			</div>
			<div class="game">
				<div class="score">7</div>
				<div class="score">5</div>
			</div>
			<div class="game">
				<div class="score">6</div>
				<div class="score">7</div>
			</div>
			<div class="game">
				<div class="score">0</div>
				<div class="score">2</div>
			</div>
			<div class="duration">1:15</div>
		</div>
		<div class="match">
			<div class="eventtitle">The Melinda Trophy</div>
			<div class="players">
				<div class="user">Less Confused Today</div>
				<div class="user">Alan</div>
			</div>
			<div class="game">
				<div class="score">7</div>
				<div class="score">5</div>
			</div>
			<div class="game">
				<div class="score">6</div>
				<div class="score">7</div>
			</div>
			<div class="game">
				<div class="score">3</div>
				<div class="score">7</div>
			</div>
			<div class="game">
				<div class="score">2</div>
				<div class="score">7</div>
			</div>
			<div class="game">
				<div class="score">7</div>
				<div class="score">6</div>
			</div>
			<div class="game">
				<div class="score">7</div>
				<div class="score">3</div>
			</div>
			<div class="game">
				<div class="score">6</div>
				<div class="score">7</div>
			</div>
			<div class="endmatch">08:20 pm 16-Mar-2009</div>
		</div>
	</div>
	<div id="online">
		<div id="meOnline">
			<div id="meHeader">Alan</div>
			<div id="meOption">
				<input type="radio" name="playertype" value="P"/>Practice<br/>
				<input type="radio" name="playertype" value="S" checked="checked"/>Spectator<br/>
				<input type="radio" name="playertype" value="A"/>Play Anyone<br/>
				<input type="radio" name="playertype" value="I"/>By Invite Only</div>
		</div>
		<div id="onlineListHeader">Others Online</div>
		<div class="onlineUser"><div class="ouser">Oldschool80s</div><div class="byInvite">I</div></div>
		<div class="onlineUser"><div class="ouser">Rhonda</div><div class="inviteFrom">F</div></div>
		<div class="onlineUser"><div class="ouser">GHopper</div><div class="inviteTo">T</div></div>
		<div class="onlineUser"><div class="ouser">Gemini2</div></div>
		<div class="onlineUser"><div class="ouser">MCaro05</div><div class="free">A</div></div>
		<div class="onlineUser"><div class="ouser">Vickster</div><div class="inmatch">M</div></div>
		<div class="onlineUser"><div class="ouser">Less Confused Today</div><div class="inmatch">M</div></div>
	</div>
	<div style="clear:both"></div>
	<div id="copyright">Air Hockey <span id="version"><?php include('version.php');?></span> &copy; 2009 Alan Chandler.  Licenced under the GPL</div>
</div>
</body>
</html>
