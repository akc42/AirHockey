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
		this.inSync = false;
		this.timeout = timers.timeout;
		this.timeOffset = 0;
		this.comms = new Comms(me,oid,timers.opponent,myfail,els);
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
			that.links.match.start(time+1000 - now);	//we want to start the match from 1 second from when the server told us.
			that.poller=that.poll.periodical(timers.mallet,that);  //start sending my stuff on a regular basis
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
		if(this.inSync) this.send('C:'+mallet.x+':'+mallet.y+':'+puck.x+':'+puck.y+':'+puck.dx+':'+puck.dy+':'+(new Date().getTime()+this.timeOffset));
	},
	end: function() {
		this.comms.die();
	},
	faceoff: function() {
		if(this.inSync) this.send('O');
	},
	goal: function () {
		if(this.inSync) this.send('G');
	},
	foul: function () {
		if(this.inSync) this.send('F');
	},
	serve: function (p) {
		if(this.inSync) this.send('S:'+p.x+':'+p.y);
	},
	send: function(msg) {
		this.comms.write(msg);
	},
	poll : function() {
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
					((new Date().getTime() + this.timeOffset -splitMsg[7])/this.timers.tick).toInt());
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
		this.aopt = {uid:me.uid,oid:oid};
		this.ropt = {oid:oid};
		this.sopt = {uid:me.uid,msg:''};
		this.commsFailed = false;
		this.fail = function(reason) {
			this.commsFailed = true;
			this.abortReq.post(this.aopt);  //kill off outstanding requests
			fail('Comms Timeout');
		};
		var callback = function(t,m) {
			if (that.func) that.func(t,m);
		}
		
		this.func = null;
		
		this.sendReq = new Request.JSON({url:'send.php',link:'chain'});
		
		this.readReq = new Request.JSON({url:'read.php',link:'cancel',onComplete:function(r) {
			if(r){
				that.timeout=$clear(that.timeout);
				callback.delay(1,that,[r.time,r.msg]); //allow escape from this routine before actually runnign round to call me again
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
		this.sopt.msg = msg;
		this.sendReq.post(this.sopt);
	},
	die: function () {
		this.abortReq.post(this.opt);  //kill off all of my requests
	}
});
