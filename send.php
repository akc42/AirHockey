<?php
  /*
    Air Hockey - Dual Send/Read function for sending messages through a pipe
	Copyright (c) 2009 Alan Chandler
	Licenced under the GPL
*/
header("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1
header("Expires: -1"); // Date in the past
if(!(isset($_POST['uid']) && isset($_POST['msg'])))
	die('Log - Hacking attempt - wrong parameters');
define('AIR_HOCKEY_PATH', dirname($_SERVER['SCRIPT_FILENAME']).'/');
define('AIR_HOCKEY_PIPE_PATH',	AIR_HOCKEY_PATH.'pipes/');

list($utime,$now) = explode(" ",microtime());
$now .= substr($utime,2,3);
$readpipe=fopen(AIR_HOCKEY_PIPE_PATH.'ack'.$_POST['uid'],'r'); //This waits until an read request is outstanding
$sendpipe=fopen(AIR_HOCKEY_PIPE_PATH.'msg'.$_POST['uid'],'r+');
$r=fread($readpipe,10); //not reading, but syncronising with other end (this will be satisfied as EOF as other side closes)
fclose($readpipe);
fwrite($sendpipe,"$".$_POST['msg']);
fclose($sendpipe);
list($utime,$time) = explode(" ",microtime());
$time .= substr($utime,2,3);
$time -= $now;
echo '{"t":'.$time.'}';
?>