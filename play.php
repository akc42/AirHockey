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
define('AIR_HOCKEY_OPPONENT_TIMEOUT',	909);  //Ticks to wait until assume opponent has not come (approx 30 secs)
define('AIR_HOCKEY_MODEL_TIMEOUT', 		100);  //Ticks to wait until assume comms running the model have died (approx 2 secs)
define('AIR_HOCKEY_START_DELAY',		5);		//Seconds to start after both sides have synchronised
define('AIR_HOCKEY_MALLET_DELAY',		30);   // Ticks between when mallet positions get sent
define('AIR_HOCKEY_MYSIDE_TIMEOUT',		7);		//Seconds before a violation of too long my side
define('AIR_HOCKEY_OFFSET_COUNT',		10);	//how many measurements of time offset do we need to get a good average
define('AIR_HOCKEY_RESTART_DELAY',		5000);  //milliseconds before restarting game start countdown after foul or goal

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
	} else {
		die('Invalid Match Id = '.$mid);
	}
} else {
	$oid = false;  //No opponent, so say am practicing
	$result = dbQuery('SELECT name FROM player WHERE pid = '.dbMakeSafe($uid).';');
	if($row=dbFetch($result)) {
		$myName = $row['name'];
	} else {
		die('Something wrong - I don\'t appear on the database');
	}
}
dbFree($result);
?><!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en" dir="ltr">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<title>Melinda's Backups Air Hockey Game</title>
	<link rel="stylesheet" type="text/css" href="airh.css"/>
	<!--[if lt IE 7]>
		<link rel="stylesheet" type="text/css" href="airh-ie.css"/>
	<![endif]-->
	<script src="/static/scripts/mootools-1.2-core.js" type="text/javascript" charset="UTF-8"></script>
	<script src="/static/scripts/soundmanager2-nodebug-jsmin.js" type="text/javascript" charset="UTF-8"></script>
	<script src="play.js" type="text/javascript" charset="UTF-8"></script>
</head>
<body>
<script type="text/javascript">
	<!--

window.addEvent('domready', function() {
	MBahplay.init({
			uid: <?php echo $uid;?>,
			name: '<?php echo $myName ; ?>',
			password: '<?php echo sha1("Air".$uid); ?>',
			practice: <?php echo (($oid)?'false':'true') ; ?>
		},
		{
			tick:<?php echo AIR_HOCKEY_MODEL_TICK ;?>,
			opponent:<?php echo AIR_HOCKEY_OPPONENT_TIMEOUT ; ?>,
			timeout:<?php echo AIR_HOCKEY_MODEL_TIMEOUT ; ?>,
			startup:<?php echo AIR_HOCKEY_START_DELAY ; ?>,
			mallet: <?php echo AIR_HOCKEY_MALLET_DELAY ; ?>,
			myside: <?php echo AIR_HOCKEY_MYSIDE_TIMEOUT ; ?>,
			count: <?php echo AIR_HOCKEY_OFFSET_COUNT ; ?>,
			restart: <?php echo AIR_HOCKEY_RESTART_DELAY ; ?>
		}
<?php
if($oid) { // not a practice
?>		,{
			uid: <?php echo $oid;?>,
			name: '<?php echo $opName ;?>',
			master: <?php echo (($isMaster)?'true':'false'); ?>,
			mid: <?php echo $mid; ?>
		}
<?php
}	
?>	);
});
window.addEvent('unload', function() {
	MBahplay.logout();
	
});
var soundReady = false;
soundManager.url = '/static/scripts/';
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
<a href="index.php">Return to Index Page</a>
<div id="content">
	<div id="tablesurround">
		<div id="opgoal"></div>			
		<div id="table">
			<img id="puck" src="puck.gif"/>
			<img id="opmallet" src="mallet.gif"/>
			<div id="myarea"><img id="mymallet" src="mallet.gif"/></div>
		</div>
		<div id="mygoal"></div>	
	</div>
	<div id="info">
		<div id="countdown"></div>
		<div id="state"></div>
		<div id="server" ></div><div id="faceoff"></div>
		<div class="match">
<?php
if ($oid && !is_null($row['eid'])) {
?>			<div class="eventtitle"><?php echo $row['title'] ; ?></div>
<?php
}
?>			<div class="players">
				<div class="user"><?php echo $myName ; ?></div>
				<div class="user"><?php if ($oid) echo $opName ; ?></div>
			</div>
			<div class="game">
				<div class="score">0</div>
				<div class="score">0</div>
			</div>
			<div id="duration" class="duration">0:00:00</div>

		</div>
		<div id="message"></div>
	</div>
	<div id="copyright">Air Hockey <span id="version"><?php include('version.php');?></span> &copy; 2009 Alan Chandler.  Licenced under the GPL</div>
</div>
</body>

</html>

