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
if(!(isset($_POST['oid'])))
	die('Log - Hacking attempt - wrong parameters');

$sendpipe=fopen(AIR_HOCKEY_PIPE_PATH.'ack'.$_POST['oid'],'r+'); //Say I am ready for a send from the other end
$readpipe=fopen(AIR_HOCKEY_PIPE_PATH.'msg'.$_POST['oid'],'r');
fclose($sendpipe);//this tells other end it may now write to the pipe
$response=fread($readpipe,400);
list($utime,$time) = explode(" ",microtime());
$time .= substr($utime,2,3);
fclose($readpipe);

if(strlen($response) > 0) {
	$r = explode('$',$response);
	if(strlen($r[0]) == 0) { //expect first item to be empty as $ should be first character
		echo '{"time":'.$time.',"msg":"'.$r[1].'"';
		if(count($r) != 2) {//normal mode = single message as $r[1] but might have one in $r[2]
			echo ',"msg2":"'.$r[2].'"';
		}
		echo '}';
	} else {
		echo '{"time":'.$time.',"msg":"abort"}';
	}
} else {
echo '{"time":'.$time.',"msg":"abort"}';
}

?>
