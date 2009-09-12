<?php
  /*
    Air Hockey - counts how many are on-line
	Copyright (c) 2009 Alan Chandler
	Licenced under the GPL
*/
// Link to SMF forum as this is only for logged in members
// Show all errors:
error_reporting(E_ALL);
// Path to the air hockety directory:

define ('AIRH',1);   //defined so we can control access to some of the files.
require_once('db.php');
require('timeout.php');
// Set up a user record with type = spectator
$result=dbQuery('SELECT count(*) as players FROM player WHERE state <> '.OFFLINE.' ;');
if ($row=dbFetch($result)) {
    echo $row['players'];
} else {
    echo '0';
}
dbFree($result);
?>