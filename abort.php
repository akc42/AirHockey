<?php
  /*
    Air Hockey - Abort  module
	Copyright (c) 2009 Alan Chandler
	Licenced under the GPL
*/
if(!(isset($_GET['pid'])  && isset($_GET['pp'])))
	die('Log - Hacking attempt - wrong parameters');
$uid = $_GET['pid'];
if ($_GET['pp'] != sha1("Air".$uid))
	die('Log - Hacking attempt got: '.$_GET['pp'].' expected: '.sha1("Air".$uid));

define('AIR_HOCKEY_PATH', dirname($_SERVER['SCRIPT_FILENAME']).'/');
define('AIR_HOCKEY_PIPENAME',	AIR_HOCKEY_PATH.'pipes/player');
file_put_contents(AIR_HOCKEY_PIPENAME.$uid,"X:");
?>
