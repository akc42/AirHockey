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
  /*
    Air Hockey - Poll  module
		Handles the poll from a running match and just updates the user record so we know he is still there	
	Manditory parameters
		user - user id
		pass - password to protect

*/
if(!(isset($_POST['user'])  && isset($_POST['pass'])))
	die('Log - Hacking attempt - wrong parameters');
$uid = $_POST['user']; //extra security 
if ($_POST['pass'] != sha1("Air".$uid))
	die('Log - Hacking attempt got: '.$_POST['pass'].' expected: '.sha1("Air".$uid));

require_once('./db.inc');

$player = $db->prepare("UPDATE player SET last_poll = (strftime('%s','now')) WHERE pid = ?");
$player->bindValue(1,$uid,PDO::PARAM_INT);
$player->execute();  //no point in a transaction for this one request
$player->closeCursor();
?>
