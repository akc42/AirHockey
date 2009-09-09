<?php
  /*
    Air Hockey -Play module
	Copyright (c) 2009 Alan Chandler
	Licenced under the GPL
*/
if(!(isset($_GET['user']) && isset($_GET['pass'])))
	die('Log - Hacking attempt - wrong parameters');
$uid = $_GET['user'];
if ($_GET['pass'] != sha1("Air".$uid))
	die('Log - Hacking attempt got: '.$_GET['pass'].' expected: '.sha1("Air".$uid));

define('AIR_HOCKEY_MODEL_TICK',			33);	//milliseconds between calculating new table layout
define('AIR_HOCKEY_OPPONENT_TIMEOUT',	30000);  //Milliseconds to wait until assume opponent has not come (approx 30 secs)
define('AIR_HOCKEY_MODEL_TIMEOUT', 		5000);  //Milliseconds to wait until assume comms running the model have died (approx 2 secs)
define('AIR_HOCKEY_START_DELAY',		5);		//Seconds to start after both sides have synchronised
define('AIR_HOCKEY_MALLET_DELAY',		1000);   // Millisecs between when mallet positions get sent
define('AIR_HOCKEY_MYSIDE_TIMEOUT',		7);		//Seconds before a violation of too long my side
define('AIR_HOCKEY_OFFSET_COUNT',		10);	//how many measurements of time offset do we need to get a good average
define('AIR_HOCKEY_RESTART_DELAY',		10);  //Seconds you have after foul or goal to place puck
define('AIR_HOCKEY_CONTROL_DELAY',		2000); //Milliseconds to have puck on your side to be "in Control" of it
define('AIR_HOCKEY_INPLAY_DELAY',		2); //Seconds after puck server that he is allowed to hit it
		
define ('AIRH',1);   //defined so we can control access to some of the files.
require_once('db.php');

if (isset($_GET['mid'])) {
	$mid = $_GET['mid'];
	//If a mid is set this is match rather than a practice
	$result = dbQuery('SELECT * FROM full_match WHERE mid = '.dbMakeSafe($mid).';');
	if($row = dbFetch($result)) {
		if($uid == $row['hid']) {
			//I had my invite accepted, so therefore I am master
			$isMaster = true;
			$myName = $row['hname'];
			$oid = $row['aid'];
			$opName = $row['aname'];
		} else {
			if($uid != $row['aid'])
				die('Match ('.$mid.') did not have me as a player');
			$isMaster = false;
			$myName = $row['aname'];
			$oid = $row['hid'];
			$opName = $row['hname'];
		}
		$startTime = $row['start_time'];
	} else {
		die('Invalid Match Id = '.$mid);
	}
} else {
	$mid = 0; //No opponent, so say am practicing
	$oid = 0;
	$isMaster = true;
	$opName = '&nbsp;' ;
	$result = dbQuery('SELECT name FROM player WHERE pid = '.dbMakeSafe($uid).';');
	if($row=dbFetch($result)) {
		$myName = $row['name'];
	} else {
		die('Something wrong - I don\'t appear on the database');
	}
	$startTime = time();
}
dbFree($result);
?><!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en" dir="ltr">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<title>Melinda's Backups Air Hockey Game</title>
	<link rel="stylesheet" type="text/css" href="airh.css"/>
	<script src="/static/scripts/mootools-1.2.3-core-yc.js" type="text/javascript" charset="UTF-8"></script>
	<script src="/static/scripts/soundmanager2-nodebug-jsmin.js" type="text/javascript" charset="UTF-8"></script>
	<script src="model.js" type="text/javascript" charset="UTF-8"></script>
	<script src="scoreboard.js" type="text/javascript" charset="UTF-8"></script>
	<script src="scorer.js" type="text/javascript" charset="UTF-8"></script>
	<script src="practice.js" type="text/javascript" charset="UTF-8"></script>
	<script src="match.js" type="text/javascript" charset="UTF-8"></script>
	<script src="opponent.js" type="text/javascript" charset="UTF-8"></script>
	<script src="play.js" type="text/javascript" charset="UTF-8"></script>
	<script src="version.js" type="text/javascript" charset="UTF-8"></script>
</head>
<body>
<script type="text/javascript">
	<!--
var MBahplay;

window.addEvent('domready', function() {
	MBahplay = new Play(
			<?php echo $mid; ?>,
			<?php echo $startTime ; ?>,
			{uid: <?php echo $uid;?>,pass: '<?php echo sha1("Air".$uid); ?>'},
			<?php echo $oid;?>,
			<?php echo (($isMaster)?'true':'false'); ?>,
			{
				tick:<?php echo AIR_HOCKEY_MODEL_TICK ;?>,
				opponent:<?php echo AIR_HOCKEY_OPPONENT_TIMEOUT ; ?>,
				timeout:<?php echo AIR_HOCKEY_MODEL_TIMEOUT ; ?>,
				startup:<?php echo AIR_HOCKEY_START_DELAY ; ?>,
				mallet: <?php echo AIR_HOCKEY_MALLET_DELAY ; ?>,
				myside: <?php echo AIR_HOCKEY_MYSIDE_TIMEOUT ; ?>,
				count: <?php echo AIR_HOCKEY_OFFSET_COUNT ; ?>,
				restart: <?php echo AIR_HOCKEY_RESTART_DELAY ; ?>,
				control:<?php echo AIR_HOCKEY_CONTROL_DELAY ;?>,
				inplay:<?php echo AIR_HOCKEY_INPLAY_DELAY ; ?> 
			},
			{
				table:$('table'),
				surround:$('surround'),
				puck:$('puck'),
				opmallet:$('opmallet'),
				mymallet:$('mymallet'),
				countdown:$('countdown'),
				state:$('state'),
				server:$('server'),
				faceoff:$('faceoff'),
				firstgame:$('firstgame'),
				duration:$('duration'),
				abandon:$('abandon'),
				freeze:$('freeze'),
				message:$('message'),
				version:$('version')
			});
});
window.addEvent('unload', function() {
	MBahplay.end();
	
});
var soundReady = false;
soundManager.url = '/static/scripts/';
soundManager.debugMode = false;
soundManager.onload = function() {
	soundManager.createSound({
		id : 'mallet',
		url : 'mallet.mp3',
		autoLoad : true ,
		autoPlay : false 
	});
	soundManager.createSound({
		id : 'table',
		url : 'table.mp3',
		autoLoad : true ,
		autoPlay : false 
	});
	soundManager.createSound({
		id : 'count',
		url : 'count.mp3',
		autoLoad : true ,
		autoPlay : false 
	});
	soundManager.createSound({
		id : 'start',
		url : 'start.mp3',
		autoLoad : true ,
		autoPlay : false 
	});
	soundManager.createSound({
		id : 'goal',
		url : 'goal.mp3',
		autoLoad : true ,
		autoPlay : false 
	});
	soundManager.createSound({
		id : 'foul',
		url : 'foul.mp3',
		autoLoad : true ,
		autoPlay : false 
	});

	soundReady=true;
};

	// -->
</script>

<div id="content">
	<div id="surround">
<?php
if ($mid != 0) {
?>		<div id="opgoal"></div>
<?php
}			
?>		<div id="table">
			<img id="puck" src="puck.gif"/>
			<img id="opmallet" src="mallet.gif" />
			<img id="mymallet" src="mallet.gif"/>
		</div>
		<div id="mygoal"></div>	
	</div>
	<div id="info">
		<div id="countdown"></div>
		<div id="state"></div>
		<div id="server" ></div><div id="faceoff"></div>
		<div style="clear:both"></div>
		<div class="match">
<?php
if ($oid && !is_null($row['eid'])) {
?>			<div class="eventtitle"><?php echo $row['title'] ; ?></div>
<?php
}
?>			<div class="players">
				<div class="user"><?php echo $myName ; ?></div>
				<div class="user"><?php echo $opName ; ?></div>
			</div>
			<div id="firstgame" class="game">
				<div class="score">0</div>
				<div class="score">0</div>
			</div>
			<div id="duration" class="duration">0:00:00</div>

		</div>
		<div id="message"></div>
		<img id="abandon" src="/static/images/exit.gif" alt="abandonmatch" />
	</div>
	<div id="copyright">Air Hockey <span id="version">php:<?php include('version.php');?> js:</span> &copy; 2009 Alan Chandler.  Licenced under the GPL</div>
</div>
</body>

</html>

