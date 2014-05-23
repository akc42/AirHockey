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

function page_title() {
	echo "Air Hockey Rules";
}

function head_content() {
?>	<link rel="stylesheet" type="text/css" href="airh.css"/>
	<!--[if lt IE 7]>
		<link rel="stylesheet" type="text/css" href="airh-ie.css"/>
	<![endif]-->
<?php
}
function content_title() {
	echo 'Air Hockey Rules';
}
function menu_items() {
?><a href="index.php?ahv=<?php echo $_GET['ahv'];?>" alt="Exit to Clubroom"><img id="exittoforum" src="exit.gif" alt="Exit to Clubroom"/></a>
<?php
}

function main_content() {
?><div id="rules">
		<h1>The Rules of Online Air Hockey</h1>
		<h2>Introduction</h2>
			<p>Welcome to the Online AirHockey System.  This system provides a mechanism for playing, over the 
			internet, a	simulation of air hockey.  The basic rules of the game are taken from the <a href="www.airhockey.com">United
			States Air Hockey Association</a> and adapted slightly for the limitations of on-line play</p>
			<p>The system comes in two parts.  The initial page, the Club Room, where people can meet up, get a view of matches in progress and if
	they wish initiate a match, or go and play a single person practice game.  The second part is the game screen itself, consisting of a 
	hockey table, along with puck and mallets, and a scoreboard.</p>
		<h2>The Opening Screen</h2>
		<h3>Introduction</h3>
		<p> <img src="img/overview.jpg" alt="opening screen" align="right"/>When you first arrive at the airhockey page, either directly
			or via the forum, or as a result of completing practice or a match, you will see the screen shown on the right.. There
			are three main areas below the page heading, a list of matches, information about yourself and others online, and a ladder
			showing the ranking of all recent players.</p>
		<h3>The List of Matches</h3>
			<p>The list of matches shows the current progress of matches underway, together with the state of completed matches.
each match is shown its its own small area, with the names of the two players and their current score shown as a series of numbers
next to each name.  Initially, there is only one game with a 0-0 score, but as the match progresses each time a game reaches 7
points for one of the players, that game is over and a new game starts. Matches are the best of 7 games, so the first person to win
4 games wins the match.  You can tell whether a match is completed or not by whether there is a match duration shown or whether the
display gives the time that the match ended.</p>
			<p>Matches may be abandoned by one or other of the players (or because of a technical glitch) before the match is over.
 In this case the match will be should as completed before one or other of the players has won 4 games.  In this case the end time of
 the game will be displayed in a red colour as opposed to the normal black.  These "Abandoned" games will only
remain in the list for about 10 minutes before they are removed.
		<h3>Your own state and your relationship with other players who are online</h3>
			<div style="float:left;margin:10px"><img src="img/spectator.jpg" alt="spectator state" /><br/>
				<img src="img/aspectator.jpg" alt="as a spectator"/></div>
			<p>There are four lines in your area indicating which state you are currently in, and allowing you to change state.  A
				green tick indicates your current state.   When you first join this page you automatically start
				in spectator mode (as shown to the left). In this state, others will see you in their list of online players just
				below the top four lines,
				but without any special indication by your name (also shown to the left). You cannot be invited to play a match with
				someone else, you will just remain and watch the matches as they unfold.</p>
			<div style="clear:both"></div>
			<div style="float:left;margin:10px">
				<img src="img/practice.jpg" alt="wanting to practice"/><br/>
				<img src="img/anyone1.jpg" alt="play anyone state" /><br/>
				<img src="img/anyone.jpg" alt="as someone who will play anyone"/></div>
			<p>If you wish to practice, click on the line that says "practice", and after briefly showing your state as practice (see left)
				you will be taken to the main playing a match
				screen, described in the section below. You will be playing against a computer opponent, and unlike a proper match others will not
				be able to see the results of the match as you progress, and at the end the results will not affect your ladder score.  Other than
				that, the match is the same as any other (although the computer opponent has limited skill).</p> 
			<p>You could indicate you are willing to play anyone (see to the left,
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
				<img src="img/byinvite1.jpg" alt="will play by invite"/><br/>
				<img src="img/byinvite.jpg" alt="is willing to play by invite" /><br/>
				<img src="img/inviteto.jpg" alt="you have invited this player to a match" /><br/>
				<img src="img/invitefrom.jpg" alt="this player has invited you to a match"/></div>
			<p>The final possibility is for you to indicate that you wish to play by invite (your mode with the green tick is shown on the
				left, together with the picture below which shows another player who is also in this mode, indicated by an "I" on a green
				background).  In this mode, if you click on a player who is in invite mode also, you invite that player to join you in a match.
				This is indicated in your list by the "T" (representing "invite <strong>T</strong>o") on a purple background (see next
				picture down).  At the same time, that player knows that he has been invited by his list showing an "F" (representing "invite
				<strong>F</strong>rom") on an orange background against your name.</p>
			<p>If you click on a player who has already been invited by you, you will remove the invite, if you click on another player, you will move
				the invite over.  You cannot invite more than one player at a time.</p>
			<p>If you are the person invited you may, if you wish to start a match with that person, click on their name.  This will initiate a match
				with them and you will enter the play screens shown below.</p>
			<p>You may also click on the name of someone who is willing to play anyone.  Your invite will automatically be immediately accepted</p>
			<div style="clear:both"></div>			
		<h2>Playing a Match</h2>
			<h3>Basic Layout of Screen</h3>
			<p><img src="img/play.jpg" alt="Annotated View of Play Screen" align="right"/>The basic play screen is shown to the right.  It shows the key areas of this screen.</p>
			<p>The table itself is at the left of the screen.  This comprises a light blue table surface with a lime green surround.  The table edge
				is the boundary between these two areas.  At each end of the table is a red area which represents the goal.  Your goal (into which
				your opponent has to try and hit the puck) is on the left, your opponents goal (into which you are trying to hit the puck) is on
				the right. A center line is etched into the middle of the table to divide it into two.  As you will see below, the side of the
				table where the puck is, and where you hit it in relation to the center line can be quite crucial with respect to play.</p>
			<p>Above the table is the scoreboard. This is split into 4 regions.  The top region is information about play.  As marked
				(on the picture to the right) is an information message area, a countdown timer area, a small area which puts up a marker (see below) when
				you should server, or if there has been a foul, and finally a small notification if you, or your opponent, has won the "faceoff" (again
				see below).  The second region shows the two players in the match.  You are always the top listed player, your opponents
				is the one below. To the right of your names are the current scores for each game played (with the current game as the
				rightmost game shown), and at the bottom of this area is the current game duration.</p>
			<p>Normally (template dependent) above the main play area, there is a button which enables you to
				abandon this screen and return to the match summary screen that you started with at the beginnning.</a>
			<p>On the far right is an area reserved for technical diagnostics about the progress of the match.  Please copy and
				paste the content of this area in the event that the game does not proceed correctly into any fault report (ideally
				the contents of the diagnostic message area for both players should be provided). The screen is part of your overall site
				template.  Somewhere (normally at the bottom) will be copyright and version information for
				the Air Hockey game.  Please include the version information in any fauly report.</p>
			<h3>How to Play</h3>
			<h4>Introduction</h4>
			<p>As you start the game, the first thing that has to happen is the system has to synchronise you with your opponent.  As mentioned
			above, this may take up to 15 seconds.  During that time the text "Please Wait ..." will be displayed in the message area, and you will
			be unable to pick up your mallet. As soon as both sides are ready the system starts to count down the 5 seconds to the start of
			the match.  As soon as those 5 seconds start you will be able to pick up your mallet.</p>
			<h4>Picking up the Mallet</h4>
			<p>You mouse acts as your hands as far as the mallet goes.  Move the mouse over the top of the mallet 
			and it will then stick to the mouse as you move it about.  When you reach the edge of the table, the mallet will not move any further,
			although it will continue to track the mouse in the direction parallet to the edge until the mouse moves outside of the table surround
			(the green area) when the mallet will be dropped and will no longer track the mouse at all.  To pick up the mallet again you will have to 
			move the mouse over the top of the mallet again.</p>
			<p>When you have to serve, the mallet is also dropped.  You pick it up again after the serve in the same way (moving your mouse over the top
			of the mallet).</p>
			<h4>Playing the Puck</h4>
			<p><img src="img/puck.gif" alt="The Puck" align="left"/>The puck is shown on the picture to the left, and at the start of a
			match is automatically placed at the centre of the table.  <b><i>You may not play the puck until "Puck in Play" is shown in the Message
			Area.</i></b>.  Hitting before this time will be a Foul.</p>
			<p>As well as having to wait until the puck is in play to hit it, there are also some limitations on <i>where</i> you may hit
			the puck.  You may always hit the puck when it is on your side of the centre line, but you may also hit it in some limited
			circumstances when it is on the opponents side.  This is best described by saying when you may <b>not</b> play the puck.</p>
			<p><img src="img/wrongside1.jpg" align="right" alt="Puck and Mallet on other side" />Firstly, you may not hit the puck when
			both the puck and the opponents mallet is fully on their side of the table. The diagram on the right shows this position with
			the opponents mallet just on their side of the table, and with the puck also just over the line.  If you hit the puck in this
			position it will be a foul</p>
			<p><img src="img/wrongside.jpg" align="right" alt="Your Mallet almost on opponents side" />Secondly, you may not hit the puck when your
			mallet is completely over the centre line.  The diagram on the right shows your mallet being just in the position where it is
			illegal to hit the puck, and if you do it will be a foul.</p>
			<h4>Serving</h4>
			<p><img src="serve.gif" align="left" alt="Indicator that you should serve"/>When it is your turn to serve, the indicator shown on the left
			will be shown on the scoreboard.  You serve by clicking on the table surface, and this places the puck there.  You will be limited to
			placing the puck on your side of the table, so nothing happens if you click on the opponents side. You have 10 seconds to place the puck
			on the table when it is your turn to serve otherwise you will incur a foul.</p>
			
			<p>You are not allowed to hit the puck for two seconds after placing it on the table.  This is to give your opponent time to
			position himself.  Once the puck is in play, the normal rules about keeping keeping the puck on your side of the table apply.</p> 
			<h4>Time on your side</h4>
			<p>You are limited to 7 seconds for the puck being on your side of the table.  If you keep it on your side for longer than this time it
			is a foul.  This time starts as soon as the puck is in play after a serve, or when the centre of the puck crosses the centre line of the 
			table on to your side.  It ends as soon as the centre of the puck crosses the centre line.</p>
			<h4>Fouls</h4>
			<p><img src="img/foul.gif" align="left" alt="Indicator that you caused a foul"/>Fouls are incurred for various infringements in the game.
			As soon as a foul is declared the puck is out of play.  If you caused the foul, your opponent gets to
			serve, if he caused it you get to serve.  This is indicated in the message area of the scoreboard with the indicator shown to the left if
			the foul was your fault (you will get a serve indicator if it was your opponents foul).</p>
		<h2>Practicing</h2>
		<p>Practicing is just the same as playing a match except that the other side is the computer.  All the standard rules apply to both you and
		and the computer.</p> 
			
		<h2>The Ladder</h2>
			<h3>Background</h3>
			<p>The ladder mechanism for this Air Hockey game is based around
			<a href="http://math.bu.edu/people/mg/glicko/glicko.doc/glicko.html">The Glicko System</a>.  This aims to create a dynamic scoring system
			where plays of similar skill levels have a similar ranking on the ladder.  There are three key values that each play has which are recorded.
			The first we call "mu" and and is our estimation of the skill level of the player.  When a player first joins the ladder we don't know what
			value to give him, so we give him an average score of 1500.  The second value is called "sigma" and represents the standard deviation of mu.
			In otherwords, we try and figure out how accurate the score is and store that too.  When the player first joins we give him the maximum sigma
			we allow of 350.  As he plays more, we assume that the results of his matches with other players is increasing how accurate we know his
			score as so we reduce the value of sigma (although for various reasons we do not it drop below 30). However if there has been a long time
			since the last match we assume the certainty that we know his ability decreases, and so we increase sigma.<p>
			
			<p>When players play a match, we try and deduce a new value of mu and sigma for each player.  This is complex because the accuracy of the
			relative capabilities of the two players is variable, and we do not want to make a large variation to a players score that we already
			believe is accurate just because he wins or loses against a player whose score is not accurate, but for which the win or loss shows an
			inaccuracy.  Similarly playing a match against a player whose score is believed to be fairly accurate can be a good indication of your
			own score.</p>
			<p>We have to give a relative score to each player to rank them in the ladder.  We do this by giving the score of
			<pre>
			mu - 3 * sigma
			</pre>
			as the comparison.  The normal new members score of 450 is the result of this calculation when mu is 1500 and sigma is 350.</p>
			<h3>After a match completes</h3>
			When a match completes, the system automatically calculates a new value of mu and sigma for the two players involved.  Only the fact
			that they are a winner or a loser is taken into account, the relative score is not used.  In general, a winners mu is increased and
			the losers mu is decreased.  However the sigma of both parties should decrease.  This will result in a new set of relative scores for
			the ladder.  Players just finishing a match will see their new rankings, as they return to the main page, but there is no attempt to
			update the ladder for everyone else.  They will just see the new results the next time they view the page.<p>
			
	</div>
<?php
}

function foot_content () {
?>Air Hockey <span id="version"><?php include('./inc/version.inc');?></span> &copy; 2009-2011 Alan Chandler.  Licenced under the GPL<?php
}
require_once($_SERVER['DOCUMENT_ROOT'].'/inc/template.inc'); 
?>
