<?php
  /*
    Air Hockey - Abort  module
	Copyright (c) 2009 Alan Chandler
	Licenced under the GPL
*/
if(!(isset($_GET['pid'])  && isset($_GET['pp'])&& isset($_GET['rw'])&& isset($_GET['ms'])))
	die('Log - Hacking attempt - wrong parameters');
$pid = $_GET['pid']; //extra security for abort so it doesn't get missued
if ($_GET['pp'] != sha1("Air".$pid))
	die('Log - Hacking attempt got: '.$_GET['pp'].' expected: '.sha1("Air".$pid));
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
$uid = $ID_MEMBER;
if ($uid != $pid)
	die('Log - Hacking attempt - invalid user id');

$pipe=fopen(AIR_HOCKEY_PIPE_PATH.(($_GET['rw'] == 'r')?(($_GET['ms'] == 'm')?'mmsg':'smsg'):(($_GET['ms'] == 'm')?'mack':'sack')),'r+');
fwrite($pipe,"X");  //confirm this is an abort
usleep(10000);  //give the other side of the pipe a chance to wake up and notice
fclose($pipe)
?>
