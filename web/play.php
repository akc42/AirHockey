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
if(!(isset($_GET['user']) && isset($_GET['pass'])))
	die('Log - Hacking attempt - wrong parameters');
$uid = $_GET['user'];
if ($_GET['pass'] != sha1("Air".$uid))
	die('Log - Hacking attempt got: '.$_GET['pass'].' expected: '.sha1("Air".$uid));

define('AIR_HOCKEY_MODEL_TICK',			33);	//milliseconds between calculating new table layout
define('AIR_HOCKEY_OPPONENT_TIMEOUT',	30000);  //Milliseconds to wait until assume opponent has not come (approx 30 secs)
define('AIR_HOCKEY_MODEL_TIMEOUT', 		5000);  //Milliseconds to wait until assume comms running the model have died (approx 2 secs)
define('AIR_HOCKEY_MODEL_MAX_SPEED',	3.5);		//Max distance puck can travel in a millisecond
define('AIR_HOCKEY_START_DELAY',		5);		//Seconds to start after both sides have synchronised
define('AIR_HOCKEY_MALLET_DELAY',		1000);   // Millisecs between when mallet positions get sent
define('AIR_HOCKEY_MYSIDE_TIMEOUT',		7);		//Seconds before a violation of too long my side
define('AIR_HOCKEY_OFFSET_COUNT',		10);	//how many measurements of time offset do we need to get a good average
define('AIR_HOCKEY_RESTART_DELAY',		10);  //Seconds you have after foul or goal to place puck
define('AIR_HOCKEY_CONTROL_DELAY',		2000); //Milliseconds to have puck on your side to be "in Control" of it
define('AIR_HOCKEY_INPLAY_DELAY',		2); //Seconds after puck server that he is allowed to hit it
define('AIR_HOCKEY_MATCH_POLL',			60000); //Milliseconds between polls whilst in match to show still here
define('AIR_HOCKEY_MALLET_POSITION', 148);  //Mallet starting position measured in model coordinate from goal (table length = 2400)
/*
	The following definition is a javascript object containing all the starting parameters for the opponent simulation
	that runs in practice mode.  It is easy to be confused with the coordinate systems because the main game runs on the assumption
	that "My" end is the high values of y and the Opponent runs with low values of y.  However, although we are the opponent here,
	the internal simulation it runs to decide what to do pretends it is playing a game in which it is the "My" end (ie all the
	coordinates are reversed.  It has an internal copy of the match (with a dummy scoreboard) and table (with associated pucks and 
	mallets) objects with everything reversed.
	
	These parameters refer to the values of the internal model.  That is they should have high y values
*/   
define('AIR_HOCKEY_PRACTICE_PARAMS', '{delay:2500,tick:50,c:{x:560,y:2006},r:200,d:0.3,s:{x:560,y:1290},ran:40}');  
		
require_once('./db.inc');

$player = $db->prepare("SELECT name FROM player WHERE pid = ?");
$player->bindValue(1,$uid,PDO::PARAM_INT);
$practice = $db->prepare("INSERT INTO match (hid,aid,abandon) VALUES ( ?,NULL,'P')");
$practice->bindValue(1,$uid,PDO::PARAM_INT);


$db->beginTransaction();

if (isset($_GET['mid'])) {
	$mid = $_GET['mid'];
	//If a mid is set this is match rather than a practice
	$match = $db->prepare("SELECT * FROM full_match WHERE mid = ?");
	$match->bindValue(1,$mid,PDO::PARAM_INT);
	$match->execute();
	if($row = $match->fetch(PDO::FETCH_ASSOC)) {
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
	$match->closeCursor();
} else {
	$oid = 0;
	$isMaster = true;
	$opName = 'My Computer (Practice)' ;
	$player->execute();
	if(!($myName=$player->fetchColumn())) die('Something wrong - I don\'t appear on the database');
	$startTime = time();
	$player->closeCursor();
	$practice->execute(); //create practice match
	$mid = $db->lastInsertId();
}
$db->commit();

function head_content() {
	global $mid,$startTime,$uid,$oid,$isMaster;
?>	<title>Melinda's Backups Air Hockey Game Play Screen</title>
	<link rel="stylesheet" type="text/css" href="airh.css"/>
	<script src="soundmanager2-nodebug-jsmin.js" type="text/javascript" charset="UTF-8"></script>
	<script src="model.js" type="text/javascript" charset="UTF-8"></script>
	<script src="scorer.js" type="text/javascript" charset="UTF-8"></script>
	<script src="scoreboard.js" type="text/javascript" charset="UTF-8"></script>
	<script src="match.js" type="text/javascript" charset="UTF-8"></script>
<? if(!isset($_GET['mid'])) {
?>	<script src="practice.js" type="text/javascript" charset="UTF-8"></script>
<?php
	} else {
?>	<script src="opponent.js" type="text/javascript" charset="UTF-8"></script>
<?php
	}
?>	<script src="play.js" type="text/javascript" charset="UTF-8"></script>
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
				maxspeed:<?php echo AIR_HOCKEY_MODEL_MAX_SPEED ; ?>,
				startup:<?php echo AIR_HOCKEY_START_DELAY ; ?>,
				mallet: <?php echo AIR_HOCKEY_MALLET_DELAY ; ?>,
				myside: <?php echo AIR_HOCKEY_MYSIDE_TIMEOUT ; ?>,
				count: <?php echo AIR_HOCKEY_OFFSET_COUNT ; ?>,
				restart: <?php echo AIR_HOCKEY_RESTART_DELAY ; ?>,
				control:<?php echo AIR_HOCKEY_CONTROL_DELAY ;?>,
				inplay:<?php echo AIR_HOCKEY_INPLAY_DELAY ; ?>,
				poll:<?php echo AIR_HOCKEY_MATCH_POLL ;?> 
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
				abandon:$('exittoforum'),
				freeze:$('freeze'),
				message:$('message')
			},
			{
				mymallet:{x:560,y:<?php echo 2400 - AIR_HOCKEY_MALLET_POSITION ; ?>},
				opmallet:{x:560,y:<?php echo AIR_HOCKEY_MALLET_POSITION ;?>}
<?php
	if(!isset($_GET['mid'])) {
?>				,practice: <?php echo AIR_HOCKEY_PRACTICE_PARAMS ;?>
<?php
}
?>			
			}
		);
});
window.addEvent('unload', function() {
	MBahplay.end();
	
});
var soundReady = false;
soundManager.url = '';
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
<?php
}
function content_title() {
	echo 'Air Hockey Match';
}

function menu_items() {
?>		<img id="exittoforum" src="/static/images/exit.gif" alt="abandonmatch" />
<?php
}

function content() {
	global $mid,$myName,$opName,$oid, $row;
?>	<div id="msgframe"><div id="message"></div></div>
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
				<div class="user"><?php echo $opName ; ?></div>
			</div>
			<div id="firstgame" class="game">
				<div class="score">0</div>
				<div class="score">0</div>
			</div>
			<div id="duration" class="duration">0:00:00</div>

		</div>
	</div>
	<div id="surround">
		<div id="mygoal"></div>	
		<div id="table">
			<img id="puck" src="puck.gif"/>
			<img id="opmallet" src="mallet.gif" />
			<img id="mymallet" src="mallet.gif"/>
		</div>
		<div id="opgoal"></div>
	</div>
<?php
}

function foot_content () {
?>	<div id="copyright">Air Hockey <span id="version">php:<?php include('./version.inc');?></span> &copy; 2009-2011 Alan Chandler.  Licenced under the GPL</div>
<?php
}
require_once($_SERVER['DOCUMENT_ROOT'].'/inc/template.inc'); 
?>
