<?php
if(!(isset($_GET['pid']) && isset($_GET['pp'])))
	die('Log - Hacking attempt - wrong parameters');
$pid = $_GET['pid'];
if ($_GET['pp'] != sha1("Air".$pid))
	die('Log - Hacking attempt got: '.$_GET['pp'].' expected: '.sha1("Air".$pid));
list($utime,$time) = explode(" ",microtime());
$time .= substr($utime,2,3);
echo '{"servertime":'.$time.'}';
?>

