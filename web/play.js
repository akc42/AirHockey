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
var Play = new Class({
	initialize: function(mid,startTime,me,oid,master,timers,els,positions) {
		var play = function(sound) {
			if(soundReady) soundManager.play(sound);
		};
if(master) {
	els.message.appendText('MASTER:');
} else {
	els.message.appendText('SLAVE:');
}
		this.links = {
			table:null,
			match:null,
			opponent:null,
   			scoreboard:new Scoreboard(mid,startTime,me,master,els,play),
	  		play:play
		};
		this.links.match = new Match(this.links,timers);
		this.links.table = new Table(this.links,timers,els,positions);

		//this needs to be last, as it starts everything off - the rest has to be set up before it
		this.links.opponent = new Opponent(this.links,me,oid,master,timers,els,positions);

		var pollReq = new Request({url:'poll.php',link:'chain'})
		var poller = function() {
			pollReq.post(me);
		}
		var pollerID = poller.periodical(timers.poll);
		var that = this;
		els.abandon.addEvent('click', function(e) {
			e.stop();
			that.links.match.end(); //abandons match if not already ended
			window.clearInterval(pollerID); //stop poller
			window.location.assign('index.php');
		});
	},
	end: function() {
		this.links.match.end();  //kills it if necessary
	}
});


