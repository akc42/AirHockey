<?php
  /*
    Air Hockey - Dual Send/Read function for sending messages through a pip
	Copyright (c) 2009 Alan Chandler
	Licenced under the GPL
*/
if(!(isset($_POST['uid']) && isset($_POST['oid'])))
	die('Log - Hacking attempt - wrong parameters');
define('AIR_HOCKEY_PATH', dirname($_SERVER['SCRIPT_FILENAME']).'/');
define('AIR_HOCKEY_PIPE_PATH',	AIR_HOCKEY_PATH.'pipes/');

if(isset($_POST['w'])) {
	$readpipe=fopen(AIR_HOCKEY_PIPE_PATH.'msg'.$_POST['oid'],'r+'); //unlock any previous read (cancel already happened)
	fclose($readpipe);
	$sendpipe=fopen(AIR_HOCKEY_PIPE_PATH.'msg'.$_POST['uid'],'r+');
	fwrite($sendpipe,"$".$_POST['msg']);
	fclose($sendpipe); //there is a small whole here, in that the other end could get another send request up in this small gap.  unlikely.
}
$readpipe=fopen(AIR_HOCKEY_PIPE_PATH.'msg'.$_POST['oid'],'r');
$response=fread($readpipe,100);
list($utime,$time) = explode(" ",microtime());
$time .= substr($utime,2,3);
fclose($readpipe);

if(strlen($response) > 0) {
	$r = strchr($response,'$');
	if ($r === false) {
		echo 'No $ in Message, Message was :'.$response;
	} else {
		echo '{"time":'.$time.',"msg":"'.substr($r,1).'"}';
		
	}
} else {
	echo 'Zero Length Response';
}
?>
