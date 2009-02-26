<?php
  /*
    Air Hockey - Abort  module
	Copyright (c) 2009 Alan Chandler
	Licenced under the GPL
*/
if(!(isset($_POST['user'])  && isset($_POST['pass'])&& isset($_POST['oid'])))
	die('Log - Hacking attempt - wrong parameters');
$uid = $_POST['user']; //extra security for abort so it doesn't get missued
if ($_POST['pass'] != sha1("Air".$uid))
	die('Log - Hacking attempt got: '.$_POST['pass'].' expected: '.sha1("Air".$uid));
// Link to SMF forum as this is only for logged in members
// Show all errors:
error_reporting(E_ALL);
// Path to the air hockety directory:

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

$pipe=fopen(AIR_HOCKEY_PIPE_PATH.'msg'.$_POST['oid'],'r+'); //If opponent has gone away, I open his message pipe and that releases me
usleep(10000);  //give the other side of the pipe a chance to wake up and notice
fclose($pipe)
$pipe=fopen(AIR_HOCKEY_PIPE_PATH.'ack'.$uid,'r+'); //If opponent has gone away, I open my ack pipe and that releases me
usleep(10000);  //give the other side of the pipe a chance to wake up and notice
fclose($pipe)
?>
