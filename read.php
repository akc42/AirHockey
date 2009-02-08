<?php
  /*
    Air Hockey - Reads a string from a pipe
	Copyright (c) 2009 Alan Chandler
	Licenced under the GPL
*/
if(!(isset($_GET['ms'])))
	die('Log - Hacking attempt - wrong parameters');
define('AIR_HOCKEY_PATH', dirname($_SERVER['SCRIPT_FILENAME']).'/');
define('AIR_HOCKEY_PIPE_PATH',	AIR_HOCKEY_PATH.'pipes/');

$readpipe=fopen(AIR_HOCKEY_PIPE_PATH.(($_GET['ms'] == 'm')?'mmsg':'smsg'),'r');
$sendpipe=fopen(AIR_HOCKEY_PIPE_PATH.(($_GET['ms'] == 'm')?'mack':'sack'),'r+');
$response=fread($readpipe,300); //
$time = (int) (microtime(TRUE)*1000);
fclose($readpipe);
fwrite($sendpipe,"A");
fclose($sendpipe);
if(substr($response,0,1) == "A") {
	echo '{"ok": true,"time":'.$time.',"msg":"'.substr($response,1).'"}';
} else {
	echo '{"ok": false,"time":'.$time.'}';
}
?>
