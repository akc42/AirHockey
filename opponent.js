var Opponent = new Class({
	initialize: function(links,me,oid,master,timers,els) {
		var that = this;
		this.links = links;
		this.inSync = false;
		var fail = function(reason) {
			links.match.end();
			els.message.appendText(reason);
			$clear(that.poller);
			that.inSync = false;
		};
		this.comms = new Comms(me,oid,timers,fail);
		var poll = function() {
			var reply = links.table.getUpdate();
			if(reply.puck) {
				//puck is on table
				that.comms.write('P:'+reply.mallet.x+':'+reply.mallet.y+':'+reply.puck.x+':'+reply.puck.y+':'+reply.puck.dx+':'+reply.puck.dy
							+':'+(new Date().getTime() + that.timeOffset),null);
			} else {
				that.comms.write('M:'+reply.mallet.x+':'+reply.mallet.y);
			}
		};
		var awaitOpponent = function() {
			if (master) {
				that.comms.write('Start',startMatch,timers.opponent);
			} else {
				that.comms.read.delay(1,that.comms,[startMatchS,timers.opponent]);
			}
		};
		var startMatchS = function(time,msg) {
			switch (msg) {
				case 'Start':
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
			var now = new Date().getTime() + that.timeOffset;
			that.links.match.start(time+1000 - now);	//we want to start the match from 1 second from when the server told us.
			that.comms.read(eventReceived);
			that.poller = poll.periodical(1000);
		};

		var eventReceived = function (time,msg) {
			var splitMsg = msg.split(':');
			var firm = false;
			switch (splitMsg[0]) {
				case 'O':
					that.links.match.faceoff();
					break;
				case 'S' :
					that.links.match.serve({x:splitMsg[1].toInt(),y:splitMsg[2].toInt()});
					break;
				case 'E' :
					fail(); //use this, as it shuts things down too
					break;
				case 'F' :
					that.links.match.foul();
					break;
				case 'G' :
					that.links.match.goal();
					break;
				case 'C' :
					firm = true;
				case 'P' :
					that.links.table.update(firm,
	 					{x:splitMsg[1].toInt(),y:2400 - splitMsg[2].toInt()},
	   					{x:splitMsg[3].toInt(),y:2400 - splitMsg[4].toInt(),dx:splitMsg[5].toInt(),dy:-splitMsg[6].toInt()},
	   					((new Date().getTime() + that.timeOffset -splitMsg[7].toInt())/timers.tick | 0));
					//calculate where I think the puck should be based on the time
					break;
				case 'M' :
					that.links.table.update(false,{x:splitMsg[1].toInt(),y:2400 - splitMsg[2].toInt()},null,null);
					break;	
				default :
					els.message.appendText('Invalid Message:'+msg);
			}
			that.comms.read(eventReceived); //Just ensure the current read request completes before restarting it
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
		if(this.inSync) this.comms.write('C:'+mallet.x+':'+mallet.y+':'+puck.x+':'+puck.y+':'+puck.dx+':'+puck.dy+':'+(new Date().getTime()+this.timeOffset),null);
	},
	end: function() {
		this.comms.die();
	},
	faceoff: function() {
		if(this.inSync) this.comms.write('O');
	},
	goal: function () {
		if(this.inSync) this.comms.write('G');
	},
	foul: function () {
		if(this.inSync) this.comms.write('F');
	},
	serve: function (p) {
		if(this.inSync) this.comms.write('S:'+p.x+':'+p.y);
	}
});

var Comms = new Class({
	initialize: function(me,oid,timers,fail) {
		var that = this;
		this.me = me;
		this.oid = oid
		this.timers = timers
		this.ropt = {uid:oid,to:timers.timeout}
		this.sopt = {uid:me.uid,msg:'',to:timers.timeout};
		this.commsFailed = false;
		this.fail = function(reason) {
			that.commsFailed = true;
			fail(reason);
		};
		this.sendFunc = null;
		this.readFunc = null;
		this.sendReq = new Request.JSON({url:'send.php',link:'chain',onComplete: function(response,errorstr) {
			if (response) {
				if (that.sendFunc) that.sendFunc(response.time);
			} else {
				that.fail(errorstr);
			}
		}});
		this.readReq = new Request.JSON({url:'read.php',link:'chain',onComplete: function(response,errorstr) {
			that.timeout=$clear(that.timeout);
			if (response) {
				if(that.readFunc) that.readFunc(response.time,response.msg);
			} else {
				that.fail(errorstr);
			}
		}});
		this.abortReq = new Request.JSON({url:'abort.php',link:'chain'});
		this.timeout = null;
	},
	read: function (success,time) {
		this.readFunc = success;
		this.ropt.to = time || this.timers.timeout;
		this.readReq.post(this.ropt);
	},
	write: function (msg,success,time) {
		if(this.commsFailed) return; // if read has failed stop sending
		this.sendFunc = success;
		this.sopt.msg=msg;
		this.sopt.to = time || this.timers.timeout;
		this.sendReq.post(this.sopt);
	},
	die: function () {
		this.commsFailed = true;
		this.abortReq.post($merge(this.me,{oid:this.oid}));  //kill off all of my requests
	}
});
