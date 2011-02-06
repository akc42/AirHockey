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
if(!(isset($_POST['oid']))) {
?><error>Log - Hacking attempt - wrong parameters</error>
<?php
	exit;
}
list($utime,$now1) = explode(" ",microtime());
$now1 .= substr($utime,2,3);

$sendpipe=fopen(AIR_HOCKEY_PIPE_PATH.'ack'.$_POST['oid'],'r+b'); //Say I am ready for a send from the other end

list($utime,$now2) = explode(" ",microtime());
$now2 .= substr($utime,2,3);

$readpipe=fopen(AIR_HOCKEY_PIPE_PATH.'msg'.$_POST['oid'],'rb');

list($utime,$now3) = explode(" ",microtime());
$now3 .= substr($utime,2,3);

fclose($sendpipe);//this tells other end it may now write to the pipe

list($utime,$now4) = explode(" ",microtime());
$now4 .= substr($utime,2,3);

$response=fread($readpipe,400);

list($utime,$time) = explode(" ",microtime());
$time .= substr($utime,2,3);
$now5 = $time;

fclose($readpipe);

list($utime,$now6) = explode(" ",microtime());
$now6 .= substr($utime,2,3);

if(strlen($response) > 0) {
	$r = explode('$',$response);
	if(strlen($r[0]) == 0) { //expect first item to be empty as $ should be first character
		echo '<message time="'.$time.'">'.$r[1].'</message>';
		if(count($r) != 2) {//normal mode = single message as $r[1] but might have one in $r[2]
			echo '<message time="'.$time.'">'.$r[2].'</message>';
		}
	} else {
		echo '<error  now1="'.$now1.'" now2="'.$now2.'" now3="'.$now3.'" now4="'.$now4.'" now5="'.$now5.'" now6="'.$now6.'">$ not first character</error>';
	}
} else {
echo '<error  now1="'.$now1.'" now2="'.$now2.'" now3="'.$now3.'" now4="'.$now4.'" now5="'.$now5.'" now6="'.$now6.'">zero length response = "'.$response.'"</error>';
}

?>
