<?php
  /*
    Air Hockey - Reads a string from a pipe
	Copyright (c) 2009 Alan Chandler
	Licenced under the GPL
*/
if(!(isset($_POST['uid'])))
	die('Log - Hacking attempt - wrong parameters');
define('AIR_HOCKEY_PATH', dirname($_SERVER['SCRIPT_FILENAME']).'/');
define('AIR_HOCKEY_PIPE_PATH',	AIR_HOCKEY_PATH.'pipes/');

$readpipe=fopen(AIR_HOCKEY_PIPE_PATH.'msg'.$_POST['uid'],'r');
$sendpipe=fopen(AIR_HOCKEY_PIPE_PATH.'ack'.$_POST['uid'],'r+');
$response=fread($readpipe,300); //
list($utime,$time) = explode(" ",microtime());
$time .= substr($utime,2,3);
fclose($readpipe);

if(strlen($response) > 0) {
	$response = strchr($response,'$');
	if ($response === false) {
		echo '{"ok": false,"time":'.$time.',"status":"no dollar"}';
	} else {
		fwrite($sendpipe,"$");
		echo '{"ok": true,"time":'.$time.',"msg":"'.substr($response,1).'"}';
		
	}
} else {
	echo '{"ok": false,"time":'.$time.',"status":"zero length"}';
}
fclose($sendpipe);
?>
