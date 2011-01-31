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

/* 
	Although this is practice, what I am actually doing is looking like an opponent.  
	I will just simulate the other end with its own copy of a table (although it will
	have no visual elements) and a match
*/

var Opponent = new Class({
//'my' in this class refers to the opponent, which I am simulating
	initialize: function(links,me,oid,master,timers,els,positions) {
		var that = this;
		/*	This structure is the equivalent of the 'links' structure in the main game, but is the 
			simulations version with all the coordinates reversed */
		this.computer = {			
			table:null,
			match:null,
			opponent:{
			// We are recreating an opponent interface for the externally called functions, but processing backwards
				hit: function (mallet,puck,time) {
					if (that.inSync) that.links.table.update(true,{x:mallet.x,y:2400-mallet.y},{x:puck.x,y:2400-puck.y,dx:puck.dx,dy:-puck.dy},time);						
				},
				end: function() {
					that.inSync = false;
				},
				faceoff: function () {
					if(that.inSync) {
						that.links.match.faceoff();
						that.computer.match.faceoffConfirmed();
					}					
				},
				goal: function () {
					if(that.inSync) {
						that.links.match.goal();
						that.computer.match.goalConfirmed();
					}
				},
				foul: function(msg) {
					if(that.inSync) {
						that.links.match.foul();
						that.computer.match.foulConfirmed(msg);
					}
				},
				serve: function(p) {
					if(that.inSync) {
						that.links.match.serve({x:p.x,y:2400-p.y});
						that.computer.match.serveConfirmed();
					}
				},
				getModel: function() {			//special for dummy scoreboard
					return that.model;
				},
				clearServeMode: function() {
					that.inServeMode = false;
				},
				setServeMode: function() {
					that.inServeMode = true;
				}
			},
   			scoreboard:null,
	  		play:function (sound) {}
		};
		this.computer.scoreboard = new DummyScoreboard(this.computer);
		this.computer.match = new Match(this.computer,timers);
		// swap mallets, and adjust their positions in respect of the model coordinate system
		var myMallet = {};
		myMallet.x = positions.opmallet.x;
		myMallet.y = 2400 - positions.opmallet.y;
		var opMallet = {};
		opMallet.x = positions.mymallet.x;
		opMallet.y = 2400 - positions.mymallet.y;
		this.computer.table = new Table(this.computer,timers,{},{mymallet:myMallet,opmallet:opMallet});

		this.links = links;
		this.timers = timers;
		this.els = els;
		this.master = master;
		this.inSync = false;
		this.timeout = timers.timeout;
		this.inServeMode = false;
		this.startDelay = positions.practice.delay;
		this.model = {
			state:0,	 // 0 = awaiting instruction, 1 = moving to circle, 2 = circling, 3 moving towards hit
			centre:positions.practice.c,  //center of the circle that mallet will move in
			r:positions.practice.r,   // radius of circle that mallet will move in
			d:positions.practice.d,  //distance to move in a tick
			serve:positions.practice.s,		//server data
			ran:positions.practice.ran		//Max random about serve position to actually serve
		};
		// this function models the mouse movement - and therefore the mallet movement of opponent.
		function Mouse() {
			var d,m,n,x,y,c;
			var mx = this.computer.table.myMallet.x;
			var my = this.computer.table.myMallet.y;
			x = mx - this.model.centre.x;
			y = my - this.model.centre.y;
			switch (this.model.state) {
			case 1:
				// Moving towards the circles edge calculate how far away it is
				d = this.model.r -Math.sqrt((x)*(x) + (y)*(y));
				if (Math.abs(d) > 2) {
					//not there, so have to move closer
					if (d > 0) {
						if ( d > this.model.d) d = this.model.d;
					} else {
						if ( -d > this.model.d) d = -this.model.d;		
					}
					if (x > 0) {
						m = mx + (d/Math.sqrt(1 + ((y*y)/(x*x))));
					} else {
						m = mx - (d/Math.sqrt(1 + ((y*y)/(x*x))));
					}
					if (y > 0) {
						n = my + (d/Math.sqrt(1 + ((x*x)/(y*y))));
					} else {
						n = my - (d/Math.sqrt(1 + ((x*x)/(y*y))));
					}
					break;
				}
				this.model.state = 2; //fall into circling state below
			case 2:
				//circling
				d = this.model.d*this.model.d; //calculate d2
				c = (x*x*d*d) - ((x*x)+(y*y))*((d*d)-(4*y*y*d));
				if(c < 0) {
					c = 0;
				}
				m = (Math.sqrt(c) - (x*d))/(2*((x*x)+(y*y)));
				n = Math.sqrt(d - (m*m));
				if (y < 0 ) m = -m;
				if (x > 0 ) n = -n;
				m = mx + m;
				n = my + n;
				this.model.state = 1;	//forces us to ensure we don't drift too far away from a circle
				break;  
			case 3:
				//headed towards puck
				x = this.computer.table.puck.x - mx;
				y = this.computer.table.puck.y - my + 67;  //aim behind puck at a half hit - puck = 41, mallet 53, use 41 + 26(half 53)
				if(isNaN(x) || isNaN(y)) {
					this.model.state = 1;
				} else {
					d = 2*this.model.d/Math.sqrt(x*x + y*y);
					m = x * d;			//can go as far as allowed in that direction - deltas are same ratio in x and y
					n = y * d;
					//avoid going off the table	or off to the other side		
					m=Math.max(53,Math.min(m+mx,1067));
					n=Math.max(1253,Math.min(n+my,2347));
				}
				break;
			default:
				m = mx;  //not going anywhere
				n = my;
			}
			this.computer.table.myMallet.mp.x = m;  //tell my table
			this.computer.table.myMallet.mp.y = n;
			if(this.computer.table.myMallet.held) this.links.table.update(true,{x:m,y:2400-n},null,null); //tell other table only if I have held
			
		}
		function StartMouse () {
			this.mouseId = Mouse.periodical(positions.practice.tick,this);
			this.model.state = 1;
			this.computer.table.myMallet.held = true; //say I am holding the mallet
		}
		var startMatch = function () {
			that.inSync = true;
			that.links.match.start.delay(800,that.links.match);	//we want to start the match from 1 second from when the server told us.
			that.computer.match.start.delay(800,that.computer.match); // start our own simulation too
			StartMouse.delay(800+that.startDelay,that);	//and out control of our mallet
			that.poller=that.poll.periodical(timers.mallet,that);  //start sending my stuff on a regular basis
		};
		startMatch.delay(2000); //say opponent is there is 5 secs

	},
	hit: function(mallet,puck,time) {
		if(this.inSync) this.computer.table.update(true,{x:mallet.x,y:2400-mallet.y},{x:puck.x,y:2400-puck.y,dx:puck.dx,dy:-puck.dy},time);	
	},
	end: function() {
		this.inSync = false;
		this.poller = $clear(this.poller);
		this.computer.table.halt();
		this.computer.table.stop();
		this.mouseId = $clear(this.malletId);
	},
	faceoff: function() {
		if(this.inSync) {
			this.computer.match.faceoff();
			this.links.match.faceoffConfirmed();
		}	
	},
	goal: function () {
		if(this.inSync) {
			this.computer.match.goal();
			this.links.match.goalConfirmed();
		}
	},
	foul: function (msg) {
		if(this.inSync) {
			this.computer.match.foul();
			this.links.match.foulConfirmed(msg);
		}
	},
	serve: function (p) {
		if(this.inSync) {
			this.computer.match.serve({x:p.x,y:2400-p.y});
			this.computer.table.myMallet.held = true;  //He has servered, I can pick up my puck
			this.links.match.serveConfirmed();
		}
	},
	poll : function() {
		var reply = this.links.table.getUpdate();
		if(reply.puck) {
			//puck is on table
			this.computer.table.update(false,{x:reply.mallet.x,y:2400-reply.mallet.y},{x:reply.puck.x,y:2400-reply.puck.y,dx:reply.puck.dx,dy:-reply.puck.dy},reply.time);
	
		} else {
			this.computer.table.update(false,{x:reply.mallet.x,y:2400-reply.mallet.y},null,null);
		}
		reply = this.computer.table.getUpdate();		
		if(reply.puck) {
			//puck is on table
			if(reply.puck.y > 1159 && Math.abs(reply.puck.dy) < 0.2 && !this.inServeMode) {
				//puck is my side and going slowly I need to try and hit it, on its back side
				this.model.state = 3;  		//tell model to move towards puck
			} else {
				if (this.model.state == 3) this.model.state = 1;  //if we were moving towards puck and it is now speeded up, we can go back to circling
			}
			this.links.table.update(false,{x:reply.mallet.x,y:2400-reply.mallet.y},{x:reply.puck.x,y:2400-reply.puck.y,dx:reply.puck.dx,dy:-reply.puck.dy},reply.time);
	
		} else {
			if (this.model.state == 3) this.model.state = 1;  //if we were moving towards puck and it is now not on the table we go back to circling
			this.links.table.update(false,{x:reply.mallet.x,y:2400-reply.mallet.y},null,null);
		}
	}
});
	
var DummyScoreboard = new Class({
	initialize: function(links) {
		this.links = links
		this.countdown = null;
		this.n = -1;
	},
	endMatch: function() {
	},
	abandonMatch: function () {
	},
	score: function (me) {
	},
	newGame: function() {
	},
	serve: function(s) {
		function placePuck() {
			var serveposition = {};
			serveposition.x = this.links.opponent.getModel().serve.x+$random(-this.links.opponent.getModel().ran,this.links.opponent.getModel().ran);
			serveposition.y = this.links.opponent.getModel().serve.y+$random(-this.links.opponent.getModel().ran,this.links.opponent.getModel().ran);
			this.links.table.place(serveposition);  //Tell table is on it
			this.links.match.served(serveposition); //And signal everyone else
			moveToHit.delay(2500,this);			//And after at least the delay for in play - start moving to hit it
			this.links.table.myMallet.held = true;   //say I am holding the mallet
			this.links.opponent.getModel().state = 1;  //Move to go back to the circle
		}
		function moveToHit () {
			this.links.opponent.getModel().state = 3;  //Now go to hit the puck
			this.links.opponent.clearServeMode();
		}
		if(s) {
			//Scoreboard has told me to serve, so now I need to
			placePuck.delay(1000,this);
			this.links.opponent.setServeMode();
		}
	},
	foul: function(s) {
	},
	status: function(msg) {
	},
	faceoff: function(s) {
	},
	set: function(n,callback) {
		var counter = function() {
			this.n--;
			if (this.n < 0) {
				this.countdown = $clear(this.countdown);
			} else {
				if (this.n == 0) {
					callback();
				}
			}
		};
		this.countdown = $clear(this.countdown);
		this.n = n;
		this.countdown = counter.periodical(1000,this);
	},
	cancel: function() {
		this.countdown = $clear(this.countdown);
		this.n = -1;
	}
});





