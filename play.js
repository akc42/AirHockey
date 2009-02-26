MBahplay = function() {
	var myParams;
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
			init: function(uid,oid,fail) {
				sopt = {uid:uid,msg:''}; //always write to my pipe
				ropt =  {uid:oid};  //always read from opponents pipe
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
				abortReq.post($merge(myParams,{oid:ropt.uid}));  //kill off all of my requests
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
					if(myServe) {
						held = false;
					} else {
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
				}
			},
			init: function () {
				var myarea = $('myarea');
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
				myarea.addEvent('click',function(e) {
					e.stop();
					if(myServe) {
						puck.place(4*(e.page.x-tableposition.x),4*(e.page.y-tableposition.y));
						served();
					}
				});
				areaPosition = myarea.getPosition();
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
			calculate: function (p,nogoal) {
				var c = false;
				p.x = p.x + p.dx;
				p.y = p.y +p.dy;
				do {
					if (p.x < 41 ) {
						p.x = 82 - p.x;
						p.dx = -(p.dx * 0.96);
						c = true;
						soundManager.play('table');
					} else {
						if (p.x > 1079) {
							p.x= 2158 - p.x;
							p.dx = -(p.dx * 0.96);
							c=true;
							soundManager.play('table');
						} else {
							c=false;
						}
					}
				} while (c);
				p.dx = 0.99 * p.dx;
				do {
					if (p.y < 41 ) {
						if(!g.practice || p.x <= 380 || p.x >= 740) {
							p.y = 82 - p.y;
							p.dy = -(p.dy * 0.96);
							c=true;
							soundManager.play('table');
						} else {
							c = false;
						}
					} else {
						if (p.y > 2359) {
							if(nogoal || p.x <= 380 || p.x >= 740) {
								p.y= 4718 - p.y;
								p.dy = -(p.dy * 0.96);
								c=true;
								soundManager.play('table');
							} else {
								c = false;
							}
						} else {
							c=false;
						}
					}
				} while (c);
				p.dy = 0.99 * p.dy;
				return p;
			},
			tick: function () {
				if (onTable) {
					var p = puck.calculate(puck);
					if (g.practice) {
						if(p.y < 0) {
							//went in opponents goal, so we have scored
							soundManager.play('goal');
							puck.off();
							goalScoredFor();
						}
						if (p.y > 1200 || abs(p.dx) > 5 ) {
							puck.dx = p.dx; //only update speed if its higher than minumum at opponents end
						}
						if (p.y > 1200 || abs(p.dy) > 5 ) {
							puck.dy = p.dy;
						}
					} else {
						puck.dx = p.dx;
						puck.dy = p.dy;
					}	
					puck.x = p.x;
					if (p.y > 2400) {
						//went in our goal
						soundManager.play('goal');
						puck.off();
						puck.y = 0; //say normal goal
						goalScoredAgainst();  //Go set a new state
					} else {
						if (p.y >= 0) {
							puck.y = p.y;
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
									if (ht = 0 ) {
										foul('Puck on side too long');
										puck.off();
										ht = -1;
									}
								}
							} else {
								if (ht != 0) {
									secs = t.second;
									setCounter(-1);
									ht = 0;
								}
							}
						}
					}
				} 
			},
			off:function () {
				el.addClass('hidden');
				puck.x = 0;
				onTable = false;
			},
			show:function () {
				el.removeClass('hidden');
				el.addEvent('mouseover',function(e) {
					held = true;
			},
			place:function(x,y) {
				if (x < 41 || x> 1079 ||y < 41 || y > 2359 ) return;
				puck.x = x;
				puck.y = y;
				puck.dx = 0;
				puck.dy = 0;
				el.setStyles({'left':puck.x/4-10,'top':puck.y/4-10});
				el.removeClass('hidden');
				onTable = true;
			},
			
			init: function () {
				el=$('puck');
				ht=t.myside;
				secs=t.second;
				puck.place(560,1200);
			}
		}
	}();
	
	var timeOffset;
	var t;				//object holding various timer values
	var g;				//object holding game parameters

	var onTable = false;  //puck is on the table
	var inSync = false; //Set once we are in sync with other side (soo we can start sending our mallet position)
	var inPlay = false; //Set once it is allowed to hit the puck
	var myServe = false; //Set if I have to serve
	var foulOccurred = false;

	var msCount;
	var commsTo = 0;  //comms timeout

	var startT = 0;
	var firstSec = 0; //used to sync sides by counting server time to start.
	var timer = 0; //countdown timer
	var func;
	var startTimer = function(when,howlong,done) {
		firstSec = when;
		timer= 0;
		startT = howlong;
		func=done; //set routine to call when completed;
	};
	var stopTimer = function() {
		firstSec = 0;
		setCounter(-1);
	};
	var tKid = null;
	var previouslyOnTable = true;
	var tick = function() {
		var actionOccured = false;
		if (foulOccurred) actionOccurred = true; //foul happened between ticks from some other source
		myMallet.tick();
		if(onTable) { 
			//only calculate if puck is on the table
			puck.tick();
			if(onTable) { // need to repeat in case it was reset by puck.tick();
				var dx,dy,d,d2,cos_t,sin_t,pvn,pvt;
				if (g.practice) {
					//see if collided with (stationary) opponent mallet
					dx = puck.x - opMallet.x;
					dy = puck.y - opMallet.y;
					if ((Math.abs(dx) < 94) && (Math.abs(dy) < 94) ) { 
						//might have hit worth doing the more complex calculation
						if( (dx*dx + dy*dy) < 8836) {
							soundManager.play('mallet');
							// Collision Occurred
							d2 = Math.sqrt(dx*dx+dy*dy); //keep earlier distance
							dx -= puck.dx;  //step back to previous tick (in case centres have passed)
							dy -= puck.dy;
							if (d2 < 94) {
								d2 = 2*(94-d2);
								puck.x += d2*cos_t;
								puck.y += d2*sin_t;
							}
							pvn = puck.dx*cos_t + puck.dy*sin_t;  //puck velocity normal
							pvt = puck.dx*sin_t + puck.dy*cos_t;  //puck velicity tangent
							puck.dx = pvt*sin_t-pvn*cos_t ; //translate back to x and y velocities
							puck.dy = pvt*cos_t-pvn*sin_t ; // but with reflected velocity in the normal direction
						}
					}
				}
				//check for collision with my Mallet
				dx = puck.x - myMallet.x;
				dy = puck.y - myMallet.y;
				if ((Math.abs(dx) < 94) && (Math.abs(dy) < 94) ) { 
					//might have hit worth doing the more complex calculation
					if( (dx*dx + dy*dy) < 8836) {
						soundManager.play('mallet');
						// Collision Occurred
						d2 = Math.sqrt(dx*dx+dy*dy); //keep earlier distance
						dx += myMallet.dx - puck.dx;  //step back to previous tick (in case centres have passed)
						dy += myMallet.dy - puck.dy;
						d = Math.sqrt(dx*dx+dy*dy);
						cos_t = dx/d; //cos theta where theta angle of normal to x axis
						sin_t = dy/d; //sin theta where theta angle of normal to x axis
						if (d2 < 94) {
							d2 = 2*(94-d2);
							puck.x += d2*cos_t;
							puck.y += d2*sin_t;
						}
						var mvn = myMallet.dx*cos_t + myMallet.dy * sin_t;  //mallet velocity along normal
						pvn = puck.dx*cos_t + puck.dy*sin_t;  //puck velocity normal
						pvt = puck.dx*sin_t + puck.dy*cos_t;  //puck velicity tangent

						var pvn2 = 2*mvn - pvn; //puck normal after meeting mallet
						puck.dx = pvn2*cos_t + pvt*sin_t; //translate back to x and y velocities
						puck.dy = pvn2*sin_t + pvt*cos_t;
						// send model details as they are after the collision
						if (!inPlay) {
							// we hit the puck before we were supposed to
							foul('Puck played too early');
							puck.off();
						}
						actionOccurred = true;
					}
				}
			} else {
				actionOccurred = true;
			}
		} else {
			previouslyOnTable = false;
		}	
		if (inSync) {
			if (--msCount <= 0) {
				msCount = t.mallet;
				if (onTable)
					// Send details
					Comms.write(((actionOccurred)?'C':'M')+':'+myMallet.x+':'+myMallet.y+':'+puck.x+':'+puck.y+':'+puck.dx+':'+puck.dy
							+':'+(new Date().getTime() + timeOffset),null);
					previouslyOnTable = true;
				} else {
					if(actionOccurred) {
						Comms.write(((foulOccurred)?'F':'G')+':'+myMallet.x+':'+myMallet.y+':'+(new Date().getTime() + timeOffset),null);
					}
				}
			} else {
				if(actionOccurred) {
					if(onTable) {
						Comms.write('C:'+myMallet.x+':'+myMallet.y+':'+puck.x+':'+puck.y+':'+puck.dx+':'+puck.dy
						+':'+(new Date().getTime() + timeOffset),null);
					} else {
						Comms.write(((foulOccurred)?'F':'G')+':'+myMallet.x+':'+myMallet.y+':'+(new Date().getTime() + timeOffset),null);
					}
				} 
			}
			if(onTable && !prevouslyOnTable) {
					Comms.write('M'+':'+myMallet.x+':'+myMallet.y+':'+puck.x+':'+puck.y+':'+puck.dx+':'+puck.dy
							+':'+(new Date().getTime() + timeOffset),null);
					previouslyOnTable = true;
			}
		}
		foulOccurred = false;
		// generic countdown timer.  firstSec must be the expected time of the first second, timer = seconds to count down
		if (firstSec > 0) {
			if((new Date().getTime() + timeOffset) >= firstSec) {
				firstSec += 1000;
				if (timer > 0 ) {
					setCounter(--timer);
					if(timer <=0) {
						timer = -1;
						soundManager.play('start');
						func();
					} else {
						soundManager.play('count');
					}
				} else {
					if (timer == 0) {
						timer = startT;
						setCounter(timer);
					} else {
						setCounter(-1);
						firstSec = 0;
					}
				}
			}
		}
		if (commsTo > 0) if(--commsTo <=0) Comms.die();
	
	}

	var setServe = function() {
		var div = $('serve')
		div.set('html','<img src="serve.gif" alt="my serve" />');
		inPlay = false;
		myServe = true;
		startTimer(new Date().getTime()+500,t.restart,function() {
			div.set('html','');
			myServe = false;
			foul('failed to serve in time');
		});
	};
	var served = function() {
		stopTimer();
		$('serve').set('html','');
		myServe = false;
		startTimer(new Date().getTime()+500,1,function(){ inPlay = true;});
	};
	
	var foul = function (msg) {
		setState(msg);
		onTable = false;
		foulOccurred = true; //signal to comms
		if(g.practice) setServe();  //practicers need to re-serve themselves.
	};

	var goalScoredFor() {
		onTable = false;	
	};

	var goalScoredAgainst() {
		onTable = false;
	}
	var startPractice=function('time') {
		CommsTo = 0; //don't want a comms timeout set
		startModel();
		startMatch(time);
	};

	var startModel = function() {
		opMallet.init();
		myMallet.init();
		puck.init();
		firstSec = 0;
		tKid = tick.periodical(t.tick);
	};
			
	var awaitOpponent = function () {
		setState('Awaiting Opponent');
		inSync = false;
		commsTo = t.opponent;
		startModel();
		if (g.master) {
			Comms.write('Start',startMatch);
		} else {
			Comms.read(startMatchS);
		}
	};
	
	var startMatchS = function(time,msg) {
		switch (msg) {
			case 'Start':
				startMatch(time);
				break;
			case 'Abandon':
				setState('Match Abandoned');
				startTimer(time+1000,t.index,returnToMain);
				break;
			default:
				awaitOpponent();
		}
	};	

	var startMatch = function (time) {
		setState('Start');
		startTimer(time + 1000,t.startup,function(){inPlay = true});
		if(!g.practice) {
			inSync = true;
			Comms.read.delay(1,Comms,eventReceived);
		}
	};

	var eventReceived = function (time,msg) {
		var splitMsg = msg.split(':');
		var ti,aj,mt;
		var ho,hm;
		commsTo = t.timeout;
		switch (splitMsg[0]) {
			case 'F':
				setServe();  //Other side fouled - so now my serve
				break;
			case 'G' :
				goalScoredFor();
				break;
			case 'C' :
				soundManager.play('mallet');
			case 'M' :
				var p = {x:splitMsg[3].toInt(),y:2400 - splitMsg[4].toInt(),dx:splitMsg[5].toInt(),dy:-splitMsg[6].toInt()};
				ti = splitMsg[7].toInt();
				mt = new Date().getTime() + timeOffset
				aj = (mt -ti)/t.tick | 0;
				//calculate where I think the puck should be based on the time
				for( i=0;i<aj;i++) {
					p=puck.calculate(p,true);
				}
				
				if (splitMsg[0] == 'M' && onTable) {
					// lets work out a percentage of contribution from each of us
					hm=(puck.y+p.y)/4800;
					ho=1-hm;
					
					puck.x=hm*puck.x+ho*p.x;
					puck.y=hm*puck.y+ho*p.y;
					puck.dx=hm*puck.dx+ho*p.dx;
					puck.dy=hm*puck.dy+ho*p.dy;
				} else {
					//collisions or he has placed it on table we have to believe him because it is major change
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
		startTimer(new Date().getTime()+1000,t.index,returnToMain);
	};

	var returnToMain = function() {
		window.location.assign('index.php');
	};
	return {
		init: function (me,timers,game) {
			myParams = {user:me.uid,pass:me.password};
			t = timers;
			t.second = (1000/t.tick) | 0 ;
			g = game || {};
			g.practice = me.practice;
			g.el = $('firstgame');
			g.hs = 0;  //Home Score
			g.as = 0;  //Away Score
			
			tablePosition = $('table').getPosition(); //need to DOM to be ready to do this
			if (!g.practice) {
				Comms.init(me.uid.opponent.uid,commsError);
				var startTime;
				var totalOffset = 0;
				var i = t.count;
				var timeReq = function() {
					startTime = new Date().getTime();
					req.post(myParams); 
				};	
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
							awaitOpponent();
						}
					}
				}});
				timeReq();
			} else {
				timeOffset = 0;
				startPractice(new Date().getTime());
			}
		},
		logout: function () {
			Comms.die();
		}
	}
}();
