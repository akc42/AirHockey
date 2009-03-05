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

$pipe=fopen(AIR_HOCKEY_PIPE_PATH.'msg'.$_POST['oid'],'r+'); //If opponent has gone away, I open his for writing and that releases me trying to read it
usleep(10000);  //give the other side of the pipe a chance to wake up and notice
fclose($pipe);
//$pipe=fopen(AIR_HOCKEY_PIPE_PATH.'msg'.$uid,'r+'); //In case my opponent is stuck, he should be reading from my pipe, so I open it and release him
//usleep(10000);  //give the other side of the pipe a chance to wake up and notice
//fclose($pipe);
?>
