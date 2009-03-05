<?php
  /*
    Air Hockey - Sends a single message through a pipe
	Copyright (c) 2009 Alan Chandler
	Licenced under the GPL
*/
if(!(isset($_POST['uid']) && isset($_POST['msg']) && isset($_POST['oid'])))
	die('Log - Hacking attempt - wrong parameters');
define('AIR_HOCKEY_PATH', dirname($_SERVER['SCRIPT_FILENAME']).'/');
define('AIR_HOCKEY_PIPE_PATH',	AIR_HOCKEY_PATH.'pipes/');

$readpipe=fopen(AIR_HOCKEY_PIPE_PATH.'msg'.$_POST['oid'],'r+'); //unlock any previous read
usleep(10000);
fclose($readpipe);

$sendpipe=fopen(AIR_HOCKEY_PIPE_PATH.'msg'.$_POST['uid'],'r+');
fwrite($sendpipe,"$".$_POST['msg']);
fclose($sendpipe); //there is a small whole here, in that the other end could get another send request up in this small gap.  unlikely.
$readpipe=fopen(AIR_HOCKEY_PIPE_PATH.'msg'.$_POST['oid'],'r');
list($utime,$time) = explode(" ",microtime());
$time .= substr($utime,2,3);
$response=fread($readpipe,100);
fclose($readpipe);

if(strlen($response) > 0) {
	$r = strchr($response,'$');
	if ($r === false) {
		echo 'No $ in Message:'.$response;
	} else {
		echo '{"time":'.$time.',"msg":"'.substr($r,1).'"}';
		
	}
} else {
	echo 'Zero Length Response';
}
?>
