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
		this.comms = new Comms(me,oid,myfail,els);
		var awaitOpponent = function() {
			if (master) {
				that.comms.write('Start',startMatchM,timers.opponent);
			} else {
				that.comms.read(startMatchS,timers.opponent);
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
					that.send.delay(20,that,'OK'); // just wait a short while before returning the OK
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
			var er = function(t,m) {
				that.eventReceived(t,m);
			};
			that.comms.read(er,that.timers.timeout);
			that.inSync = true;
			var now = new Date().getTime() + that.timeOffset;
			that.links.match.start(time+1000 - now);	//we want to start the match from 1 second from when the server told us.
			that.poll.delay(1000,that);  //start sending my stuff on a regular bassis (nothing can legitimately move in the next three seconds
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
					that.timeOffset = totalOffset/timers.count;
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
	poll : function() {
	  var reply = this.links.table.getUpdate();
	  if(reply.puck) {
	    //puck is on table
	    this.send('P:'+reply.mallet.x+':'+reply.mallet.y+':'+reply.puck.x+':'+reply.puck.y+':'+reply.puck.dx+':'+reply.puck.dy
							+':'+(new Date().getTime() + this.timeOffset));
	  } else {
	    this.send('M:'+reply.mallet.x+':'+reply.mallet.y);
	  }
	},
	send : function (msg){
		var that = this;
		var er = function(t,m) {
	  		that.poller = that.poll.delay(1000,that);
			that.eventReceived(t,m);
		};
	  this.poller=$clear(this.poller);
	  this.comms.write.delay(1,this.comms,[msg,er,this.timeout]);
	},
	eventReceived : function (time,msg) {
		var that = this;
		var er = function(t,m) {
			that.eventReceived(t,m);
		};
		this.comms.read.delay(1,this.comms,[er,this.timers.opponent]);
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
	initialize: function(me,oid,fail) {
		var that = this;
		this.timeout = null;
		this.opt = {uid:me.uid,oid:oid};
		this.commsFailed = false;
		this.fail = function(reason) {
			this.commsFailed = true;
			this.abortReq.post(this.opt);  //kill off outstanding requests
		};
		this.func = null;
		this.req = new Request.JSON({url:'pipe.php',link:'cancel',onComplete: function(response,errorstr) {
			that.timeout=$clear(that.timeout);
			if (response) {
				if (that.func) that.func(response.time,response.msg);
			} else {
				fail('Pipe Fails : '+errorstr);
			}
		}});
		this.abortReq = new Request.JSON({url:'abort.php',link:'chain'});
		this.timeout = null;
	},
	read: function (success,time) {
	  if(this.commsFailed) return;
		this.func = success;
		this.timeout = $clear(this.timeout);
		this.timeout = this.fail.delay(time,this,'Read Timeout');
		this.req.post(this.opt);
	},
	write: function (msg,success,time) {
		if(this.commsFailed) return;
		this.func = success;
		this.timeout = $clear(this.timeout);
		this.timeout = this.fail.delay(time,this,'Send Timeout');
		this.req.post($merge(this.opt,{msg:msg,w:'x'}));
	},
	die: function () {
		this.abortReq.post(this.opt);  //kill off all of my requests
	}
});
