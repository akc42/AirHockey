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
fclose($sendpipe);//this tells other end it may now write to the pipe
$response=fread($readpipe,400);
list($utime,$time) = explode(" ",microtime());
$time .= substr($utime,2,3);
fclose($readpipe);

if(strlen($response) > 0) {
	$r = explode('$',$response);
	if(strlen($r[0]) == 0) { //expect first item to be empty as $ should be first character
		echo '{"time":'.$time.',"msg":"'.$r[1].'"';
		if(count($r) != 2) {//normal mode = single message as $r[1] but might have one in $r[2]
			echo ',"msg2":"'.$r[2].'"';
		}
		echo '}';
	}
}

?>