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
	global $db,$mid,$startTime,$uid,$oid,$isMaster;
	$db->beginTransaction();
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
				tick:<?php echo get_param('MODEL_TICK') ;?>,
				opponent:<?php echo get_param('OPPONENT_TIMEOUT') ; ?>,
				timeout:<?php echo get_param('MODEL_TIMEOUT') ; ?>,
				maxspeed:<?php echo get_param('MODEL_MAX_SPEED') ; ?>,
				startup:<?php echo get_param('STARTUP_DELAY') ; ?>,
				startdelay:<?php echo get_param('START_DELAY') ; ?>,
				mallet: <?php echo get_param('MALLET_DELAY') ; ?>,
				myside: <?php echo get_param('MYSIDE_TIMEOUT') ; ?>,
				count: <?php echo get_param('OFFSET_COUNT') ; ?>,
				restart: <?php echo get_param('RESTART_DELAY') ; ?>,
				control:<?php echo get_param('CONTROL_DELAY') ;?>,
				inplay:<?php echo get_param('INPLAY_DELAY') ; ?>,
				poll:<?php echo get_param('MATCH_POLL') ;?> 
			},
			{
				table:document.id('table'),
				surround:document.id('surround'),
				puck:document.id('puck'),
				opmallet:document.id('opmallet'),
				mymallet:document.id('mymallet'),
				countdown:document.id('countdown'),
				state:document.id('state'),
				server:document.id('server'),
				faceoff:document.id('faceoff'),
				firstgame:document.id('firstgame'),
				duration:document.id('duration'),
				abandon:document.id('exittoforum'),
				freeze:document.id('freeze'),
				message:document.id('message')
			},
			{
				mymallet:{x:560,y:TY - <?php echo get_param('MALLET_POSITION') ; ?>},
				opmallet:{x:560,y:<?php echo get_param('MALLET_POSITION') ;?>}
<?php
	if(!isset($_GET['mid'])) {
?>				,practice: {
					delay:<?php echo get_param('PRACTICE_DELAY') ;?>,
					tick:<?php echo get_param('PRACTICE_TICK') ;?>,
					c:{x:<?php echo get_param('PRACTICE_CENTRE_X') ;?>,y:<?php echo get_param('PRACTICE_CENTRE_Y') ;?>},
					r:<?php echo get_param('PRACTICE_RADIUS') ;?>,
					d:<?php echo get_param('PRACTICE_DISTANCE') ;?>,
					s:{x:<?php echo get_param('PRACTICE_SERVE_X') ;?>,y:<?php echo get_param('PRACTICE_SERVE_Y') ;?>},
					ran:<?php echo get_param('PRACTICE_RANDOM') ;?>,
					startup:<?php echo get_param('PRACTICE_STARTUP_DELAY') ;?>,
					servedelay:<?php echo get_param('PRACTICE_SERVE_DELAY') ;?>,
					hitdelay:<?php echo get_param('PRACTICE_HIT_DELAY') ;?>
				}
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
	$db->rollBack();
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
