MBahplay = function() {
	var myparams;
	var myname;
	var opname;
	var options;
	var timeOffset;
	var master;
	var tKid = null;
	var tick = function() {
	}
	var startGame(response) {
		$('info').set('text','me:'+response.mytime+' op:'+response.optime);
	}

	var pRid = null;
	var pollReady = function() {
		var req = new Request.JSON({url:this.url,method:'get',onComplete: function(response,errorstr) {
			if (response ) {
				if (response.ready) {
					pRid=$clear(pRid);
					this.ready(response);
				} else {
					if(this.counter-- <=0) {
						this.timeout();
					}
				}
			}
		}}).get(myparams);

	};
	var awaitOpponent = function () {
		var counter = null;
		var timer = null;
		var req = new Request.JSON({url:'await.php',method:'get',onComplete: function(response,errorstr) {
			if (response ) {
				if (response.abort) {
					if (timer) $clear(timer);
					req = new Request.JSON({url:'abort.php',method:'get'}).get(myparams);  //send off an abort
					window.location.replace('index.php');
				}	
				if (response.ready) {
					if (timer) $clear(timer);
					startGame(response);
				} else {
					if(counter){
						if(counter-- <= 0) {
							$clear(timer);
							req = new Request.JSON({url:'abort.php',method:'get'}).get(myparams);  //send off an abort
							window.location.replace('index.php');
						}
					} else {
						counter = options.await;
						timer = req.get.periodical(options.timeout,req,myparams);
					}
				}
			}
		}}).get(myparams);
		
	};
	return {
		init: function (me,po,ma,op) {
			myparams = {pid:me.uid,pp:me.password,oid:po.uid};
			myname = me.name;
			opname = po.name;
			master = ma;
			options = op;
			var startTime;
			var totalOffset = 0;
			var i = options.count;
			var req = new Request.JSON({url:'time.php',method:'get',onComplete: function(response,errorstr) {
				if (response ) {
					var endTime = new Date().getTime();
					var commsTime = endTime - startTime;
					var midTime = parseInt(startTime+ commsTime/2);
					var offsetTime = response.servertime - midTime;
					var totalOffset += offsetTime;
					if (i-- > 0 ) {
						startTime = new Date().getTime();
						req.get(myparams);
					} else {
						timeOffset = totalOffset/options.count;
						awaitOpponent();
				}
			}});
			startTime = new Date().getTime();
			req.get(myparams);
		},
		logout: function () {
		}
	}
}();
