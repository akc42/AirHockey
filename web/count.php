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
require_once('./inc/db.inc');
require('./inc/timeout.inc');
// Count players who are not in the OFFLINE state
$result=$db->query('SELECT count(*) as players FROM player WHERE state <> '.OFFLINE.' ;');
if ($count=$result->fetchColumn()) {
    echo $count;
} else {
    echo '0';
}
$result->closeCursor();
?>
