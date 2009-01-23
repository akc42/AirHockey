<?php
  /*
    Air Hockey
	Copyright (c) 2009 Alan Chandler
	Licenced under the GPL
*/
// Link to SMF forum as this is only for logged in members
// Show all errors:
error_reporting(E_ALL);
// Path to the chat directory:

define('AIR_HOCKEY_PATH', dirname($_SERVER['SCRIPT_FILENAME']).'/');

require_once(AIR_HOCKEY_PATH.'../forum/SSI.php');
//If not logged in to the forum, not allowed any further so redirect to page to say so
if($user_info['is_guest']) {
	header( 'Location: /static/airhockey.html' ) ;
	exit;
};
$uid = $ID_MEMBER;
$name =& $user_info['name'];

//define ('MBA',1);   //defined so we can control access to some of the files.
//require_once('db.php');
//dbQuery('REPLACE INTO users (uid,name,role,moderator) VALUES ('.dbMakeSafe($uid).','.
//				dbMakeSafe($name).','.dbMakeSafe($role).','.dbMakeSafe($mod).') ; ') ;
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
	var me = {};
	me.uid = <?php echo $uid;?> ;
	me.name = '<?php echo $name ; ?>' ;
	me.password =  '<?php echo sha1("Key".$uid); ?>';
	
	var startTime;
	var prevOffset = 0;
	var i = 10;
	var req = new Request.JSON({url:'time.php',method:'get',onComplete: function(response,errorstr) {
		if (response ) {
			var endTime = new Date().getTime();
			var commsTime = endTime - startTime;
			var midTime = parseInt(startTime+ commsTime/2);
			var offsetTime = response.servertime - midTime;
			var corrected = offsetTime-prevOffset;
			var row = new Element('tr');
			var cell = new Element('td',{'text':startTime}).inject(row);
			cell = new Element('td',{'text':endTime}).inject(row);
			cell = new Element('td',{'text':commsTime}).inject(row);
			cell = new Element('td',{'text':midTime}).inject(row);
			cell = new Element('td',{'text':response.servertime}).inject(row);
			cell = new Element('td',{'text':offsetTime}).inject(row);
			cell = new Element('td',{'text':corrected}).inject(row);
			
			row.inject($('listing'),'top');
			if (i-- > 0 ) {
				prevOffset=offsetTime
				startTime = new Date().getTime();
				req.get({user:me.uid,password:me.password});
			}
		}
	}});
	startTime = new Date().getTime();
	req.get({user:me.uid,password:me.password});
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
<dic id="content">
	<table>
		<tbody id="listing">
		</tbody>
	</table>
	<div id="copyright">Air Hockey <span id="version"><?php include('version.php');?></span> &copy; 2009 Alan Chandler.  Licenced under the GPL</div>
</div>
</body>

</html>

