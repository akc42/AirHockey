var Opponent = new Class({
	initialize: function(links,me,oid,master,timers,els) {
		var that = this;
		var myfail = function(reason) {
			that.fail(reason);
		};
		this.links = links;
		this.timers = timers;
		this.els = els;
		this.inSync = false;
		this.timeout = timers.timeout;
		this.comms = new Comms(me,oid,timers.opponent,myfail,els);
		var awaitOpponent = function() {
			if (master) {
				that.comms.set(startMatchM,timers.opponent);
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
			that.links.match.start(time+1000 - now);	//we want to start the match from 1 second from when the server told us.
			that.poller=that.poll.delay(1000,that);  //start sending my stuff on a regular basis
		};
		var er = function(t,m) {
			that.eventReceived(t,m);
		};

		var startTime;
		var totalOffset = 0;
		var i = timers.count;
		var timeReq = function() {
			startTime = new Date().getTime();
			req.post(me);
		};
		var req = new Request.JSON({url:'time.php',onComplete: function(response,errorstr) {
			if (response ) {
				var endTime = new Date().getTime();
				var commsTime = endTime - startTime;
				var midTime = parseInt(startTime+ commsTime/2);
				var offsetTime = response.servertime - midTime;
				totalOffset += offsetTime;
				if (--i > 0 ) {
					timeReq.delay(50);  //delay, otherwise if fast link it doesn't have time to exit this routing before re entering
				} else {
					that.timeOffset = (totalOffset/timers.count).toInt();
					awaitOpponent();
				}
			}
		}});
		timeReq();
	},
	hit: function(mallet,puck) {
this.els.message.appendText('[C]');
		if(this.inSync) this.send('C:'+mallet.x+':'+mallet.y+':'+puck.x+':'+puck.y+':'+puck.dx+':'+puck.dy+':'+(new Date().getTime()+this.timeOffset));
	},
	end: function() {
		this.comms.die();
	},
	faceoff: function() {
this.els.message.appendText('[O]');
		if(this.inSync) this.send('O');
	},
	goal: function () {
this.els.message.appendText('[G]');
		if(this.inSync) this.send('G');
	},
	foul: function () {
this.els.message.appendText('[F]');
		if(this.inSync) this.send('F');
	},
	serve: function (p) {
this.els.message.appendText('[S]');
		if(this.inSync) this.send('S:'+p.x+':'+p.y);
	},
	send: function(msg) {
		this.poller = $clear(this.poller);
		this.poller = this.poll.delay(1000,this);
		this.comms.write(msg);
	},
	poll : function() {
		this.poller = this.poll.delay(1000,this);
	  var reply = this.links.table.getUpdate();
	  if(reply.puck) {
	    //puck is on table
	    this.comms.write('P:'+reply.mallet.x+':'+reply.mallet.y+':'+reply.puck.x+':'+reply.puck.y+':'+reply.puck.dx+':'+reply.puck.dy
							+':'+(new Date().getTime() + this.timeOffset));
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
			case 'O':
				this.links.match.faceoff();
				break;
			case 'S' :
				this.links.match.serve({x:splitMsg[1].toInt(),y:2400-splitMsg[2].toInt()});
				break;
			case 'E' :
				fail(); //use this, as it shuts things down too
				break;
			case 'F' :
				this.links.match.foul();
				break;
			case 'G' :
				this.links.match.goal();
				break;
			case 'C' :
				firm = true;
			case 'P' :
				this.links.table.update(firm,
					{x:splitMsg[1].toInt(),y:2400 - splitMsg[2].toInt()},
					{x:splitMsg[3].toInt(),y:2400 - splitMsg[4].toInt(),dx:splitMsg[5].toInt(),dy:-splitMsg[6].toInt()},
					((new Date().getTime() + this.timeOffset -splitMsg[7].toInt())/this.timers.tick | 0));
				//calculate where I think the puck should be based on the time
				break;
			case 'M' :
				this.links.table.update(false,{x:splitMsg[1].toInt(),y:2400 - splitMsg[2].toInt()},null,null);
				break;
			default :
				this.els.message.appendText('Invalid Message:'+msg);
		}
	},
	fail: function(reason) {
		this.links.match.end();
		this.els.message.appendText(reason);
		$clear(this.poller);
		this.inSync = false;
	}
});

var Comms = new Class({
	initialize: function(me,oid,initialTimeout,fail,els) {
		var that = this;
		this.els = els;
		this.timeoutValue = initialTimeout;
		this.timeout = null;
		this.opt = {uid:me.uid,oid:oid};
		this.commsFailed = false;
		this.fail = function(reason) {
			this.commsFailed = true;
			this.abortReq.post(this.opt);  //kill off outstanding requests
			fail('Comms Timeout');
		};
		this.func = null;
		var complete = function(r,e) {
			if(r){
				if (r.ok) {
if(r.w) {
	els.message.appendText('{'+r.w+':'+r.t1+','+r.t2+':'+r.msg.charAt(0)+'}');
} else {
	if(!(r.msg.charAt(0) == 'M' || r.msg.charAt(0) == 'P')) els.message.appendText('['+r.msg.charAt(0)+']');
}
					that.timeout=$clear(that.timeout);
					if (that.func) that.func(r.time,r.msg);
} else {
els.message.appendText('()');
				}

		} else {
			els.message.appendText(e);
		}
		};
		this.readReq = new Request.JSON({url:'pipe.php',link:'cancel',onComplete:complete});
		this.req = new Request.JSON({url:'pipe.php',link:'cancel',onComplete:complete})
		this.abortReq = new Request.JSON({url:'abort.php',link:'chain'});
		this.timeout = null;
	},
	set: function(success,timeout) {
		this.timeoutValue = timeout;
		this.timeout = $clear(this.timeout);
		this.func = success;
	},
	read: function (time) {
		if(this.commsFailed) return;
		if(!this.timeout) this.timeout = this.fail.delay(this.timeoutValue,this);
this.els.message.appendText('(R)');
		this.readReq.post(this.opt);
	},
	write: function (msg,time) {
		if(this.commsFailed) return;
//		this.readReq.cancel(); //we switch over from reading to writing
		if(!this.timeout) this.timeout = this.fail.delay(this.timeoutValue,this);
this.els.message.appendText('(W)');
		this.req.post($merge(this.opt,{msg:msg,w:new Date().getTime()}));
	},
	die: function () {
		this.abortReq.post(this.opt);  //kill off all of my requests
	}
});
