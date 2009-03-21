<?php
  /*
    Air Hockey - Abort  module
	Copyright (c) 2009 Alan Chandler
	Licenced under the GPL
*/
header("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1
header("Expires: -1 ");

if(!(isset($_GET['u']) && isset($_GET['p'])))
	die('Log - Hacking attempt - wrong parameters');
// Show all errors:
error_reporting(E_ALL);
// Path to the air hockety directory:

define('AIR_HOCKEY_PATH', dirname($_SERVER['SCRIPT_FILENAME']).'/');
define('AIR_HOCKEY_PIPE_PATH',	AIR_HOCKEY_PATH.'pipes/');

$p =(($_GET['p'] == 'a')?'ack':'msg').$_GET['u'];

$sendpipe=fopen(AIR_HOCKEY_PIPE_PATH.$p,'r+'); //unlock any write waiting to go
sleep(1);
fclose($sendpipe);

?><!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en" dir="ltr">
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
		<title>Melinda's Backups Air Hockey Freeer</title>
	</head>
	<body>
<?php
	 echo 'Freed pipe '.$p.'<br/>' ;
?>	</body>
</html>