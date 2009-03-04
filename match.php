<?php
  /*
    Air Hockey - Match  module
	Copyright (c) 2009 Alan Chandler
	Licenced under the GPL
*/
if(!(isset($_POST['uid'])  && isset($_POST['pass'])&& isset($_POST['m'])&& isset($_POST['g'])&& isset($_POST['h'])&& isset($_POST['a'])))
	die('Log - Hacking attempt - wrong parameters');
$uid = $_POST['uid']; //extra security for abort so it doesn't get missued
if ($_POST['pass'] != sha1("Air".$uid))
	die('Log - Hacking attempt got: '.$_POST['pass'].' expected: '.sha1("Air".$uid));
// Show all errors:
error_reporting(E_ALL);
$mid = $_POST['m'];
// Path to the air hockety directory:
define ('AIRH',1);   //defined so we can control access to some of the files.
require_once('db.php');

dbQuery('BEGIN;');
$now = dbPostSafe(time());
$g = $_POST['g'];

$result = dbQuery('SELECT * FROM match WHERE mid = '.dbMakeSafe($mid).' ;');
if(dbNumRows($result) > 0) {
	if($g > 0) {
		dbQuery('UPDATE match SET  last_activity = '.$now.', h'.$g.' = '.dbPostSafe($_POST['h']).' , a'.$g.' = '.dbPostSafe($_POST['a'])
				.' WHERE mid = '.dbMakeSafe($mid).' ;');
	} else {
		if($g == 0) {
			dbQuery('UPDATE match SET  last_activity = '.$now.', end_date = '.$now.' WHERE mid = '.dbMakeSafe($mid).' ;');
		} else {
			dbQuery('UPDATE match SET  last_activity = '.$now.', end_date = '.$now.', abandon = \'A\' WHERE mid = '.dbMakeSafe($mid).' ;');
		}
	}
	dbQuery('COMMIT;');
	echo '{"OK":true}';
} else {
	dbQuery('ROLLBACK;');
	echo 'Match with mid = '.$mid.' does not exist';
}
?>
