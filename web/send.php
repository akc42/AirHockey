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
	echo '{"OK":false}';
	exit;
}
list($utime,$now) = explode(" ",microtime());
$now .= substr($utime,2,3);
$readpipe=fopen(AIR_HOCKEY_PIPE_PATH.'ack'.$_POST['uid'],'r'); //This waits until an read request is outstanding
$sendpipe=fopen(AIR_HOCKEY_PIPE_PATH.'msg'.$_POST['uid'],'r+');
$r=fread($readpipe,10); //not reading, but syncronising with other end (this will be satisfied as EOF as other side closes)
fclose($readpipe);
fwrite($sendpipe,"$".$_POST['msg']);
fclose($sendpipe);
list($utime,$time) = explode(" ",microtime());
$time .= substr($utime,2,3);
$time -= $now;
echo '{"OK":true,"t":'.$time.'}';
?>
