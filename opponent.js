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
		this.pending = false;
		this.aC = '';
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
		this.aC = 'N';
		if(this.inSync) this.send('O');
	},
	goal: function () {
		this.aC = 'H';
		if(this.inSync) this.send('G');
	},
	foul: function (msg) {
		this.aC = 'E';
		if(this.inSync) this.send('F:'+msg);
	},
	serve: function (p) {
		this.aC = 'T';
		if(this.inSync) this.send('S:'+p.x+':'+p.y);
	},
	send: function(msg) {
		this.pending = true;
		this.comms.write(msg);
	},
	poll : function() {
		if(this.aC) return; //don't do any polls whilst waiting from confirmation of goal, foul or faceoff
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
				if(this.aC == 'N') this.aC = '';
				this.pending = false;
				this.links.match.faceoffConfirmed();
				break;
			case 'O':
				if(!(this.pending && this.master)){
					this.comms.write('N');
				} else {
					this.comms.write('X:N');
this.els.message.appendText('[X--n]');
				}
				this.links.match.faceoff()
				break;
			case 'S' :
				if(!(this.pending && this.master)){
					this.comms.write('T');
				} else {
					this.comms.write('X:T');
this.els.message.appendText('[X--t]');
				}
				this.links.match.serve({x:splitMsg[1].toFloat(),y:2400-splitMsg[2].toFloat()});
				break;
			case 'T' :
				if(this.aC == 'T') this.aC = '';
				this.pending = false;
				this.links.match.serveConfirmed();
				break;
			case 'E' :
				if(this.aC == 'E') this.aC = '';
				this.pending = false;
				this.links.match.foulConfirmed(splitMsg[1]);
				break;
			case 'F' :
				if (!(this.pending && this.master)) {
					this.comms.write('E:'+splitMsg[1]); //confirm
				} else {
					this.comms.write('X:E');
this.els.message.appendText('[X--e]');
				}
				this.links.match.foul();
				break;
			case 'G' :
				if ( !(this.pending && this.master)) {
					this.comms.write('H'); //confirm
				} else {
					this.comms.write('X:H');
this.els.message.appendText('[X--h]');
				}
				this.links.match.goal();
				break;
			case 'H' :
				if(this.aC == 'H') this.aC = '';
				this.pending = false;
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
				if(splitMsg[1] == this.aC) this.aC = '';
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
		this.sopt = {uid:me.uid,msg:'',t:0};
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
		this.sopt.t = new Date().getTime() + this.offset;
		this.sopt.msg = msg;
		this.sendReq.post(this.sopt);
	},
	die: function () {
		this.commsFailed = true;
		this.readReq.cancel();
		this.sendReq.cancel();
		this.abortReq.post(this.aopt);  //kill off all of my requests
	}
});
