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
var Opponent = new Class({
	initialize: function(links,me,oid,master,timers,els,positions) {
		var that = this;
		this.links = links;
		this.me = me;
		this.oid = oid;
		this.timers = timers;
		this.els = els;
		this.master = master;
		this.inSync = false;
		this.timeout = timers.timeout;
		this.timeOffset = 0;
		this.awaitingConfirmation = 0; //0 = not waiting, 1 awaiting serve, 2 awaiting hit, 3 awaiting foul, 4 awaiting goal
		this.aCtimeoutID;
		this.echoTime = function() {
			var t = ((new Date().getTime() + this.timeOffset)/100).toInt();
			return t%10000;
		};
		function myFail () {
			that.fail();
		};
		function er(t,m) {
			that.messageReceived.delay(1,that,m);
		};
		var awaitOpponent = function() {
			if (master) {
				Comms.set(startMatchM,timers.opponent);
				that.write('Start');
			} else {
				Comms.set(startMatchS,timers.opponent);
			}
		};
		var startMatchM = function(time,msg) {
			var now = new Date().getTime() + that.timeOffset;
			if(msg == 'Going') {
				Comms.set(er,timers.timeout);
				that.links.match.start.delay(Math.max(1,time+timers.startup - now),that.links.match);	//we want to start same delay from when the server told us it would.
			} else {
				that.els.em.appendText('"Going" not received got '.msg);
				that.write('A');  //tell other end to abandon
			}
		};
		var startMatchS = function(time,msg) {
			var now = new Date().getTime() + that.timeOffset;
			if(msg == 'Start') {
				that.write('Going'); // Send something back to tell the other end to start
				Comms.set(er,timers.timeout);				
				that.links.match.start.delay(Math.max(1,time+timers.startup - now),that.links.match);	//we want to start same delay from when the server told us it would.
			} else {
				that.els.em.appendText('"Start" not received got '.msg);
				that.links.match.end();
			}
		};	

		var startTime;
		that.timeOffset = 0;
		var achievedCloseOffset = false;
		
		var i = timers.count;
		var timeReq = function() {
			startTime = new Date().getTime();
			req.post(Object.merge({t:startTime+that.timeOffset},me));
		};
		var req = new Request.JSON({url:'time.php',onComplete: function(response,errorstr) {
			if (response ) {
				if (Math.abs(response.error) < timers.tick/3) achievedCloseOffset = true;
				if(achievedCloseOffset) {
					that.timeOffset += response.error/2;
				} else {
					that.timeOffset += response.error;
				}
				if (--i > 0 ) {
					timeReq.delay(50);  //delay, otherwise if fast link it doesn't have time to exit this routing before re entering
				} else {
					that.timeOffset = that.timeOffset.toInt();
					Comms.initialize(me,oid,els.em,myFail);
					that.comms = new Comms.Stream('send.php');
					awaitOpponent();
				}
			}
		}});
		timeReq();
	},
	start: function () {
		function pollStart() {
			this.poller=this.poll.periodical(this.timers.mallet,this);  //start sending my stuff on a regular basis
		};
		this.inSync = true;
		if(this.master) {
			pollStart.delay(1,this);
		} else {
			pollStart.delay(this.timers.mallet/2,this);
		}
	},
	end: function() {
		this.inSync = false;
		this.poller = window.clearInterval(this.poller);
		Comms.die(); //need to wait for last message to have gone
	},
	write: function(msg) {
		this.comms.send({msg:msg});
	},
	hit: function(mallet,puck,time) {
		if(this.inSync) {
			this.setConfirmTimeout(2);
			this.write('C:'+mallet.x+':'+mallet.y
				+':'+puck.x+':'+puck.y+':'+puck.dx+':'+puck.dy
				+':'+(time+this.timeOffset));
		}
	},
	faceoff: function() {
		if(this.inSync) {
			this.write('O');
		}
	},
	goal: function () {
		if(this.inSync) {
			this.setConfirmTimeout(4);
			this.write('G');
		}
	},
	foul: function (msg) {
		if(this.inSync)  {
			this.setConfirmTimeout(3);
			this.write('F:'+msg);
		}
	},
	serve: function (p) {
		if(this.inSync) {
			this.setConfirmTimeout(1);
			this.write('S:'+p.x+':'+p.y);
		}
	},
	setConfirmTimeout: function(v) {
		this.awaitingConfirmation = v;
		window.clearTimeout(this.aCtimeoutID)
		this.aCtimeoutID = this.confirmationTimeout.delay(5000,this,v);
	},
	confirmationTimeout: function(v) {
this.els.em.appendText(' [X:'+this.awaitingConfirmation+':T'+v+']');
		this.fail(); //kill it all off if we fail
	},
	poll : function() {
		var reply = this.links.table.getUpdate();
		if(reply.puck) {
			//puck is on table (it should not be on table if awaiting confirmation of foul or goal)
			this.write('P:'+reply.mallet.x+':'+reply.mallet.y
				+':'+reply.puck.x+':'+reply.puck.y+':'+reply.puck.dx+':'+reply.puck.dy
				+':'+(reply.time+this.timeOffset));
		} else {
			this.write('M:'+reply.mallet.x+':'+reply.mallet.y);
		}
	},
	messageReceived : function (msg) {
		var splitMsg = msg.split(':');
		var firm = false;
		switch (splitMsg[0]) {
			case 'N' :
				this.links.match.faceoffConfirmed();
				break;
			case 'O':
				if(this.links.match.faceoff()) {
					this.write('N');
				}
				break;
			case 'S' :
				if(this.awaitingConfirmation < 3 ) {

					this.awaitingConfirmation = 0 ; 
					window.clearTimeout(this.aCtimeoutID);
					this.write('T');
					this.links.match.serve({x:splitMsg[1].toFloat(),y:TY-splitMsg[2].toFloat()});
				}
				break;
			case 'T' :
				if(this.awaitingConfirmation == 1) {

					window.clearTimeout(this.aCtimeoutID);
					this.awaitingConfirmation = 0;
					this.links.match.serveConfirmed();
				}
				break;
			case 'E' :
				if(this.awaitingConfirmation == 3) {

					window.clearTimeout(this.aCtimeoutID);
					this.awaitingConfirmation = 0;
					this.links.match.foulConfirmed(splitMsg[1]);
				}
				break;
			case 'F' :
				if(this.awaitingConfirmation < 3 || !this.master) {
					this.write('E:'+splitMsg[1]); //confirm

					window.clearTimeout(this.aCtimeoutID);
					this.awaitingConfirmation = 0;
					this.links.match.foul();
				}
				break;
			case 'G' :
				if(this.awaitingConfirmation < 3 || !this.master) {

					this.awaitingConfirmation = 0
					this.write('H'); //confirm
					this.links.match.goal();
				}
				break;
			case 'H' :
				if(this.awaitingConfirmation == 4) { 

					window.clearTimeout(this.aCtimeoutID);
					this.awaitingConfirmation = 0;
					this.links.match.goalConfirmed();
				}
				break;
			case 'C' :
				if (this.awaitingConfirmation <2 || (!this.master && this.awaitingConfirmation ==2))	{
					firm = true;
				}
			case 'P' :
				if(firm || this.awaitingConfirmation == 0) { 
					this.links.table.update(firm,
					{x:splitMsg[1].toFloat(),y:splitMsg[2].toFloat()},
					{x:splitMsg[3].toFloat(),y:splitMsg[4].toFloat(),
						dx:splitMsg[5].toFloat(),dy:splitMsg[6].toFloat()},
	 				splitMsg[7].toInt()-this.timeOffset);
					if (firm) {
						this.write('D');

						window.clearTimeout(this.aCtimeoutID);
						this.awaitingConfirmation = 0;
					}
				} else {
					//regardless - send at least the mallet position
					this.links.table.update(false,{x:splitMsg[1].toFloat(),y:splitMsg[2].toFloat()},null,null);
				}
				break;
			case 'D':
				if(this.awaitingConfirmation == 2 ) {

					window.clearTimeout(this.aCtimeoutID);
					this.awaitingConfirmation = 0;
				}
				break;
			case 'M' :
				this.links.table.update(firm,{x:splitMsg[1].toFloat(),y:splitMsg[2].toFloat()},null,null);
				break;
			case 'A' :
				this.els.em.appendText('Told to abandon');
				this.links.match.end();
				break;
			default :
				this.els.em.appendText('Invalid Message:'+msg);
		}
	},
	fail: function() {
		this.write('A');
		this.links.match.end();
	}
});


