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

// Set up a user record with type = spectator
dbQuery('BEGIN;');
$result=dbQuery('SELECT * FROM player WHERE state <> '.OFFLINE.' ;');
echo '{ "count":'.dbNumRows($result).' }';
