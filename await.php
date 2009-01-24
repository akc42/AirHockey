<?php
  /*
    Air Hockey - Await  module
	Copyright (c) 2009 Alan Chandler
	Licenced under the GPL
*/
if(!(isset($_GET['pid'])  && isset($_GET['pp']) && isset($_GET['oid'])))
	die('Log - Hacking attempt - wrong parameters');
$uid = $_GET['pid'];
if ($_GET['pp'] != sha1("Air".$uid))
	die('Log - Hacking attempt got: '.$_GET['pp'].' expected: '.sha1("Air".$uid));

define('AIR_HOCKEY_PATH', dirname($_SERVER['SCRIPT_FILENAME']).'/');
define('AIR_HOCKEY_PIPENAME',	AIR_HOCKEY_PATH.'pipes/player');
$toptime=microtime(TRUE)*1000;
$mypipe = AIR_HOCKEY_PIPENAME.$uid;
$oppipe = AIR_HOCKEY_PIPENAME.$GET['oid'];
file_put_contents($mypipe,"A:".$toptime);
if(file_exists($oppipe)) {
	$msg = file_get_contents($oppipe);
	if(substr($msg,0,2) == "A:") {
		echo '{abort:false,ready:true,mytime:'.$toptime.',optime:'.substr($msg,2).'}';
	} else {
		echo '{abort:true}';
	}
} else {
	echo '{abort:false,ready:false}' ;
}
