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

require_once('./db.inc');
	
	$db_server = 'localhost';
	$db_name = 'melindas_air';
	$db_user = 'melindas_air';
	$db_password = 'xxxxxx';
	pg_connect("host=$db_server dbname=$db_name user=$db_user
		password=$db_password") 
			or die('Could not connect to database: ' . pg_last_error());
	function dbQuery($sql) {
		$result = pg_query($sql);
		if (!$result) {
			echo '<tt>';
			echo "<br/><br/>\n";
			print_r(debug_backtrace());			
			echo "<br/><br/>\n";
			echo $sql;
			echo "<br/><br/>\n\n";
			echo pg_last_error();
			echo "<br/><br/>\n\n";
			echo '</tt>';
			die('<p>Please inform <i>webmaster@melindasbackups.com</i> that a database query failed in the airhockey and include the above text.<br/><br/>Thank You</p>');
		}
		return $result;
	}
	function dbFetch($result) {
		return pg_fetch_assoc($result);
	}
	function dbFree($result){
		pg_free_result($result);
	}
	
$player = $db->prepare("INSERT OR REPLACE INTO player(pid,name,mu,sigma,last_match,iid,last_poll,state,last_state) VALUES(?,?,?,?,?,?,?,?,?)");

$db->beginTransaction();

$result=dbQuery("SELECT * FROM player");
while($row = dbFetch($result)) {
echo "Doing player ".$row['pid']."<br/>\n";
	$player->bindValue(1,$row['pid'],PDO::PARAM_INT);
	$player->bindValue(2,$row['name']);
	$player->bindValue(3,$row['mu']);
	$player->bindValue(4,$row['sigma']);
	$player->bindValue(5,$row['last_match'],PDO::PARAM_INT);
	$player->bindValue(6,$row['iid'],PDO::PARAM_INT);
	$player->bindValue(7,$row['last_poll'],PDO::PARAM_INT);
	$player->bindValue(8,$row['state'],PDO::PARAM_INT);
	$player->bindValue(9,$row['last_state'],PDO::PARAM_INT);
	$player->execute();
	$player->closeCursor();
}
$db->commit();
dbFree($result);

?>
