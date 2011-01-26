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
define('AIR_HOCKEY_DATABASE','/home/alan/dev/airhock/db/');

if(!file_exists(AIR_HOCKEY_DATABASE.'airhock.db')) {
	$db = new PDO('sqlite:'.AIR_HOCKEY_DATABASE.'airhock.db');
    $db->exec(file_get_contents(AIR_HOCKEY_DATABASE.'database.sql'));
} else {
	$db = new PDO('sqlite:'.AIR_HOCKEY_DATABASE.'airhock.db');
}
$db->setAttribute(PDO::ATTR_TIMEOUT,25);  //set 25 second timeout on obtaining a lock
$db->exec("PRAGMA foreign_keys = ON");

//This is a convenient place to force everything we output to not be cached

header("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1
header("Expires: Mon, 26 Jul 1997 05:00:00 GMT"); // Date in the past

//define online types
define('OFFLINE',				0);  //user is offline
define('SPECTATOR',				1);  //user is only spectating
define('ANYONE',				2); // user will immediately accept an invite, and will invite anyone who says they are of this type
define('INVITE',				3); // user will only play after an accepted invite
define('ACCEPTED',				4); // another user has indicated he is expecting to play you - you have just not noticed yet
define('MATCH',					5); // in a match
define('PRACTICE',				6); // practicing alone

?>
