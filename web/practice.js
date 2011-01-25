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
var Practice = new Class({
//'my' in this class refers to the opponent, which I am simulating
	initialize: function(links,timers) {
		var that = this;
		this.timers = timers;
		this.links = links;
		this.scorer = new Scorer({
			faceoff:function(b) {
				if(b) that.links.match.faceoff();
			},
			score:function(b){},
  			game:function(b){},
			match:function(b){}
		});
		this.links.match.start.delay(1000,this.links.match);  //start in one second
		this.ontable=this.myside.periodical(5000,this);
	},
 	hit: function(mallet,puck) {
		return; //practice, do nothing
	},
	goal: function() {
		$clear(this.ontable);
		if(this.scorer.goalFor()) {
			$clear(this.ontable);
			//simulate me serving and then hitting puck
			this.d1=this.myserve.delay(3000,this);
		}
		this.links.match.goalConfirmed();
		
	},
	foul: function (msg) {
		$clear(this.ontable);
		//simulate me serving and then hitting puck
		this.d1=this.myserve.delay(3000,this);
		this.links.match.foulConfirmed(msg);
	},
	serve: function (puck) {
		this.ontable=this.myside.periodical(5000,this);
		this.links.match.serveConfirmed();
	},
	faceoff: function () {
		this.scorer.faceoffOp();
		this.links.match.faceoffConfirmed();
	},
	end: function () {
		$clear(this.d1);
		$clear(this.ontable);
	},
	myside: function() {
		var reply = this.links.table.getUpdate();
		if(reply.puck && reply.puck.y < 1159) {
			//puck is my side and out of reach players mallet
			if (Math.abs(reply.puck.dy) < 0.2) {
				//going slowly
				this.scorer.faceoffMe(); //claim it
				reply.puck.dx = $random(-2,2);
				reply.puck.dy = $random(2,4);
				this.links.table.update(true,{x:560,y:148},reply.puck,0);
			}
		}
	},
 	myserve: function() {
		this.links.match.serve({x:560,y:250});
		this.ontable=this.myside.periodical(5000,this);
	}		
});

