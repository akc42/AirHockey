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
var PM3 = PR+MR/2;	//Convenient constant used in model
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
					//NOTE: not copying whole objects here because the update routine will alter them
					if (that.inSync) that.links.table.update(true,{x:mallet.x,y:mallet.y},{x:puck.x,y:puck.y,dx:puck.dx,dy:puck.dy},time);						
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
						that.links.match.serve({x:p.x,y:TY-p.y});
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
		myMallet.y = TY - positions.opmallet.y;
		var opMallet = {};
		opMallet.x = positions.mymallet.x;
		opMallet.y = TY - positions.mymallet.y;
		this.computer.table = new Table(this.computer,timers,{},{mymallet:myMallet,opmallet:opMallet});

		this.links = links;
		this.timers = timers;
		this.els = els;
		this.master = master;
		this.inSync = false;
		this.timeout = timers.timeout;
		this.inServeMode = false;
		this.startup = timers.startup;
		this.startDelay = positions.practice.delay;
		this.model = {
			state:0,	 // 0 = awaiting instruction, 1 = moving to circle, 2 = circling, 3 moving towards hit
			centre:positions.practice.c,  //center of the circle that mallet will move in
			r:positions.practice.r,   // radius of circle that mallet will move in
			d:positions.practice.d,  //distance to move in a tick
			serve:positions.practice.s,		//server data
			ran:positions.practice.ran,		//Max random about serve position to actually serve
			servedelay:positions.practice.servedelay, //Delay after goal before serving
			hitdelay:positions.practice.hitdelay
		};
		// this function models the mouse movement - and therefore the mallet movement of opponent.
		function Mouse() {
			var d,m,n,x,y,c;
			var mx = this.computer.table.myMallet.x;
			var my = this.computer.table.myMallet.y;
			x = mx - this.model.centre.x;
			y = my - this.model.centre.y;
			var now = new Date().getTime();
			var timeSince = now - this.time;
			this.time = now;
			var dd = this.model.d * timeSince;
			switch (this.model.state) {
			case 1:
				// Moving towards the circles edge calculate how far away it is
				d = this.model.r -Math.sqrt((x)*(x) + (y)*(y));
				if (Math.abs(d) > 2) {
					//not there, so have to move closer
					if (d > 0) {
						if ( d > dd) d = dd;
					} else {
						if ( -d > dd) d = -dd;		
					}
					if (x > 0) {
						m = (d/Math.sqrt(1 + ((y*y)/(x*x))));
					} else {
						m = - (d/Math.sqrt(1 + ((y*y)/(x*x))));
					}
					if (y > 0) {
						n = (d/Math.sqrt(1 + ((x*x)/(y*y))));
					} else {
						n = - (d/Math.sqrt(1 + ((x*x)/(y*y))));
					}
					break;
				}
				this.model.state = 2; //fall into circling state below
			case 2:
				//circling
				d = dd*dd; //calculate d2
				c = (x*x*d*d) - ((x*x)+(y*y))*((d*d)-(4*y*y*d));
				if(c < 0) {
					c = 0;
				}
				m = (Math.sqrt(c) - (x*d))/(2*((x*x)+(y*y)));
				n = Math.sqrt(d - (m*m));
				if (y < 0 ) m = -m;
				if (x > 0 ) n = -n;
				this.model.state = 1;	//forces us to ensure we don't drift too far away from a circle
				break;  
			case 3:
				//headed towards puck
				x = this.computer.table.puck.x - mx;
				y = this.computer.table.puck.y - my + PM3;  //aim behind puck at a half hit - puck = 41, mallet 53, use 41 + 26(half 53)
				if(isNaN(x) || isNaN(y)) {
					m=0;
					n=0;
					this.model.state = 1;
				} else {
					d = 1.5*dd/Math.sqrt(x*x + y*y);
					if(this.computer.table.puck.dy > this.model.d) {	
						//pack is already faster than us
						d *= 1+ 0.5*this.computer.table.puck.dy/this.model.d;
						if(this.computer.table.puck.y >my) { //aim off to the side puck is past us
							// try and avoid hitting puck into goal
							if ( x < 0) {
								x += MR+PR; //aim low side to push towards the edge 
							} else {
								x -= MR+PR;
							}
							y += PM3;  //Also aim further back
						
						} 
						
					} 
					m = x*d;			//can go as far as allowed in that direction - deltas are same ratio in x and y
					n = y*d;
				}
				break;
			case 4:
				// Headed back for the goal line as it is a better angle to attack the puck
				x = TX2 -mx;
				y = TY-MR-my;
				if(isNaN(x) || isNaN(y)) {
					m = 0;
					n = 0;
					mx = TX2;
					my = TY-MR;
					this.model.state = 1;
				} else {
					dd = 2*dd; //allow a speed up
					d = Math.sqrt(x*x + y*y);
					if(Math.abs(d) < 4) {
						m = 0;
						n = 0;
						this.model.state = 1;	// almost there so stop trying to go there
					} else {
						if(d > dd) { //to far in one go, so go a percentage
							m = x*dd/d;
							n = y*dd/d;
						} else {
							m = y;
							n = x;
						}
					}
				}					
				break;
			default:
				m = 0;  //not going anywhere
				n = 0;
			}
			//avoid going of the table
			m=Math.max(MR,Math.min(m+mx,TX-MR));
			n=Math.max(TY2+MR,Math.min(n+my,TY-MR));
			this.computer.table.myMallet.mp.x = m;  //tell my table
			this.computer.table.myMallet.mp.y = n;
			if(this.computer.table.myMallet.held) this.links.table.update(true,{x:m,y:n},null,null); //tell other table only if I have held
			
		}
		function StartMouse () {
			this.time = new Date().getTime();
			this.mouseId = Mouse.periodical(positions.practice.tick,this);
			this.model.state = 1;
			this.computer.table.myMallet.held = true; //say I am holding the mallet
		}
		var startMatch = function () {
			that.inSync = true;
			that.links.match.start.delay(that.startup,that.links.match);	//we want to start the match from 1 second from when the server told us.
			that.computer.match.start.delay(that.startup,that.computer.match); // start our own simulation too
			StartMouse.delay(that.startup+that.startDelay,that);	//and out control of our mallet
			that.poller=that.poll.periodical(timers.mallet,that);  //start sending my stuff on a regular basis
		};
		startMatch.delay(positions.practice.startup); //say opponent is there in 2 secs
		

	},
	hit: function(mallet,puck,time) {
		//NOTE We are not copying objects because update modifies them.  So copy each individual element		
		if(this.inSync) this.computer.table.update(true,{x:mallet.x,y:mallet.y},{x:puck.x,y:puck.y,dx:puck.dx,dy:puck.dy},time);	
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
			this.computer.match.serve({x:p.x,y:TY-p.y});
			this.computer.table.myMallet.held = true;  //He has servered, I can pick up my puck
			this.links.match.serveConfirmed();
		}
	},
	poll : function() {
		var reply = this.links.table.getUpdate();
		if(reply.puck) {
			//puck is on table - NOTE: Don't copy objects because update modifies them
			this.computer.table.update(false,{x:reply.mallet.x,y:reply.mallet.y},{x:reply.puck.x,y:reply.puck.y,dx:reply.puck.dx,dy:reply.puck.dy},reply.time);
	
		} else {
			this.computer.table.update(false,{x:reply.mallet.x,y:reply.mallet.y},null,null);
		}
		reply = this.computer.table.getUpdate();		
		if(reply.puck) {
			//puck is on table
			if(!this.inServeMode && ((reply.puck.y > TY2-PR && Math.abs(reply.puck.dy) < 0.2) || reply.puck.y > TY2  )) {
				//puck is my side and going slowly I need to try and hit it, on its back side
				this.model.state = 3;  		//tell model to move towards puck
			} else {
				if (reply.puck.dy > Math.abs(reply.puck.dx)) this.model.state = 4; //if better than 45 degrees towards us head back to goal line
				if (this.model.state == 3) this.model.state = 1;  //if we were moving towards puck and it is now speeded up, we can go back to circling
			}
			this.links.table.update(false,{x:reply.mallet.x,y:reply.mallet.y},{x:reply.puck.x,y:reply.puck.y,dx:reply.puck.dx,dy:reply.puck.dy},reply.time);
	
		} else {
			if (this.model.state == 3) this.model.state = 1;  //if we were moving towards puck and it is now not on the table we go back to circling
			this.links.table.update(false,{x:reply.mallet.x,y:reply.mallet.y},null,null);
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
			moveToHit.delay(this.links.opponent.getModel().hitdelay,this);			//And after at least the delay for in play - start moving to hit it
			this.links.table.myMallet.held = true;   //say I am holding the mallet
			this.links.opponent.getModel().state = 1;  //Move to go back to the circle
		}
		function moveToHit () {
			this.links.opponent.getModel().state = 3;  //Now go to hit the puck
			this.links.opponent.clearServeMode();
		}
		if(s) {
			//Scoreboard has told me to serve, so now I need to
			placePuck.delay(this.links.opponent.getModel().servedelay,this);
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





