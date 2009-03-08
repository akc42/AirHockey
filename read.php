<?php
  /*
    Air Hockey - Dual Send/Read function for sending messages through a pipe
	Copyright (c) 2009 Alan Chandler
	Licenced under the GPL
*/
header("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1
header("Expires: -1"); // Date in the past
if(!(isset($_POST['oid'])))
	die('Log - Hacking attempt - wrong parameters');
define('AIR_HOCKEY_PATH', dirname($_SERVER['SCRIPT_FILENAME']).'/');
define('AIR_HOCKEY_PIPE_PATH',	AIR_HOCKEY_PATH.'pipes/');

$sendpipe=fopen(AIR_HOCKEY_PIPE_PATH.'ack'.$_POST['oid'],'r+'); //Say I am ready for a send from the other end
$readpipe=fopen(AIR_HOCKEY_PIPE_PATH.'msg'.$_POST['oid'],'r');
$response=fread($readpipe,200);
list($utime,$time) = explode(" ",microtime());
$time .= substr($utime,2,3);
fclose($sendpipe);
fclose($readpipe);

if(strlen($response) > 0) {
	$r = strchr($response,'$');
	if ($r) {
		echo '{"time":'.$time.',"msg":"'.substr($r,1).'"}';
	}
}

?>