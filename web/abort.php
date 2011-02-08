<?php
/*
 	Copyright (c) 2009-2011 Alan Chandler
    This file is part of AirHockey, an real time simulation of Air Hockey
    for playing over the internet.

    AirHockey is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    AirHockey is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with AirHockey (file supporting/COPYING.txt).  If not, 
    see <http://www.gnu.org/licenses/>.

*/
/* Derived from value in index.php */
define('AIR_HOCKEY_PIPE_PATH',	'/home/alan/dev/airhock/db/');

header("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1
header("Expires: Mon, 26 Jul 1997 05:00:00 GMT"); // Date in the past

if(!(isset($_POST['uid']) && isset($_POST['oid']))) {
?><error>Log - Hacking attempt - wrong parameters</error>
<?php
	exit;
}
// Show all errors:
error_reporting(E_ALL);
// Path to the air hockety directory:
$uid = $_POST['uid'];

require_once(AIR_HOCKEY_PATH.'../forum/SSI.php');
//If not logged in to the forum, not allowed any further so redirect to page to say so
if($user_info['is_guest']) {
	header( 'Location: /static/airhockey.html' ) ;
	exit;
};
if ($uid != $ID_MEMBER) {
?><error>Log - Hacking attempt - invalid user id</error>
<?php
	exit;
}
$uid = $_POST['uid'];
// We delete any old fifo(s) and create new ones for this user and his opponent (to clear out stale messages)
$old_umask = umask(0007);
if(file_exists(AIR_HOCKEY_PIPE_PATH."msg".$uid)) unlink(AIR_HOCKEY_PIPE_PATH."msg".$uid);
posix_mkfifo(AIR_HOCKEY_PIPE_PATH."msg".$uid,0660);
if(file_exists(AIR_HOCKEY_PIPE_PATH."ack".$uid)) unlink(AIR_HOCKEY_PIPE_PATH."ack".$uid);
posix_mkfifo(AIR_HOCKEY_PIPE_PATH."ack".$uid,0660);
$uid = $_POST['oid'];
if(file_exists(AIR_HOCKEY_PIPE_PATH."msg".$uid)) unlink(AIR_HOCKEY_PIPE_PATH."msg".$uid);
posix_mkfifo(AIR_HOCKEY_PIPE_PATH."msg".$uid,0660);
if(file_exists(AIR_HOCKEY_PIPE_PATH."ack".$uid)) unlink(AIR_HOCKEY_PIPE_PATH."ack".$uid);
posix_mkfifo(AIR_HOCKEY_PIPE_PATH."ack".$uid,0660);

umask($old_umask);
?><status>DONE</status>
