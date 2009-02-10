MBahplay = function() {
	var myParams;
	var myname;
	var master;
	var Comms = function () {
		var abortReq = new Request.JSON({url:'abort.php',link:'chain'});
		var sopt ;
		var ropt ;
		var failFunc = null;
		var sendCompleteFunc = null;
		var readSuccFunc = null;
		var sendReq = new Request.JSON({url:'send.php',onComplete: function(response) {
			if (sendCompleteFunc) sendCompleteFunc(response.time);
		}});
		var readReq = new Request.JSON({url:'read.php',onComplete: function(response,errorstr) {
			if (response) {
				if (response.ok) {
					readSuccFunc(response.time,response.msg);
				} else {
					failFunc(response.time);
				}
			}
		}});
		return {
			init: function(m,fail) {
				sopt = {ms:(m)?'m':'s',msg:''};
				ropt =  {ms:(m)?'s':'m'};
				failFunc = fail;
			},
			read: function (success) {
				readSuccFunc = success;
				readReq.post(ropt);
			},
			write: function (msg,success) {
				sendCompleteFunc = success;
				sopt.msg=msg;
				sendReq.post(sopt);
			},
			die: function () {
				abortReq.post($merge(myParams,{ms:sopt.ms,rw:'w'}));  //kill off write requests
				abortReq.post($merge(myParams,ropt,{rw:'r'})); //kill off read requests
			}
		}
	}();  // End Comms
	var setState = function (t) {
		$('state').set('text',t);
	};
	var setCounter = function(c) {
		$('countdown').set('text', (c < 0)?' ':c);
	}
	
	var tablePosition;
	var opMallet = function() {
		var el;
		return {
			x:560,
			y:148,
			update : function () {
				el.setStyles({'left':opMallet.x/4-14,'top':opMallet.y/4 - 14});
			},
			init: function () {
				el = $('opmallet');
				el.setStyles({'left':126,'top':25});
				opMallet.x = 560;
				opMallet.y = 148;
			}
		};
	}();
	var myMallet = function() {
		var myx;
		var myy;
		var el;
		var mminplace = false;
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
					if (myMallet.dx != 0 || myMallet.dy != 0)el.setStyles({'left':myx-areaPosition.x-14,'top':myy-areaPosition.y-14});
				}
			},
			reset: function() {
				el.removeEvents('mouseover');
			},
			init: function () {
				el = $('mymallet');
				el.setStyles({'left':112,'top':235});
				el.addEvent('mouseover',function(e) {
					e.stop();
					myx = e.page.x;
					myy	= e.page.y;
					held = true;
					if(!mminplace) {
						$('tablesurround').addEvent('mousemove',function(e) {
							myx = e.page.x;
							myy	= e.page.y;
						});
						mminplace = true;
					}
				});
				areaPosition = $('myarea').getPosition();
				myMallet.x = 560;
				myMallet.y = 2252;
				myMallet.dx = 0;
				myMallet.dy = 0;
				msCount = 1;
			}
		};
	}();
	var puck = function() {
		var ht;
		var el;
		return {
			x:560,
			y:1200,
			dx:0,
			dy:0,
			calculate: function (p) {
				var c = false;
				p.x = p.x + p.dx;
				p.y = p.y +p.dy;
				do {
					if (p.x < 41 ) {
						p.x = 82 - p.x;
						p.dx = -(p.dx * 0.96);
						c = true;
					} else {
						if (p.x > 1079) {
							p.x= 2158 - p.x;
							p.dx = -(p.dx * 0.96);
							c=true;
						} else {
							c=false;
						}
					}
				} while (c);
				p.dx = 0.99 * p.dx;
				do {
					if (p.y < 41 ) {
						p.y = 82 - p.y;
						p.dy = -(p.dy * 0.96);
						c=true;
					} else {
						if (p.y > 2359) {
							p.y= 4718 - p.y;
							p.dy = -(p.dy * 0.96);
							c=true;
						} else {
							c=false;
						}
					}
				} while (c);
				p.dy = 0.99 * p.dy;
				return p;
			},
			tick: function () {
				var p = puck.calculate(puck);
				puck.x = p.x;
				puck.y = p.y;
				puck.dx = p.dx;
				puck.dy = p.dy;
				if (puck.dx != 0 || puck.dy != 0) el.setStyles({'left':puck.x/4-10,'top':puck.y/4-10});
				if (puck.y > 1200 ) {
					//puck is in my half so count down
					if (ht == 0) {
						// if not already set up, set up counter;
						ht = t.myside;
						setCounter(ht);
					}
					if (--secs <= 0) {
						secs = t.second;
						setCounter(--ht);
						if (ht <= 0 ) foul('Puck too long on My Side');
					}
				} else {
					if (ht != 0) {
						secs = t.second;
						setCounter(-1);
						ht = 0;
					}
				}
			},
			init: function () {
				el=$('puck');
				ht=t.myside;
				secs=t.second;
				puck.x = 560;
				puck.y = 1200;
				puck.dx = 0;
				puck.dy = 0;
				el.setStyles({'left':130,'top':290});
			}
		}
	}();
	
	var timeOffset;
	var t;				//object holding various timer values

	var inPlay = false; //Set once it is allowed to hit the puck
	var inSync = false; //Set once we are in sync with other side (soo we can start sending our mallet position)
	var startC = 0; //countdown time to start game
	var firstSec = 0; //used to sync sides by counting server time to start.
	var msCount;
	var commsTo = 0;  //comms timeout

	var tKid = null;
	var tick = function() {
		var collisionOccured = false;
		myMallet.tick();
		puck.tick();
		//check for collision
		var dx = puck.x - myMallet.x;
		var dy = puck.y - myMallet.y;
		if ((Math.abs(dx) < 94) && (Math.abs(dy) < 94) ) { 
			//might have hit worth doing the more complex calculation
			if( (dx*dx + dy*dy) < 8836) {
				// Collision Occurred
				var d2 = Math.sqrt(dx*dx+dy*dy); //keep earlier distance
				dx += myMallet.dx - puck.dx;  //step back to previous tick (in case centres have passed)
				dy += myMallet.dy - puck.dy;
				d = Math.sqrt(dx*dx+dy*dy);
				var cos_t = dx/d; //cos theta where theta angle of normal to x axis
				var sin_t = dy/d; //sin theta where theta angle of normal to x axis
				if (d2 < 94) {
					d2 = 2*(94-d2);
					puck.x += d2*cos_t;
					puck.y += d2*sin_t;
				}
				var mvn = myMallet.dx*cos_t + myMallet.dy * sin_t;  //mallet velocity along normal
				var pvn = puck.dx*cos_t + puck.dy*sin_t;  //puck velocity normal
				var pvt = puck.dx*sin_t + puck.dy*cos_t;  //puck velicity tangent

				var pvn2 = 2*mvn - pvn; //puck normal after meeting mallet
				puck.dx = pvn2*cos_t + pvt*sin_t; //translate back to x and y velocities
				puck.dy = pvn2*sin_t + pvt*cos_t;
				// send model details as they are after the collision
				collisionOccured = true;
				if (!inPlay) foul('Puck played before time');
			}
		}
		if (inSync) {
			if (--msCount <= 0) {
				msCount = t.mallet;
				// only send my models details if haven't just done so
				Comms.write(((collisionOccured)?'C':'M')+':'+myMallet.x+':'+myMallet.y+':'+puck.x+':'+puck.y+':'+puck.dx+':'+puck.dy
						+':'+(new Date().getTime() + timeOffset),null);
			} else {
				if(collisionOccured) Comms.write('C:'+myMallet.x+':'+myMallet.y+':'+puck.x+':'+puck.y+':'+puck.dx+':'+puck.dy
						+':'+(new Date().getTime() + timeOffset),null);
			}
		}

		if (firstSec > 0) {
			if((new Date().getTime() + timeOffset) >= firstSec) {
				firstSec += 1000;
				if (startC > 0 ) {
					setCounter(--startC);
					if(startC <=0) {
						inPlay = true;
						firstSec = 0;
						startC = 0;
					}
				} else {
					startC = t.startup;
					setCounter(startC);
				}
			}
		}
		if (commsTo > 0) if(--commsTo <=0) Comms.die();
		
	}
	var restart = function () {
		$clear(tKid);	//stop model
		myMallet.reset();
		inPlay = false;
		inSync = false;
		awaitOpponent.delay(t.restart);
	};
	var foul = function (msg) {
		setState(msg);
//		Comms.write('F',restart);

	};
	var awaitOpponent = function () {

		inSync = false;
		opMallet.init();
		myMallet.init();
		puck.init();
		firstSec = 0;
		startC = 0;
		commsTo = t.opponent;
		tKid = tick.periodical(t.tick);
		if (master) {
			Comms.write('S',startGame);
		} else {
			Comms.read(startGameS);
		}
	};
	
	var startGameS = function(time,msg) {
		if (msg == 'S') {
			startGame(time);
		} else {
			awaitOpponent();
		}
	};	

	var startGame = function (time) {
		setState('Start');
		inSync = true;
		firstSec = time + 1000;
		Comms.read.delay(1,Comms,eventReceived);
	};

	var eventReceived = function (time,msg) {
		var splitMsg = msg.split(':');
		var ti,aj,mt;
		var ho,hm;
		commsTo = t.timeout;
		switch (splitMsg[0]) {
			case 'F':
			case 'R' :
				awaitOpponent();
				break;
			case 'C' :
			case 'M' :
				var p = {x:splitMsg[3].toInt(),y:2400 - splitMsg[4].toInt(),dx:splitMsg[5].toInt(),dy:-splitMsg[6].toInt()};
				ti = splitMsg[7].toInt();
				mt = new Date().getTime() + timeOffset
				aj = (mt -ti)/t.tick | 0;
				//calculate where I think the puck should be based on the time
				for( i=0;i<aj;i++) {
					p=puck.calculate(p);
				}
				
				if (splitMsg[0] == 'M') {
					// lets work out a percentage of contribution from each of us
					hm=(puck.y+p.y)/4800;
					ho=1-hm;
					
					puck.x=hm*puck.x+ho*p.x;
					puck.y=hm*puck.y+ho*p.y;
					puck.dx=hm*puck.dx+ho*p.dx;
					puck.dy=hm*puck.dy+ho*p.dy;
				} else {
					//collisions we have to believe him because it is major change
					puck.x = p.x;
					puck.y = p.y;
					puck.dx = p.dx;
					puck.dy = p.dy;
				}
				opMallet.x = splitMsg[1].toInt();
				opMallet.y = 2400 - splitMsg[2].toInt(); //its at the opposite end of the table
				opMallet.update();		//Move it on screen
				break;
			default :
				setState('Invalid Message:'+msg);
		}
		if (inSync) Comms.read.delay(1,Comms,eventReceived); //Just ensure the current read request completes before restarting it
	};

	var commsError = function () {
		setState('Comms Timout Failure');
		$clear(tKid);
	};
	
	return {
		init: function (me,ma,timers) {
			var timeReq = function() {
				startTime = new Date().getTime();
				req.post(myParams);; //ensure we actually do the request, so its not using cached result
			};	
			myParams = {pid:me.uid,pp:me.password};
			myname = me.name;
			t = timers;
			t.second = (1000/t.tick) | 0
			master = ma;
			Comms.init(ma,commsError);
			tablePosition = $('table').getPosition();
			var startTime;
			var totalOffset = 0;
			var i = t.count;
			var req = new Request.JSON({url:'time.php',onComplete: function(response,errorstr) {
				if (response ) {
					var endTime = new Date().getTime();
					var commsTime = endTime - startTime;
					var midTime = parseInt(startTime+ commsTime/2);
					var offsetTime = response.servertime - midTime;
					totalOffset += offsetTime;
					if (--i > 0 ) {
						timeReq.delay(50);  //delay, otherwise of fast link it doesn't have time to exit this routing before re entering
					} else {
						timeOffset = totalOffset/t.count;
						setState('Awaiting Opponent');
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
