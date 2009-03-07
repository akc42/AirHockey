<?php
  /*
    Air Hockey - Abort  module
	Copyright (c) 2009 Alan Chandler
	Licenced under the GPL
*/
if(!(isset($_POST['uid']) && isset($_POST['oid'])))
	die('Log - Hacking attempt - wrong parameters');
// Show all errors:
error_reporting(E_ALL);
// Path to the air hockety directory:
$uid = $_POST['uid'];
define('AIR_HOCKEY_PATH', dirname($_SERVER['SCRIPT_FILENAME']).'/');
define('AIR_HOCKEY_PIPE_PATH',	AIR_HOCKEY_PATH.'pipes/');

require_once(AIR_HOCKEY_PATH.'../forum/SSI.php');
//If not logged in to the forum, not allowed any further so redirect to page to say so
if($user_info['is_guest']) {
	header( 'Location: /static/airhockey.html' ) ;
	exit;
};
if ($uid != $ID_MEMBER)
	die('Log - Hacking attempt - invalid user id');

$readpipe=fopen(AIR_HOCKEY_PIPE_PATH.'msg'.$_POST['oid'],'r+'); //unlock any previous read (cancel already happened)
fclose($readpipe);
$sendpipe=fopen(AIR_HOCKEY_PIPE_PATH.'ack'.$_POST['uid'],'r+'); //unlock any write waiting to go
fclose($sendpipe);
?>
