<?php
if(!(isset($_GET['pid']) && isset($_GET['pp'])))
	die('Log - Hacking attempt - wrong parameters');
$pid = $_GET['pid'];
if ($_GET['pp'] != sha1("Air".$uid))
	die('Log - Hacking attempt got: '.$_GET['pp'].' expected: '.sha1("Air".$pid));
$toptime = microtime(TRUE)*1000;  //get time as float
echo '{"servertime":'.$toptime.'}';
?>

