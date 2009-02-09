<?php
  /*
    Air Hockey - Sends a single message through a pipe
	Copyright (c) 2009 Alan Chandler
	Licenced under the GPL
*/
if(!(isset($_GET['ms'])  && isset($_GET['msg'])))
	die('Log - Hacking attempt - wrong parameters');
define('AIR_HOCKEY_PATH', dirname($_SERVER['SCRIPT_FILENAME']).'/');
define('AIR_HOCKEY_PIPE_PATH',	AIR_HOCKEY_PATH.'pipes/');

$sendpipe=fopen(AIR_HOCKEY_PIPE_PATH.(($_GET['ms'] == 'm')?'mmsg':'smsg'),'r+');
$readpipe=fopen(AIR_HOCKEY_PIPE_PATH.(($_GET['ms'] == 'm')?'mack':'sack'),'r');
fwrite($sendpipe,"A".$_GET['msg']);
list($utime,$time) = explode(" ",microtime());
$time .= substr($utime,2,3);
fclose($sendpipe);
$response=fread($readpipe,1);
fclose($readpipe);
if($response == "A") {
	echo '{"ok": true,"time":'.$time.'}';
} else {
	echo '{"ok": false,"time":'.$time.'}';
}
?>
