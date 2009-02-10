<?php
if(!(isset($_POST['pid']) && isset($_POST['pp'])))
	die('Log - Hacking attempt - wrong parameters');
$pid = $_POST['pid'];
if ($_POST['pp'] != sha1("Air".$pid))
	die('Log - Hacking attempt got: '.$_POST['pp'].' expected: '.sha1("Air".$pid));
list($utime,$time) = explode(" ",microtime());
$time .= substr($utime,2,3);
echo '{"servertime":'.$time.'}';
?>

