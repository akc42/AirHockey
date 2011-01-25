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
function head_content() {
?>	<title>Air Hockey Game</title>
	<meta http-equiv="Content-Type" content="application/xhtml+xml; charset=utf-8" />
	<meta name="description" content="Logout Page for Air Hockey - You are not allowed to enter Air Hockey if you are a guest of the forum.  This is the landing page if you try." />
	<meta name="keywords" content="Melinda's Backups Melinda Doolittle Air Hockey Community Forum" />
	<link rel="stylesheet" type="text/css" href="airh.css"/>
	<style type="text/css">
		#eoc{font-family:"Times New Roman", Times, Serif;font-size:18pt;text-align:center;padding:20px;}
		#eoc a {color:black;}
		#eoc a:hover {color:red;background-color:white;}
	</style>
<?php
}
function content_title() {
	echo 'Airhockey Guest Page';
}
function menu_items() {
}
function content() {
?>
	<h1>Air Hockey</h1>
	<p>Air Hockey is just one of the exiting facilities available to the members of our community.  To
		use it you have to be logged on to the forum, and at the moment you aren't.  If you are
		member please <a href="/forum/index.php?action=login">Login First</a>.  If not, <a href="/forum/index.php?action=register">please consider joining</a>.</p>

	<div id="eoc"><a href="/forum/index.php">Enter Our Community</a></div>
<?php
}

function foot_content() {
?><div id="copyright">Air Hockey <span id="version">php:<?php include('version.inc');?></span> &copy; 2009-2011 Alan Chandler.  Licenced under the GPL</div>
<?php
}
require_once($_SERVER['DOCUMENT_ROOT'].'/inc/template.inc'); 
?>
