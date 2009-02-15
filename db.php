<?php
/* Football Picking Competition
 *	Copyright (c) 2008 Alan Chandler
 *	See COPYING.txt in this directory for details of licence terms
*/

//This is a convenient place to force everything we output to not be cached (even 
header("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1
header("Expires: Mon, 26 Jul 1997 05:00:00 GMT"); // Date in the past

	if (!defined('AIRH'))
		die('Hacking attempt...');

//define online types
define('OFFLINE',				0);  //user is offline
define('SPECTATOR',				1);  //user is only spectating
define('ANYONE',				2); // user will immediately accept an invite, and will invite anyone who says they are of this type
define('INVITE',				3); // user will only play after an accepted invite
define('ACCEPTED',				4); // another user has indicated he is expecting to play you - you have just not noticed yet
define('MATCH',					5); // in a match
define('PRACTICE',				6); // practicing alone

	
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
	function dbMakeSafe($value) {
		if (!get_magic_quotes_gpc()) {
			$value=pg_escape_string($value);
		}
		return "'".$value."'" ;
	}
	function dbPostSafe($text) {
	  if ($text == '') return 'NULL';
	  return dbMakeSafe(htmlentities($text,ENT_QUOTES,'UTF-8',false));
	}
	function dbNumRows($result) {
		return pg_num_rows($result);
	}
	function dbFetchRow($result) {
		return pg_fetch_assoc($result);
	}
	function dbFree($result){
		pg_free_result($result);
	}
	function dbRestartQuery($result) {
		pg_result_seek($result,0);
	}
	function dbFetch($result) {
		return pg_fetch_all($result);
	}
?>
