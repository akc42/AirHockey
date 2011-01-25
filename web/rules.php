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
?>	<title>Melinda's Backups Air Hockey Ladder Rules</title>
	<link rel="stylesheet" type="text/css" href="airh.css"/>
	<!--[if lt IE 7]>
		<link rel="stylesheet" type="text/css" href="airh-ie.css"/>
	<![endif]-->
<?php
}

function content_title() {
	echo 'Air Hockey Rules';
}

function menu_items() {
?>	<a href="index.php"><img id="exittoforum" src="exit.gif" alt="exit to matches summary page"/></a>
<?php
}

function content() {
?><div id="rules">
		<h1>The Rules of Online Air Hockey</h1>
		<h2>Introduction</h2>
			<p>Welcome to the Melinda's Backups Online AirHockey System.  This system provides a mechanism for playing, over the 
			internet, a	simulation of air hockey.  The basic rules of the game are taken from the <a href="www.airhockey.com">United
			States Air Hockey Association</a> and adapted slightly for the limitations of on-line play</p>
			<p>The system comes in two parts.  The initial page where people can meet up, get a view of matches in progress and if
	they wish initiate a match, or go and play a single person practice game</p>
		<h2>The Opening Screen</h2>
		<h3>Introduction</h3>
		<p> <img src="overview.jpg" alt="opening screen" align="right"/>When you first arrive at the airhockey page, either directly
			or via the forum, or as a result of completing practice or a match, you will see the screen show in the right.. There
			are three main areas below the page heading, a list of matches, information about yourself and others online, and a ladder
			showing the ranking of all players from the forum.</p>
		<h3>The List of Matches</h3>
			<p>The list of matches shows the current progress of matches underway, together with the state of completed matches.
each match is shown its its own small area, with the names of the two players and their current score shown as a series of numbers
next to each name.  Initially, there is only one game with a 0-0 score, but as the match progresses each time a game reaches 7
points for one of the players, that game is over and a new game starts. Matches are the best of 7 games, so the first person to win
4 games wins the match.  You can tell whether a match is completed or not by whether there is a match duration shown or whether the
display gives the time that the match ended.</p>
			<p>Matches may be abandoned by one or other of the players (or because of a technical glitch) before the match is over.
 In this case the match will be should as completed before one or other of the players has won 4 games.  These "Abandoned" games will only
remain in the list for about 10 minutes before they are removed.
		<h3>Your own state and your relationship with other players who are online</h3>
			<div style="float:left;margin:10px"><img src="spectator.jpg" alt="spectator state" /><br/>
				<img src="aspectator.jpg" alt="as a spectator"/></div>
			<p>There are four lines in your area indicating which state you are currently in, and allowing you to change state.  A
				green tick indicates your current state.   When you first join this page you automatically start
				in spectator mode (as shown to the left). In this state, others will see you in their list of online players just
				below the top four lines,
				but without any special indication by your name (also shown to the left). You cannot be invited to play a match with
				someone else, you will just remain and watch the matches as they unfold.</p>
			<div style="clear:both"></div>
			<div style="float:left;margin:10px">
				<img src="practice.jpg" alt="wanting to practice"/><br/>
				<img src="anyone1.jpg" alt="play anyone state" /><br/>
				<img src="anyone.jpg" alt="as someone who will play anyone"/></div>
			<p>If you wish to practice, click on the line that says "practice", and after briefly showing you state as practice (see left)
				you will be taken to the main playing a match
				screen, described in the section below. You could indicate you are willing to play anyone (see to the left,
				both the indication to you that you have selected to play anyone by showing the green tick, but also how others in
				the online list that are willing to play with anyone are shown with a green backed "A" by their name).</p>
			<p>	If you say you are willing to play anyone, and there is another player online who has also said they are willing to play anyone,
				the system matches the two of you up and starts a match for you.  You then enter the match screen.  The other player will find
				out that he has had a match scheduled with you within about 15 seconds and will join you in the match in about that time.  Be patient
				whilst the two of you synchronise.  Occassionally your opponent may change his mind about being willing to play anyone and
				might have switched himself to another mode (like spectator for instance).  In that case you are left waiting for him to join you
				and he never arrives.  You will be informed the match has been abandoned within about 30 seconds.</p>
			<div style="clear:both"></div>
			<div style="float:left;margin:10px">
				<img src="byinvite1.jpg" alt="will play by invite"/><br/>
				<img src="byinvite.jpg" alt="is willing to play by invite" /><br/>
				<img src="inviteto.jpg" alt="you have invited this player to a match" /><br/>
				<img src="invitefrom.jpg" alt="this player has invited you to a match"/></div>
			<p>The final possibility is for you to indicate that you wish to play by invite (your mode with the green tick is shown on the
				left, together with the picture below which shows another player who is also in this mode, indicated by an "I" on a green
				background).  In this mode, if you click on a player who is in invite mode also, you invite that player to join you in a match.
				This is indicated in your list by the "T" on a purple background (see next picture down).  At the same time, that player
				know that he has been invited by his list showing an "F" on an orange background against your name.</p>
			<p>If you click on a player who has already been invited by you, you will remove the invite, if you click on another player, you will move
				the invite over.  You cannot invite more than one player at a time.</p>
			<p>If you are the person invited you may, if you wish to start a match with that person, click on their name.  This will initiate a match
				with them and you will enter the play screens shown below.</p>
			<p>You may also click on the name of someone who is willing to play anyone.  You invite will automatically be immediately accepted</p>
			<div style="clear:both"></div>			
		<h2>Playing a Match</h2>
			<h3>Basic Layout of Screen</h3>
			<p><img src="play.jpg" alt="Annotated View of Play Screen" align="right"/>The basic play screen is shown to the right without the
				puck in play.  It shows the key areas of this screen.</p>
			<p>The table itself is at the left of the screen.  This comprises a light blue table surface with a lime green surround.  The table edge
				is the boundary between these two areas.  At each end of the table is a red area which represents the goal.  Your goal (into which
				your opponent has to try and hit the puck) is at the bottom, your opponents goal (into which you are trying to hit the puck) is at the top.
				[Note: On the practice screen the opponents goal are not included - practice is for learning how to hit the puck and
				how to defend your own goal].
				A center line is etched into the middle of the table to divide it into two.  As you will see below, the end of the table where the puck is,
				and where you hit it in relation to the center line can be quite crucial with respect to play.</p>
			<p>To the right of the table is the scoreboard. This is split into 4 regions.  The top region is information about play.  As marked
				(on the picture to the right) is an information message area, a countdown timer area, a small area which puts up a marker (see below) when
				you should server, or if there has been a foul, and finally a small notification if you, or your opponent, has won the "faceoff" (again
				see below).  The second region shows the two players to the match.  You are always the top listed player, your opponents
				is the one below. To the right of your names are the current scores for each game played (with the current game as the
				rightmost game shown), and at the bottom of this area is the current game duration.</p>
			<p>Below the match scores, is an area reserved for technical diagnostics about the progress of the match.  Please copy and
				paste the content of this area in the event that the game does not proceed correctly into any fault report (ideally
				the contents of the diagnostic message area for both players should be provided).  Finally there is a button which enables you to
				abandon this screen and return to the match summary screen that you started with at the beginnning.</p>
			<p>Finally to the far right of the screen is the copyright and version information.  Please provide the version
				information in any fault report.</p>
			<h3>How to Play</h3>
			<h4>Introduction</h4>
			<p>As you start the game, the first thing that has to happen is the system has to synchronise you with your opponent.  As mentioned
			above, this may take up to 15 seconds.  During that time the text "Please Wait ..." will be displayed in the message area, and you will
			be unable to pick up your mallet. As soon as both sides are ready the system starts to count down the 5 seconds to the start of
			the match.  As soon as those 5 seconds start you will be able to pick up your mallet.</p>
			<h4>Picking up the Mallet</h4>
			<p>You mouse acts as your hands as far as the mallet goes.  Move the mouse over the top of the mallet when you are
			allowed to pick up the mallet
			and it will then stick to the mouse as you move it about.  When you reach the edge of the table, the mallet will not move any further,
			although the mouse will continue to move.  As soon as the mouse cross over the end of the mallet you will drop the mallet and come
			around and pick it up again</p>
			<p>You will also have to pick up the mallet after a foul or a goal (regarless of which side caused the foul or scored the goal). But
			you will have to wait until either you have served (see below) or you opponent has served.  Before that time it will not be
			possible to hold on to the mallet.
			<h4>Playing the Puck</h4>
			<p><img src="puck.gif" alt="The Puck" align="left"/>The puck is shown on the picture to the left, and at the start of a
			match is automatically placed at the centre of the table.  <b><i>You may not play the puck until "Puck in Play" is shown in the Message
			Area.</i></b>.  Hitting before this point will be a Foul.</p>
			<p>As well as having to wait until the puck is in play to hit it, there are also some limitations on <i>where</i> you may hit
			the puck.  You may always hit the puck when it is on your side of the centre line, but you may also hit it in some limited
			circumstances when it is on the opponents side.  This is best described by saying when you may <b>not</b> play the puck.</p>
			<p><img src="wrongside1.jpg" align="right" alt="Puck and Mallet on other side" />Firstly, you may not hit the puck when
			both the puck and the opponents mallet is fully on their side of the table. The diagram on the right shows this position with
			the opponents mallet just on their side of the table, and with the puck also just over the line.  If you hit the puck in this
			position it will be a foul</p>
			<p><img src="wrongside.jpg" align="right" alt="Your Mallet almost on opponents side" />Secondly, you may not hit the puck when your
			mallet is completely over the centre line.  The diagram on the right shows your mallet being just in the position where it is
			illegal to hit the puck, and if you do it will be a foul.</p>
					 
			<h3>Fouls</h3>
		<h2>The Ladder</h2>
			<h3>Background</h3>
			<a href="http://math.bu.edu/people/mg/glicko/glicko.doc/glicko.html">The Glick System</a>
	</div>
<?php
}

function foot_content () {
?>	<div id="copyright">Air Hockey <span id="version">php:<?php include('./version.inc');?></span> &copy; 2009-2011 Alan Chandler.  Licenced under the GPL</div>
<?php
}
require_once($_SERVER['DOCUMENT_ROOT'].'/inc/template.inc'); 
?>
