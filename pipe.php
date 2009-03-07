<?php
  /*
    Air Hockey - Dual Send/Read function for sending messages through a pipe
	Copyright (c) 2009 Alan Chandler
	Licenced under the GPL
*/
if(!(isset($_POST['uid']) && isset($_POST['oid'])))
	die('Log - Hacking attempt - wrong parameters');
define('AIR_HOCKEY_PATH', dirname($_SERVER['SCRIPT_FILENAME']).'/');
define('AIR_HOCKEY_PIPE_PATH',	AIR_HOCKEY_PATH.'pipes/');
echo '{';
if(isset($_POST['w'])) {

$m=substr($_POST['msg'],0,1);
if(!($m=="M" || $m == "P")) {
	echo '"w":"'.substr($_POST['msg'],0,1).'",';
	list($utime,$time) = explode(" ",microtime());
	$time .= substr($utime,2,3);
	echo '"t1":'.($time-$_POST['w']).',';
}
	$readpipe=fopen(AIR_HOCKEY_PIPE_PATH.'msg'.$_POST['oid'],'r+'); //unlock any previous read (cancel already happened)
	$sendpipe=fopen(AIR_HOCKEY_PIPE_PATH.'msg'.$_POST['uid'],'r+');
	fwrite($sendpipe,"$".$_POST['msg']);
	$readpipe=fopen(AIR_HOCKEY_PIPE_PATH.'ack'.$_POST['uid'],'r'); //This waits until an ack gets sent
	fclose($readpipe);
	fclose($sendpipe); //there is a small whole here, in that the other end could get another send request up in this small gap.  unlikely.
}
$sendpipe=fopen(AIR_HOCKEY_PIPE_PATH.'ack'.$_POST['oid'],'r+'); //Say I am ready for a read
$readpipe=fopen(AIR_HOCKEY_PIPE_PATH.'msg'.$_POST['oid'],'r');
$response=fread($readpipe,100);
list($utime,$time) = explode(" ",microtime());
$time .= substr($utime,2,3);
fclose($readpipe);
fclose($sendpipe);
if(isset($_POST['w'])) {
list($utime,$time) = explode(" ",microtime());
$time .= substr($utime,2,3);
echo '"t2":'.($time-$_POST['w']).',';
}

if(strlen($response) > 0) {
	$r = strchr($response,'$');
	if ($r === false) {
		echo '"ok":false,"time":'.$time.'}' ;
	} else {
		echo '"ok":true, "time":'.$time.',"msg":"'.substr($r,1).'"}';
	}
} else {
		echo '"ok":false,"time":'.$time.'}' ;
}
	
?>
