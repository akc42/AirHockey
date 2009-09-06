<?php
header("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1
header("Expires: -1"); // Date in the past
if(!(isset($_POST['uid']) && isset($_POST['pass'])))
	die('Log - Hacking attempt - wrong parameters');
$uid = $_POST['uid'];
if ($_POST['pass'] != sha1("Air".$uid))
	die('Log - Hacking attempt got: '.$_POST['pass'].' expected: '.sha1("Air".$uid));
list($utime,$time) = explode(" ",microtime());
$time .= substr($utime,2,3);
echo '{"servertime":'.$time.',"error":'.($time-$_POST['t']).'}';
?>

