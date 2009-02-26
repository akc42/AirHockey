<?php
  /*
    Air Hockey - Sends a single message through a pipe
	Copyright (c) 2009 Alan Chandler
	Licenced under the GPL
*/
if(!(isset($_POST['uid']) && isset($_POST['msg'])))
	die('Log - Hacking attempt - wrong parameters');
define('AIR_HOCKEY_PATH', dirname($_SERVER['SCRIPT_FILENAME']).'/');
define('AIR_HOCKEY_PIPE_PATH',	AIR_HOCKEY_PATH.'pipes/');

$sendpipe=fopen(AIR_HOCKEY_PIPE_PATH.'msg'.$_POST['uid'],'r+');
$readpipe=fopen(AIR_HOCKEY_PIPE_PATH.'ack'.$_POST['uid'],'r');
fwrite($sendpipe,"$".$_POST['msg']);
list($utime,$time) = explode(" ",microtime());
$time .= substr($utime,2,3);
fclose($sendpipe);
$response=fread($readpipe,10);
fclose($readpipe);
$response=strrchr($response,"$");
if($response == "$") {
	echo '{"ok": true,"time":'.$time.'}';
} else {
	echo '{"ok": false,"time":'.$time.',"status":"'.$response.'"}';
}
?>
