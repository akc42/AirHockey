MBahplay = function() {
	var myParams;
	var myname;
	var timeOffset;
	var master;
	var t;				//object holding various timer values
	var tablePosition;
	var myMallet = function() {
		var myx;
		var myy;
		var el;
		var held = false;
		var	areaPosition;
		var held = false;
		return {
			x:560,
			y:2252,
			dx:0,
			dy:0,
			tick: function() {
				if (held) {
					if (myx < areaPosition.x) {
						if (myx < tablePosition.x) {
							held = false;
						}
						myx = areaPosition.x;
					} else {
						if (myx > areaPosition.x + 252) {
							if (myx > tablePosition.x + 280) {
								held = false;
							}
							myx = areaPosition.x + 252;
						}
					}
					var newv = 4*(myx-tablePosition.x);
					myMallet.dx = newv-myMallet.x;
					myMallet.x= newv;
					if (myy < areaPosition.y) {
						if (myy < (tablePosition.y+300)) {
							held = false;
						}
						myy = areaPosition.y;
					} else {
						if (myy > areaPosition.y + 272) {
							if (myy > tablePosition.y + 600) {
								held = false;
							}
							myy = areaPosition.y + 272;
						}
					}
					newv = 4*(myy-tablePosition.y);
					myMallet.dy = newv - myMallet.y;
					myMallet.y = newv;
					el.setStyles({'left':myx-areaPosition.x-14,'top':myy-areaPosition.y-14});
				}
			},
			init: function () {
				el = $('mymallet');
				el.addEvent('mouseover',function(e) {
					e.stop();
					myx = e.page.x;
					myy	= e.page.y;
					held = true;
					$('tablesurround').addEvent('mousemove',function(e) {
						myx = e.page.x;
						myy	= e.page.y;
					});
				});
				areaPosition = $('myarea').getPosition();
			}
		};
	}();
	var puck = function() {
		var el;
		return {
			x:560,
			y:1200,
			dx:0,
			dy:0,
			tick: function () {
				puck.x = puck.x + puck.dx;
				puck.y = puck.y +puck.dy;
				if (puck.x < 41 ) {
					puck.x = 82 - puck.x;
					puck.dx = -(puck.dx * 0.95);
					c = true;
				} else {
					if (puck.x > 1079) {
						puck.x= 2158 - puck.x;
						puck.dx = -(puck.dx * 0.95);
						c = true;
					} else {
						puck.dx = 0.99 * puck.dx;
					}
				}
				if (puck.y < 41 ) {
					puck.y = 82 - puck.y;
					puck.dy = -(puck.dy * 0.95);
					c = true;
				} else {
					if (puck.y > 2359) {
						puck.y= 4718 - puck.y;
						puck.dy = -(puck.dy * 0.95);
						c = true;
					} else {
						puck.dy = 0.99 * puck.dy;
					}
				}
				el.setStyles({'left':puck.x/4-10,'top':puck.y/4-10});
			},
			init: function () {
				el=$('puck');
			}
		}
	}();
	
	var inPlay = false; //The start clock has clicked down
	var startCountDown = -1;
	var inMyHalf = 0;
	
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
		myMallet.tick();
		puck.tick();
		//check for collision
		var dx = puck.x - myMallet.x;
		var dy = puck.y - myMallet.y;
		if ((Math.abs(dx) < 94) || (Math.abs(dy) < 94) ) { //might have hit
			if( (dx*dx + dy*dy) < 8836) {
// Collision Occurred
				dx += myMallet.dx - puck.dx;  //step back to previous tick (in case centres have passed)
				dy += myMallet.dy - puck.dy;
				var d = Math.sqrt(dx*dx+dy*dy);
				var cos_t = dx/d; //cos theta where theta angle of normal to x axis
				var sin_t = dy/d; //sin theta where theta angle of normal to x axis

				var mvn = myMallet.dx*cos_t + myMallet.dy * sin_t;  //mallet velocity along normal
				var pvn = puck.dx*cos_t + puck.dy*sin_t;  //puck velocity normal
				var pvt = puck.dx*sin_t + puck.dy*cos_t;  //puck velicity tangent

				var pvn2 = 2*mvn - pvn; //puck normal after meeting mallet
				puck.dx = pvn2*cos_t + pvt*sin_t; //translate back to x and y velocities
				puck.dy = pvn2*sin_t + pvt*cos_t;
				
			}
		}
	}

	var awaitOpponent = function () {
		setState('Await');
		tick.periodical(t.tick);
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
				req.get($merge(myParams,{r:$random(1,500)}));; //ensure we actually do the request, so its not using cached result
			};	
			myParams = {pid:me.uid,pp:me.password};
			myname = me.name;
			t = timers;
			master = ma;
			Comms.init(ma);
			setState('Timing');
			tablePosition = $('table').getPosition();
			myMallet.init();
			puck.init();
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
						timeReq.delay(50);  //delay, otherwise of fast link it doesn't have time to exit this routing before re entering
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
