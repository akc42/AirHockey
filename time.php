<?php
if(!(isset($_GET['user']) && isset($_GET['password'])))
	die('Log - Hacking attempt - wrong parameters');
$uid = $_GET['user'];
if ($_GET['password'] != sha1("Key".$uid))
	die('Log - Hacking attempt got: '.$_GET['password'].' expected: '.sha1("Key".$uid));
$toptime = microtime(TRUE)*1000;  //get time as float
echo '{"servertime":'.$toptime.'}';
?>

