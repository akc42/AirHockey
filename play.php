<?php
  /*
    Air Hockey -Play module
	Copyright (c) 2009 Alan Chandler
	Licenced under the GPL
*/
if(!(isset($_GET['pid']) && isset($_GET['pn'])  && isset($_GET['pp']) && isset($_GET['oid']) && isset($_GET['on']) && isset($_GET['ct'])))
	die('Log - Hacking attempt - wrong parameters');
$pid = $_GET['pid'];
if ($_GET['pp'] != sha1("Air".$pid))
	die('Log - Hacking attempt got: '.$_GET['pp'].' expected: '.sha1("Air".$pid));

define('AIR_HOCKEY_OPPONENT_TIMEOUT',	30000);  //Milliseconds wait until assume opponent has disappeared
define('AIR_HOCKEY_START_DELAY',		5);		//Seconds to start after both sides have synchronised
define('AIR_HOCKEY_MODEL_TICK',			33);	//milliseconds between calculating new table layout
define('AIR_HOCKEY_MALLET_DELAY',		30);   // Ticks between when mallet positions get sent
define('AIR_HOCKEY_OFFSET_COUNT',		10);	//how many measurements of time offset do we need to get a good average

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
	<script src="play.js" type="text/javascript" charset="UTF-8"></script>
</head>
<body>
<script type="text/javascript">
	<!--

window.addEvent('domready', function() {
	MBahplay.init({
			uid: <?php echo $pid;?>,
   			name: '<?php echo $_GET['pn'] ; ?>',
			password : '<?php echo sha1("Air".$pid); ?>'
		},
		<?php echo (($_GET['ct'] == 'M')?'true':'false') ; ?>,
		{
			timeout:<?php echo AIR_HOCKEY_OPPONENT_TIMEOUT ; ?>,
			startup:<?php echo AIR_HOCKEY_START_DELAY ; ?>,
			tick:<?php echo AIR_HOCKEY_MODEL_TICK ;?>,
			mallet: <?php echo AIR_HOCKEY_MALLET_DELAY ; ?>,
			count: <?php echo AIR_HOCKEY_OFFSET_COUNT ; ?>
		}
	);
});
window.addEvent('unload', function() {
	MBahplay.logout();
	
});

	// -->
</script>
<a href="index.php">Return to Index Page</a>
<div id="content">
	<div id="tablesurround">			
		<div id="table">
			<img id="puck" src="puck.gif"/>
			<img id="opmallet" src="mallet.gif"/>
			<div id="myarea"><img id="mymallet" src="mallet.gif"/></div>
		</div>
	</div>
	<div id="info"><div id="state"></div><p id="text"></p></div>
	<div id="copyright">Air Hockey <span id="version"><?php include('version.php');?></span> &copy; 2009 Alan Chandler.  Licenced under the GPL</div>
</div>
</body>

</html>

