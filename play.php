<?php
  /*
    Air Hockey -Play module
	Copyright (c) 2009 Alan Chandler
	Licenced under the GPL
*/
if(!(isset($_GET['pid']) && isset($_GET['pn'])  && isset($_GET['pp']) && isset($_GET['oid']) && isset($_GET['on']) && isset($_GET['ct'])))
	die('Log - Hacking attempt - wrong parameters');
$uid = $_GET['pid'];
if ($_GET['pp'] != sha1("Air".$uid))
	die('Log - Hacking attempt got: '.$_GET['pp'].' expected: '.sha1("Air".$uid));

define('AIR_HOCKEY_MALLET_DELAY',		1000);   //milliseconds between sending your mallet position
define('AIR_HOCKEY_TIMEOUT_UNIT',		1000);  //milliseconds delay for each timeout unit (check done at this delay)
define('AIR_HOCKEY_AWAIT_TIMEOUT',		30);   //seconds between sending checking if opponent is ready
define('AIR_HOCKEY_MODEL_TICK',			33);	//milliseconds between calculating new table layout
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
	MBahplay.init({
			uid: <?php echo $uid;?>,
   			name: '<?php $_GET['pn'] ; ?>',
			password : '<?php echo sha1("Air".$uid); ?>'
		},
		{
			uid:<?php $_GET['oid'];?>,
   			name: '<?php echo $_GET['on']; ?>'
		},
		<?php echo (($GET['ct'] == 'M')?'true':'false') ; ?>,
		{
			mallet: <?php echo AIR_HOCKEY_MALLET_DELAY ; ?>,
			timeout:<?php echo AIR_HOCKEY_TIMEOUT_DELAY ; ?>,
			tick:<?php echo AIR_HOCKEY_MODEL_TICK ;?>,
			count: <?php echo AIR_HOCKEY_OFFSET_COUNT ; ?>,
			await: <?php echo AIR_HOCKEY_AWAIT_TIMEOUT ; ?>
		}
	);
});
window.addEvent('unload', function() {
	MBahplay.logout();
	
});

	// -->
</script>

<div id="content">
	<div id="table">
		<div id="puck"></div>
		<div id="opmallet"></div>
		<div id="mymallet"></div>
		<div id="oparea"></div>
		<div id="myarea"></div>
	</div>
	<div id="info"></div>
	<div id="copyright">Air Hockey <span id="version"><?php include('version.php');?></span> &copy; 2009 Alan Chandler.  Licenced under the GPL</div>
</div>
</body>

</html>

