MBahplay = function() {
	var myParams;
	var myname;
	var timeOffset;
	var master;
	var t;				//object holding various timer values
	var setState = function (t) {
		$('state').set('text',t);
	};
	var Comms = function () {
		var abortReq = new Request.JSON({url:'abort.php',method:'get',link:'chain',onComplete:function(r,e){$('text').set('text',e);}});
		var sopt ;
		var ropt ;
		var sendFailFunc = null;
		var sendSuccFunc = null;
		var readFailFunc = null;
		var readSuccFunc = null;
		var wToId = null;
		var wTo = function() {
			wToId = null;
			abortReq.get($merge(myParams,{ms:sopt.ms,rw:'w'}));
		};
		var sendReq = new Request.JSON({url:'send.php',method:'get',onComplete: function(response,errorstr) {
			if(wToId) $clear(wToId);   //stop timeout from happening
			if (response) {
				if (response.ok) {
					sendSuccFunc(response.time);
				} else {
					sendFailFunc();
				}
			} else {
				$('text').set('text',errorstr);
			}
		}});
		var rToId = null;
		var rTo = function() {
			rToId = null;
			abortReq.get($merge(myParams,ropt,{rw:'r'}));
		};
		var readReq = new Request.JSON({url:'read.php',method:'get',onComplete: function(response,errorstr) {
			if(rToId) $clear(rToId);   //stop timeout from happening
			if (response) {
				if (response.ok) {
					readSuccFunc(response.time,response.data);
				} else {
					readFailFunc();
				}
			} else {
				$('text').set('text',errorstr);
			}
		}});
		return {
			init: function(m) {
				sopt = {ms:(m)?'m':'s',ch:''};
				ropt =  {ms:(m)?'s':'m'};
			},	
			read: function (success,fail) {
				readSuccFunc = success;
				readFailFunc = fail;
				rToId = rTo.delay(t.timeout);
				readReq.get(ropt);
			},
			write: function (msg,success,fail) {
				sendSuccFunc = success;
				sendFailFunc = fail;
				sopt.ch=msg;
				wToId = wTo.delay(t.timeout);
				sendReq.get(sopt);
			},
			die: function () {
				rTo(); //just act like both timeouts happened
				wTo();
			}
		}
	}();  // End Comms
	var tKid = null;
	var tick = function() {
	}

	var awaitOpponent = function () {
		setState('Await');
		if (master) {
			Comms.write('1',startGame,function () {
				setState('Fail W');
			});
		} else {
			Comms.read(startGame,function () {
				setState('Fail R');
			});
		}
	};
	var startGame = function (response) {
		setState('Start');
		$('text').set('text',response);
	};
	return {
		init: function (me,ma,timers) {
			var timeReq = function() {
				startTime = new Date().getTime();
				req.get($merge(myParams,{r:$random(1,500)}));;
			};	
			myParams = {pid:me.uid,pp:me.password};
			myname = me.name;
			t = timers;
			master = ma;
			Comms.init(ma);
			setState('Timing');
			var startTime;
			var totalOffset = 0;
			var i = t.count;
			var req = new Request.JSON({url:'time.php',method:'get',link:'chain',onComplete: function(response,errorstr) {
				if (response ) {
					var endTime = new Date().getTime();
					var commsTime = endTime - startTime;
					var midTime = parseInt(startTime+ commsTime/2);
					var offsetTime = response.servertime - midTime;
					totalOffset += offsetTime;
					if (i-- > 0 ) {
						timeReq.delay(50);
					} else {
						timeOffset = totalOffset/t.count;
						awaitOpponent();
					}
				}
			}});
			timeReq();
		},
		logout: function () {
			Comms.die();
		}
	}
}();
