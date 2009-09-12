var Opponent = new Class({
	initialize: function(links,me,oid,master,timers,els) {
		var that = this;
		var myfail = function(reason) {
			that.poller = $clear(that.poller);
			that.fail(reason);
		};
		this.links = links;
		this.timers = timers;
		this.els = els;
		this.master = master;
		this.inSync = false;
		this.timeout = timers.timeout;
		this.timeOffset = 0;
		this.aC = 0;
		this.echoTime = function() {
			var t = ((new Date().getTime() + this.timeOffset)/100).toInt();
			return t%10000;
		};
		var awaitOpponent = function() {
			if (master) {
				that.comms.set(startMatchM,timers.opponent);
				that.comms.read();
				that.comms.write('Start');
			} else {
				that.comms.set(startMatchS,timers.opponent);
				that.comms.read();
			}
		};
		var startMatchM = function(time,msg) {
			if(msg == 'OK') {
				startMatch(time);
			}
		};
		var startMatchS = function(time,msg) {
			switch (msg) {
				case 'Start':
					that.comms.set(er,timers.timeout);
					that.comms.write.delay(20,that.comms,'OK'); // just wait a short while before returning the OK
					startMatch(time);
					break;
				case 'Abandon':
					that.links.match.end();
					break;
				default:
					awaitOpponent();
			}
		};	
		var startMatch = function (time) {
			that.inSync = true;
			that.comms.set(er,timers.timeout);
			that.comms.read();
			var now = new Date().getTime() + that.timeOffset;
			that.links.match.start.delay(time+800 - now,that.links.match);	//we want to start the match from 1 second from when the server told us.
			that.poller=that.poll.periodical(timers.mallet,that);  //start sending my stuff on a regular basis
		};
		var er = function(t,m) {
			that.eventReceived(t,m);
		};

		var startTime;
		that.timeOffset = 0;
		var achievedCloseOffset = false;
		
		var i = timers.count;
		var timeReq = function() {
			startTime = new Date().getTime();
			req.post($merge(me,{t:startTime+that.timeOffset}));
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
					that.comms = new Comms(me,oid,timers.opponent,myfail,that.timeOffset,els);
					awaitOpponent();
				}
			}
		}});
		timeReq();
	},
	hit: function(mallet,puck,time) {
		if(this.aC > 2) return;  //shouldn't get this but just to be safe
		if(this.inSync) this.comms.write('C:'+mallet.x+':'+mallet.y
			+':'+puck.x+':'+puck.y+':'+puck.dx+':'+puck.dy
			+':'+(time+this.timeOffset));
	},
	end: function() {
		this.inSync = false;
		this.poller = $clear(this.poller);
		this.comms.die.delay(1000,this.comms); //need to wait for last message to have gone
	},
	faceoff: function() {
		if(this.aC) return; //Anything underway right now then ignore
		this.aC = 1;
this.els.message.appendText('['+this.echoTime()+':1:O]');
		if(this.inSync) this.send('O');
	},
	goal: function () {
		if( this.aC > 2)return;  //I've already detected an off table event and am awaiting response
		this.aC = 4;
this.els.message.appendText('['+this.echoTime()+':4:G]');
		if(this.inSync) this.send('G');
	},
	foul: function (msg) {
		if(this.aC > 2) return; //I've already reported a something and am awaiting a response
		this.aC = 3;
this.els.message.appendText('['+this.echoTime()+':3:F]');
		if(this.inSync) this.send('F:'+msg);
	},
	serve: function (p) {
		if(this.aC >1) return;
		this.aC = 2;
this.els.message.appendText('['+this.echoTime()+':2:S]');
		if(this.inSync) this.send('S:'+p.x+':'+p.y);
	},
	send: function(msg) {
		this.comms.write(msg);
	},
	poll : function() {
		if(this.aC > 2) return; //don't do any polls whilst waiting from confirmation of goal, or foul
		var reply = this.links.table.getUpdate();
		if(reply.puck) {
			//puck is on table
			this.comms.write('P:'+reply.mallet.x+':'+reply.mallet.y
				+':'+reply.puck.x+':'+reply.puck.y+':'+reply.puck.dx+':'+reply.puck.dy
				+':'+(reply.time+this.timeOffset));
		} else {
			this.comms.write('M:'+reply.mallet.x+':'+reply.mallet.y);
		}
	},
	eventReceived : function (time,msg) {
		this.comms.read();
		var that = this;
		var er = function(t,m) {
			that.eventReceived(t,m);
		};
		var splitMsg = msg.split(':');
		var firm = false;
		switch (splitMsg[0]) {
			case 'N' :
				if(this.aC < 2) {
this.els.message.appendText('['+this.echoTime()+':'+this.aC+':o]');
					this.aC = 0;
					this.links.match.faceoffConfirmed();
				}
				break;
			case 'O':
				if(this.aC < 1 || (!this.master && this.aC ==1)) {
this.els.message.appendText('['+this.echoTime()+':'+this.aC+':O]');
					this.comms.write('N');
					this.links.match.faceoff()
				} else {
					this.comms.write('X:1');
				}
				break;
			case 'S' :
				if(this.aC < 2 || (!this.master && this.aC ==2)) {
					this.comms.write('T');
this.els.message.appendText('['+this.echoTime()+':'+this.aC+':S]');
					this.links.match.serve({x:splitMsg[1].toFloat(),y:2400-splitMsg[2].toFloat()});
				} else {
					this.comms.write('X:2');
				}
				break;
			case 'T' :
				if(this.aC < 3) {
this.els.message.appendText('['+this.echoTime()+':'+this.aC+':s]');
					if(this.aC == 2) this.aC = 0;
					this.links.match.serveConfirmed();
				}
				break;
			case 'E' :
				if(this.aC < 4) {
this.els.message.appendText('['+this.echoTime()+':'+this.aC+':f]');
					if (this.aC == 3) this.aC = 0;
					this.links.match.foulConfirmed(splitMsg[1]);
				}
				break;
			case 'F' :
				if(this.aC != 3 || (!this.master && this.aC ==3)) {
					this.comms.write('E:'+splitMsg[1]); //confirm
this.els.message.appendText('['+this.echoTime()+':'+this.aC+':F]');
					this.links.match.foul();
				} else {
					this.comms.write('X:3');
				}
				break;
			case 'G' :
				if(this.aC < 3 || (!this.master && this.aC ==4)) {
this.els.message.appendText('['+this.echoTime()+':'+this.aC+':G]');
					this.comms.write('H'); //confirm
					this.links.match.goal();
				} else {
					this.comms.write('X:4');
				}
				break;
			case 'H' :
this.els.message.appendText('['+this.echoTime()+':'+this.aC+':g]');
				if(this.aC == 4) this.aC = 0;
				this.links.match.goalConfirmed();
				break;
			case 'C' :
				firm = true;
			case 'P' :
					this.links.table.update(firm,
					{x:splitMsg[1].toFloat(),y:2400 - splitMsg[2].toFloat()},
					{x:splitMsg[3].toFloat(),y:2400 - splitMsg[4].toFloat(),
						dx:splitMsg[5].toFloat(),dy:-splitMsg[6].toFloat()},
	 				splitMsg[7].toInt()-this.timeOffset);
				//calculate where I think the puck should be based on the time
				break;
			case 'M' :
				this.links.table.update(false,{x:splitMsg[1].toFloat(),y:2400 - splitMsg[2].toFloat()},null,null);
				break;
			case 'X' :
this.els.message.appendText('['+this.echoTime()+':'+this.aC+':X:'+splitMsg[1]+']');
				if(splitMsg[1] == this.aC) this.aC = 0;
				break;
			default :
				this.els.message.appendText('Invalid Message:'+msg);
		}
	},
	fail: function(reason) {
		this.els.message.appendText(reason);
		this.links.match.end();
	}
});

var Comms = new Class({
	initialize: function(me,oid,initialTimeout,fail,offset,els) {
		var that = this;
		this.els = els;
		this.offset = offset;
		this.timeoutValue = initialTimeout;
		this.timeout = null;
		this.aopt = {uid:me.uid,oid:oid};
		this.ropt = {oid:oid};
		this.sopt = {uid:me.uid};
		this.commsFailed = false;
		this.fail = function(reason) {
			if(!that.commsFailed) {
				that.commsFailed = true;
				fail('Comms Timeout');
			}
		};
		
		this.func = null;
		this.sendReq = new Request.JSON({url:'send.php',link:'chain'});
		
		this.readReq = new Request.JSON({url:'read.php',link:'chain',onComplete:function(r,e) {
			if(r){
				that.timeout=$clear(that.timeout);
				if (that.func) {
					that.func(r.time,r.msg);
					if(r.msg2) {
that.els.message.appendText('%%%');
						that.func(r.time,r.msg2);
					}
				}
			} else {
that.els.message.appendText('$$$');
			}
		}});
		this.abortReq = new Request.JSON({url:'abort.php',link:'chain'});
		this.timeout = null;
	},
	set: function(success,timeout) {
		this.timeoutValue = timeout;
		this.timeout = $clear(this.timeout);
		this.func = success;
	},
	read: function () {
		if(this.commsFailed) return;
		if(!this.timeout) this.timeout = this.fail.delay(this.timeoutValue,this);
		this.readReq.post(this.ropt);
	},
	write: function (msg) {
		if(this.commsFailed) return;
		this.sendReq.post($merge(this.sopt,{msg:msg}));
	},
	die: function () {
		this.commsFailed = true;
		this.readReq.cancel();
		this.sendReq.cancel();
		this.abortReq.post(this.aopt);  //kill off all of my requests
	}
});