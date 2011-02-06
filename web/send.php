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
/* copied from index.php */
define('AIR_HOCKEY_PIPE_PATH',	'/home/alan/dev/airhock/db/');

header("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1
header("Expires: -1"); // Date in the past
if(!(isset($_POST['uid']) && isset($_POST['msg']))) {
	echo '<error>Invalid Parameters</error>';
	exit;
}
list($utime,$now1) = explode(" ",microtime());
$now1 .= substr($utime,2,3);

$readpipe=fopen(AIR_HOCKEY_PIPE_PATH.'ack'.$_POST['uid'],'rb'); //This waits until an read request is outstanding

list($utime,$now2) = explode(" ",microtime());
$now2 .= substr($utime,2,3);

$sendpipe=fopen(AIR_HOCKEY_PIPE_PATH.'msg'.$_POST['uid'],'r+b');

list($utime,$now3) = explode(" ",microtime());
$now3 .= substr($utime,2,3);

$r=fread($readpipe,10); //not reading, but syncronising with other end (this will be satisfied as EOF as other side closes)

list($utime,$now4) = explode(" ",microtime());
$now4 .= substr($utime,2,3);

fclose($readpipe);

list($utime,$now5) = explode(" ",microtime());
$now5 .= substr($utime,2,3);

fwrite($sendpipe,"$".$_POST['msg']);

list($utime,$now6) = explode(" ",microtime());
$now6 .= substr($utime,2,3);

fclose($sendpipe);

list($utime,$now) = explode(" ",microtime());
$now7 .= substr($utime,2,3);

$time = $now7-$now1;
echo '<status time="'.$time.'" now1="'.$now1.'" now2="'.$now2.'" now3="'.$now3.'" now4="'.$now4.'" now5="'.$now5.'" now6="'.$now6.'" now7="'.$now7.'">OK</status>';
?>
