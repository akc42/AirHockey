<?php
  /*
    Air Hockey - Sends a single message through a pipe
	Copyright (c) 2009 Alan Chandler
	Licenced under the GPL
*/
if(!(isset($_POST['uid']) && isset($_POST['msg']) && isset($_POST['to'])))
	die('Log - Hacking attempt - wrong parameters');
define('AIR_HOCKEY_PATH', dirname($_SERVER['SCRIPT_FILENAME']).'/');
define('AIR_HOCKEY_PIPE_PATH',	AIR_HOCKEY_PATH.'pipes/');

$sendpipe=fopen(AIR_HOCKEY_PIPE_PATH.'msg'.$_POST['uid'],'r+');
stream_set_timeout($sendpipe,$_POST['to']);
$readpipe=fopen(AIR_HOCKEY_PIPE_PATH.'ack'.$_POST['uid'],'r');
stream_set_timeout($readpipe,$_POST['to']);
fwrite($sendpipe,"$".$_POST['msg']);
list($utime,$time) = explode(" ",microtime());
$time .= substr($utime,2,3);
fclose($sendpipe);

$response=fread($readpipe,10);
fclose($readpipe);
$response=strrchr($response,"$");
if($response == "$") {
	echo '{"time":'.$time.'}';
} else {
	echo 'No $ Message';
}
?>
