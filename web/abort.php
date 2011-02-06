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

$sendpipe=fopen(AIR_HOCKEY_PIPE_PATH.'ack'.$_POST['uid'],'r+'); //unlock any write waiting to go
sleep(1);
fclose($sendpipe);

$readpipe=fopen(AIR_HOCKEY_PIPE_PATH.'msg'.$_POST['oid'],'r+'); //unlock any previous read (cancel already happened)
fwrite($readpipe,'$');
sleep(1);
fclose($readpipe);
?><status>DONE</status>
