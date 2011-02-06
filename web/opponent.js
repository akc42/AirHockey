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
		function myFail (reason) {
			window.clearInterval(that.poller);
			that.fail(reason);
		}
		this.links = links;
		this.timers = timers;
		this.els = els;
		this.master = master;
		this.inSync = false;
		this.timeout = timers.timeout;
		this.timeOffset = 0;
		this.awaitingConfirmation = 0; //0 = not waiting, 1 awaiting serve, 2 awaiting hit, 3 awaiting foul, 4 awaiting goal
		this.echoTime = function() {
			var t = ((new Date().getTime() + this.timeOffset)/100).toInt();
			return t%10000;
		};
		var awaitOpponent = function() {
			if (master) {
				Comms.set(me,oid,startMatchM,timers.opponent,1,myFail,els.em);
				that.write('Start');
			} else {
				Comms.set(me,oid,startMatchS,timers.opponent,1,myFail,els.em);
			}
		};
		var startMatchM = function(time,msg) {
				Comms.set(me,oid,er,timers.timeout,timers.limit,myFail,els.em);
				startMatch(time);
		};
		var startMatchS = function(time,msg) {
			if(msg != 'A') {
				Comms.set(me,oid,er,timers.timeout,timers.limit,myFail,els.em);
				that.write('Going'); // Send something back to tell the other end to start
				startMatch(time);
			} else {
				that.els.em.appendText('Told to Abandon during startup');
				that.links.match.end();
			}
		};	
		var startMatch = function (time) {
			that.inSync = true;
			var now = new Date().getTime() + that.timeOffset;
			that.links.match.start.delay(time+timers.startup - now,that.links.match);	//we want to start same delay from when the server told us it would.
			that.poller=that.poll.periodical(timers.mallet,that);  //start sending my stuff on a regular basis
		};
		var er = function(t,m) {
			that.messageReceived.delay(1,that,m);
		};

		var startTime;
		that.timeOffset = 0;
		var achievedCloseOffset = false;
		
		var i = timers.count;
		var timeReq = function() {
			startTime = new Date().getTime();
			req.post(Object.merge(me,{t:startTime+that.timeOffset}));
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
					that.comms = new Comms.Stream('send.php');
					awaitOpponent();
				}
			}
		}});
		timeReq();
	},
	hit: function(mallet,puck,time) {
		if(this.inSync) {
this.els.em.appendText(' ['+this.echoTime()+':2:C]');
			this.awaitingConfirmation = 2;
			this.write('C:'+mallet.x+':'+mallet.y
				+':'+puck.x+':'+puck.y+':'+puck.dx+':'+puck.dy
				+':'+(time+this.timeOffset));
		}
	},
	end: function() {
		this.inSync = false;
		this.poller = window.clearInterval(this.poller);
		var a = new Comms.Stream('abort.php');
		a.send();
		Comms.die.delay(1000); //need to wait for last message to have gone
	},
	write: function(msg) {
		this.comms.send({msg:msg});
	},
	faceoff: function() {
		if(this.inSync) {
			this.write('O');
		}
	},
	goal: function () {
		if(this.inSync) {
			this.awaitingConfirmation = 4;
this.els.em.appendText(' ['+this.echoTime()+':4:G]');
			this.write('G');
		}
	},
	foul: function (msg) {
		if(this.inSync)  {
			this.awaitingConfirmation = 3;
this.els.em.appendText(' ['+this.echoTime()+':3:F]');
			this.write('F:'+msg);
		}
	},
	serve: function (p) {
		this.awaitingConfirmation = 1;
this.els.em.appendText(' ['+this.echoTime()+':1:S]');
		if(this.inSync) this.write('S:'+p.x+':'+p.y);
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
this.els.em.appendText(' ['+this.echoTime()+':'+this.awaitingConfirmation+':T]');
					this.awaitingConfirmation = 0 ; 
					this.write('T');
					this.links.match.serve({x:splitMsg[1].toFloat(),y:TY-splitMsg[2].toFloat()});
				}
				break;
			case 'T' :
				if(this.awaitingConfirmation == 1) {
this.els.em.appendText(' ['+this.echoTime()+':1:s]');
					this.awaitingConfirmation = 0;
					this.links.match.serveConfirmed();
				}
				break;
			case 'E' :
				if(this.awaitingConfirmation == 3) {
this.els.em.appendText(' ['+this.echoTime()+':3:f]');
					this.awaitingConfirmation = 0;
					this.links.match.foulConfirmed(splitMsg[1]);
				}
				break;
			case 'F' :
				if(this.awaitingConfirmation < 3 || !this.master) {
					this.write('E:'+splitMsg[1]); //confirm
this.els.em.appendText('['+this.echoTime()+':'+this.awaitingConfirmation+':E]');
					this.awaitingConfirmation = 0;
					this.links.match.foul();
				}
				break;
			case 'G' :
				if(this.awaitingConfirmation < 3 || !this.master) {
this.els.em.appendText(' ['+this.echoTime()+':'+this.awaitingConfirmation+':H]');
					this.awaitingConfirmation = 0
					this.write('H'); //confirm
					this.links.match.goal();
				}
				break;
			case 'H' :
				if(this.awaitingConfirmation == 4) { 
this.els.em.appendText(' ['+this.echoTime()+':4:g]');
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
this.els.em.appendText('['+this.echoTime()+':'+this.awaitingConfirmation+':D]');
					this.awaitingConfirmation = 0;
					}
				} else {
					//regardless - send at least the mallet position
					this.links.table.update(false,{x:splitMsg[1].toFloat(),y:splitMsg[2].toFloat()},null,null);
				}
				break;
			case 'D':
				if(this.awaitingConfirmation == 2 ) {
this.els.em.appendText(' ['+this.echoTime()+':2:c]');
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
	fail: function(reason) {
		this.els.em.appendText(reason);
		this.write('A');
		this.links.match.end();
	}
});


