<?php
  /*
    Air Hockey - Reads a string from a pipe
	Copyright (c) 2009 Alan Chandler
	Licenced under the GPL
*/
if(!(isset($_POST['uid']) && isset($_POST['to'])))
	die('Log - Hacking attempt - wrong parameters');
define('AIR_HOCKEY_PATH', dirname($_SERVER['SCRIPT_FILENAME']).'/');
define('AIR_HOCKEY_PIPE_PATH',	AIR_HOCKEY_PATH.'pipes/');


$readpipe=fopen(AIR_HOCKEY_PIPE_PATH.'msg'.$_POST['uid'],'r');
stream_set_timeout($readpipe,$_POST['to']);
$sendpipe=fopen(AIR_HOCKEY_PIPE_PATH.'ack'.$_POST['uid'],'r+');
stream_set_timeout($sendpipe,$_POST['to']);
$response=fread($readpipe,300); //
list($utime,$time) = explode(" ",microtime());
$time .= substr($utime,2,3);
fclose($readpipe);

if(strlen($response) > 0) {
	$response = strchr($response,'$');
	if ($response === false) {
		echo 'No $ in Message';
	} else {
		fwrite($sendpipe,"$");
		echo '{"time":'.$time.',"msg":"'.substr($response,1).'"}';
		
	}
} else {
	echo 'Zero Length Response';
}
fclose($sendpipe);
?>
