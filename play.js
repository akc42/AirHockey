var Play = new Class({
	initialize: function(mid,startTime,me,oid,master,timers,els) {
		var play = function(sound) {
			if(soundReady) soundManager.play(sound);
		}
		this.match = new Match(this.table,this.opponent,this.scoreboard,timers,play);
		this.table = new Table(this.match,this.opponent,scoreboard,timers,els,play);
		this.scoreboard = new Scoreboard(mid,startTime,me,master,els,play);
		//this needs to be last, as it starts everything off - the rest has to be set up before it
		if (mid == 0) {
			//this is a practice
			this.opponent = new Practice(timers,this.match,this.table);
			els.opmallet.addClass('hidden'); // hide other mallet
		} else {
			this.opponent = new Opponent(me,oid,master,timers,this.match,this.table,els);
		}
		els.abandon.addEvent('click', function(e) {
			e.stop();
			this.match.abandon();
			window.location.assign('index.php');
		});
	},
	end: function() {
		this.match.end();
	}
});

var Practice = new Class({
//'my' in this class refers to the opponent, which I am simulating
	initialize: function(timers,match,table) {
		this.timers = timers;
		this.match = match;
		this.table = table;
		this.scorer = new Scorer({score:function(b){},game:function(b){},match:function(b){}});
		this.match.start(1000);  //start in one second
		this.ontable=this.myside.periodical(5000);
	},
 	hit: function(mallet,puck) {
		return; //practice, do nothing
	},
	goalFor : function() {
		$clear(this.ontable);
		if(this.scorer.goalAgainst()) this.foul();  //remember I am back to front
		this.match.goal();  //simulate me scoring
	},
	goal: function() {
		$clear(this.ontable);
		if(this.scorer.goalFor()) this.foul();
	},
	foul: function () {
		//simulate me serving and then hitting puck
		this.d1=this.myserve.delay(3000);
	},
	serve: function (puck) {
		this.ontable=this.myside.periodical(5000);
	},
	faceoff: function () {
		this.scorer.faceoffOp();
	},
	end: function () {
		$clear(this.d1);
		$clear(this.ontable);
	},
	myside: function() {
		var reply = this.table.getUpdate();
		if(reply.puck.y < 1159) {
			//puck is my side and out of reach players mallet
			if (abs(reply.puck.d.y) < 5) {
				//going slowly
				if(this.scorer.faceoffMe()) this.match.faceoff(); //claim it
				this.table.update(true,[560,148],[reply.puck.x,reply.puck.y],[random(-40,40),40],0);
			}
		}
	},
 	myserve: function() {
		this.match.serve(new Duple([560,250]));
		this.ontable=this.myside.periodical(5000);
	}		
});

var Match = new Class({
	initialize: function(table,opponent,scoreboard,timers,play) {
		this.table = table;
		this.opponent = opponent;
		this.scoreboard = scoreboard;
		this.timers = timers;
		this.play = play;
		this.scorer = new Scorer({
			score: function(me) {
				this.scoreboard.score(me);
			},
			game: function(me) {
				this.scoreboard.score(me);
				this.scoreboard.newGame();
			},
			match: function(me) {
				this.scoreboard.score(me);
				this.scoreboard.endMatch();
			}
		});
	},
	start: function(wait) {
		var doStart = function() {
			this.scoreboard.status('Start Match');
			this.scoreboard.set(timers.startup, this.table.inPlay);
		};
		this.startDelay = doStart.delay(wait,this);
	},
	serve: function(position) {
		this.table.place(position);
	},
	served: function (position) {
		this.scoreboard.cancel(); //stop any serve timeout
		this.opponent.serve(position);
		this.scoreboard.set(timers.inplay, this.table.inPlay);
		this.scoreboard.serve(false);
	}
	abandon: function() {
		this.opponent.end();
		this.scoreboard.abandonMatch();
		this.end();
	},
	end: function () {
		$clear(this.startDelay);
		this.table.halt();
		this.scoreboard.cancel();
		this.scoreboard.status('Opponent Abandoned Match');
	},
	inControl: function () {
		if(this.scorer.faceoffMe()) {
			this.scoreboard.faceoff(true);
			this.opponent.faceoff();
		}
	},
	faceoff: function () {
		if(this.scorer.faceoffOp()) this.scoreboard.faceoff(false);
	},
	tFoul: function(msg) {
		this.table.halt();
		this.play('foul');
		this.scoreboard.cancel();
		this.scoreboard.status(msg);
		this.opponent.foul();
	},
	foul: function() {
		this.table.halt();
		this.play('foul');
		this.scoreboard.status('Opponent Foul');
		this.requestServe();
	},
	requestServe: function() {
		this.scoreboard.serve(true);
		this.scoreboard.set(timers.restart,function () {
			this.scoreboard.serve(false);
			this.tFoul('You took too long to serve');
		});
	},
	goalAgainst: function() {
		this.table.halt();
		this.play('goal');
		this.scoreboard.status('Opponent Scored');
		this.opponent.goal();
		if(this.scorer.goalAgainst()) {
			this.requestServe();
		}
	},
	goal: function() {
		this.table.halt();
		this.play('goal');
		this.scoreboard.status('GOAL !!!!!!');
		if(this.scorer.goalFor()) {
			this.requestServe();
		}
	}
});

var Scorer = new Class({
	initialize: function(callbacks) {
		this.awaitingFaceOff = true;
		this.myscore = 0;
		this.mygames = 0;
		this.opscore = 0;
		this.opgames = 0;
		this.callbacks = callbacks;
	},
	goalFor: function() {
		if(this.awaitingFaceoff) {
			this.myFaceoff = true;
			this.awaitingFaceoff = false;
		}
		this.myscore++;
		if(this.myscore >= 7) {
			this.opscore = 0;
			this.myscore = 0;
			this.mygames++;
			if(this.mygames < 4) {
				this.callbacks.game(true);
				if (this.myFaceoff) {
					if ((this.opgames+this.mygames)%2 == 1) return true;
				} else {
					if ((this.opgames+this.mygames)%2 == 0) return true;
				}
			} else {
				this.callbacks.match(true);
			}
		} else {
			this.callbacks.score(true);
		return false;
	},
	goalAgainst: function() {
		if(this.awaitingFaceoff) {
			this.myFaceoff = false;
			this.awaitingFaceoff = false;
		}
		this.opscore++;
		if(this.opscore >= 7) {
			this.mygames++;
			this.opscore = 0;
			this.myscore = 0;
			if(this.opgames < 4) {
				this.callbacks.game(false);
				if (this.myFaceoff) {
					if ((this.opgames+this.mygames)%2 == 0) return false;
				} else {
					if ((this.opgames+this.mygames)%2 == 1) return false;
				}
			} else {
				this.callbacks.match(false);
				return false;
			}
		} else {
			this.callbacks.score(false);
		}
		return true;
	},
	faceoffMe: function () {
		if (this.awaitingFaceoff) {
			this.awaitingFaceoff = false;
			this.myFaceoff = true;
			return true;
		}
		return false;
	},
	faceoffOp: function () {
		if (this.awaitingFaceoff) {
			this.awaitingFaceoff = false;
			this.myFaceoff = false;
			return true;
		}
		return false;
	}
});

var Scoreboard = new Class({
	initialize: function(mid,startTime,me,master,els,play) {
		this.params = me;
		this.params.m = mid;
		this.params.g = 1;
		this.params.h = 0;
		this.params.a = 0
		this.game = els.firstgame;
		this.startTime = startTime;
		this.master = master;
		this.els = els;
		this.play = play;
		var updateDuration = function() {
			var myDate = new Date(new Date.getTime() - this.startTime*1000);
			var min = myDate.getMinutes();
			min = min + "";
			min = (min.length == 1)?'0'+min:min;
			var secs = myDate.getSeconds();
			secs = secs + "";
			secs = (secs.length == 1)?'0'+secs:secs;
			this.els.duration.set('text',mydate.getHours()+':'+min+':'+secs);
		};
		this.duration = updateDuration.periodical(1000);
		if(mid != 0) {
			//not a practice
			this.updateMatchReq = new Request.json({url:'match.php',link:'chain',onComplete:function(response,errstr) {
				if(response) {
					var x = 1;
				}else{
					els.message.appendText(errorstr);
				}
			}});
		}
	},
	endMatch: function() {
		$clear(this.duration);
		$clear(this.countdown);
		if(this.mid != 0 && this.master) {
			this.params.g = 0;  //special flag to say end the game
			this.updateMatchReq.post(this.params);
		}
	},
	abandonMatch: function () {
		$clear(this.duration);
		$clear(this.countdown);
		if (this.mid !=0) {
			this.params.g = -1;
			this.updateMatchReq.post(this.params);
		}
	},
	score: function (me) {
		if((me && this.master) || !(me || this.master)) {
			params.h++;
		} else {
			params.a++;
		}
		var h = this.game.getFirst();
		h.set('text',params.h);
		var a = h.getNext();
		a.set('text',params.a);
		if(this.mid != 0) this.updateMatchRequ.post(this.params);
	},
	newGame: function() {
		var d = new Element('div',{'class':'game'}).inject(this.game,'after');
		var p = new Element('div',{'class':'score','text':0}).inject(d);
		p = new Element('div',{'class':'score','text':0}).inject(d);
		this.game = d;
		this.params.h=0;
		this.params.a=0;
		this.params.g++;
		if(this.mid != 0) this.updateMatchRequ.post(this.params);
	},
	serve: function(s) {
		if(s) {
			this.els.serve.set('html','<img src="serve.gif" alt="my serve" />');
		} else {
			this.els.serve.set('html','');
		}
	},
 	status: function(msg) {
		this.els.status.set('text',msg);
	},
	faceoff: function(s) {
		if(s) {
			this.els.faceoff.set('text','Won FaceOff');
		} else {
			this.els.faceoff.set('text','Lost FaceOff');
		}
	},
	set: function(n,callback) {
		var counter = function() {
			n--;
			setCounter(n);
			if (n == 0) {
				callback();
			} else {
				if (n < 0) {
					$clear(this.countdown);
				}
			}
		}
		var setCounter = function(c) {
			els.countdown.set('text', (c < 0)?' ':c);
		}
		this.countdown = counter.periodical(1000);
		setCounter(n);
	},
	cancel: function() {
		$clear(this.countdown);
	}
});

	

var Duple = new Class({
	initialize: function(a) {
		if(a) {
			this.x = a[0];
			this.y = a[1];
		} else {
			this.x = 0;
			this.y = 0;
		}
		return this;
	},
	x:0,
	y:0,
	assign: function(d) {
		this.x = d.x;
		this.y = d.y;
		return this;
	},
	add: function(d) {
		this.x += d.x;
		this.y += d.y;
		return this;
	},
	sub: function(d) {
		this.x -= d.x;
		this.y -= d.y;
		return this;
	},
	mul: function(d) {
		this.x *= d.x;
		this.y *= d.y;
		return this;
	},
	scale: function(s) {
		this.x *= s;
		this.y *= s;
		return this;
	},
	lt: function(d){
		return (this.x < d.x || this.y < d.y);
	},
	gt: function (d) {
		return (this.x > d.x || this.y > d.y);
	},
	limitabove (d) {
		if (this.x < d.x) this.x = d.x;
		if (this.y < d.y) this.y = d.y;
	},
	limitbelow (d) {
		if (this.x > d.x) this.x = d.x;
		if (this.y > d.y) this.x = d.y;
	},
	ar:function () {
		return [this.x,this.y];
	}
});
var opMallet = new Class{{
	Extends: Duple,
	initialize: function(el,position) {
		this.parent(position);
		this.el = el;
		this.update();
		return this;
	},
	update: function(d) {
		if (d) this.assign(new Duple(d));
		el.setStyles({'left':this.x/4 - 14,'top':this.y/4 -14});
		return this;
	}
}};
var myMallet = new Class({
	Extends:opMallet;
	initialize: function(els,position) {
		var that = this;
		this.parent(els.myMallet,position);
		this.table = new Duple().assign(table.getPosition()).scale(4);
		this.serve = false;
		this.held = false;
		this.d = new Duple();
		this.mp = new Duple(); 
		this.el.addEvent('mouseover',function(e) {
			e.stop();
			that.held = true;
			that.update(that.mp.assign(e.page).scale(4).sub(els.table));
			els.tablesurround.addEvent('mousemove',function(e) {
				if (that.held) {
					that.mp.assign(e.page).scale(4).sub(els.table); // convert to internal co-ordinates
					if (that.mp.lt(new Duple([0,1200])){
						that.held = false;
					} else {
						if (that.mp.gt(new Duple([1120,2400])) {
							that.held = false;
						} else {
							that.mp.limitabove(new Duple([53,1200]);
							that.mp.limitbelow(new Duple([1067,2347]);
						}
					}
				}
			});
		});
	},
	tick: function() {
		if(this.held) {
			this.d.assign(this).sub(this.mp); //set velocity from movement over the period
			this.update(this.mp); //update position from where mouse moved it to
		}
	},
 	drop: function() {
		this.held = false;
	}
});

var SimplePuck = new Class({
	Extends:Duple,
	intialize:function (position,delta) {
		this.parent(position);
		this.d = new Duple(delta);
		this.side = (this.y > 1200);
		this.table = table;
	},
	set: function(p) {
		this.assign(p);
		this.d.assign(p.d);
	},
	tick:function() {
		var c = false; //if hit table
		var t = 0;	//0 = no hit,  1 = transition no hit, 2. hit, no transition 3 = transition, hit 4 = goalFor,no transition, 5=goalFor transiation 6 = goalAgainst
		var s = true;
		this.add(this.d);
		//now check
		do {
			if (this.x < 41) {
				this.x =  82 -this.x;
				this.d.x = - (this.d.x*0.96);
				c = true;
				t = 2;
			} else {
				if (this.x > 1079) {
					this.x= 2158 - this.x;
					this.d.x = -(this.d.x * 0.96);
					c=true;
					t=2;
				} else {
					c=false;
				}
			}
		} while (c);
		do {
			if(this.y <= 1200) s = false;
			if (this.y < 41 ) {
				c = true;
				if (t==0) t = 2;
				if(this.x > 380 & this.x < 740) {
					t = 4; //scored a goal for
				}
				this.y = 82 - this.y;
				this.d.y = -(this.d.y * 0.96);
			} else {
				if (this.y > 2359) {
					c = true;
					if (t==0) t = 2;
					if(this.x > 380 && this.x < 740) {
						t = 6; //scored a goal for
					}
					this.y= 4718 - this.y;
					this.d.y = -(this.d.y * 0.96);
				} else {
					c=false;
				}
			}
		} while (c);
		this.d.scale(0.99);
		if(t==6) return 6;
		var news = (this.y>1200);
		if (!(this.side && s && news) && (this.side || news)) t++;
		this.side = news;
		return t;
	}
});
				

var ComplexPuck = new Class({
	Extends: SimplePuck,
	initialize: function(el,position,goalFor,goalAgainst,transition,play){
		var that = this;
		this.parent(position);
		this.el = el;
		el.removeClass('hidden'); //Make Sure
		this.goalFor = goalFor;
		this.goalAgainst = goalAgainst;
		this.transition = transition;
		this.play = play;
		this.update();
	},
	tick: function() {
		var t = this.parent();
		switch (t) {
			case 3:
				this.transition();
			case 2:
				this.play('table');
				break;
			case 5:
				this.transition();
			case 4:
				this.play('table');
				this.goalFor(); 
				break;
			case 6:
				this.play('goal');
				this.goalAgainst();
				return false;
			default:
		}
		this.update();
		return true;
	},
 	place: function(position) {
		this.assign(position);
		this.d = new Duple();
		this.el.removeClass('hidden');
		this.update();
		this.play('mallet'); //mallet sound as place on table (or will get this from comms saying hit occurred)
	},
	remove: function() {
		this.el.addClass('hidden');
	},
	update: function() {
		el.setStyles({'left':this.x/4 - 10,'top':this.y/4 -10});
	}
	
});


var Table = new Class({
	initialize: function(match,opponent,scoreboardtimers,els,play) {
		var transition = function () {
			var control = function() {
				match.inControl();
			};
			var timer;
			if(this.onMyside) {
				scoreboard.cancel();
				this.onMyside = false;
				$clear(timer);
			} else {
				scoreboard.set(timers.myside, function() {
					this.match.tFoul('Puck too long on your side');
				});
				timer = control.delay(timers.control);
				this.onMyside = true;
			}
		}
		this.onMyside = false;
		var that = this;
		this.opmallet = new opMallet(els.opMallet,[560,148]);
		this.puck = new ComplexPuck(els.puck,[560,1200],opponent.goalFor,this.match.goalAgainst,transition);
		this.myMallet = new myMallet(els,[560,2252]);
		els.table.addEvent('click',function(e) {
			e.stop();
			if(that.myServe) {
				var mp = new Duple(e.page).scale(4).sub(els.table); // convert to internal co-ordinates
				mp.limitabove(new Duple([41,41])); //ensure the puck can fit somewhere on the table
				mp.limitbelow(new Duple([1079,2359])); //its the servers fault if he puts it at the other end
				that.puck.place(mp);
				that.myServe = false;
				match.served(puck);
			}
		});
		this.halt();
		this.tick.periodical(timers.tick);
	},
	tick: function () {
		if(this.ontable) {
			mymallet.tick();
			if(puck.tick()) {
				var d1,d2,cos_t,sin_t,pvn,pvt;
				//check for collision with my Mallet
				var d = new Duple().assign(puck).sub(myMallet);
				if ((Math.abs(d.x) < 94) && (Math.abs(d.y) < 94) ) {
					//might have hit worth doing the more complex calculation
					if( (d.x*d.x + d.y*d.y) < 8836) {
						this.play('mallet');
						// Collision Occurred
						d2 = Math.sqrt(d.x*d.x+d.y*d.y); //keep earlier distance
						d.add(myMallet.d).sub(puck.d);  //step back to previous tick (in case centres have passed)
						d1 = Math.sqrt(dx*dx+dy*dy);
						cos_t = dx/d1; //cos theta where theta angle of normal to x axis
						sin_t = dy/d1; //sin theta where theta angle of normal to x axis
						if (d2 < 94) {
							d2 = 2*(94-d2);
							puck.x += d2*cos_t;
							puck.y += d2*sin_t;
						}
						var mvn = myMallet.d.x*cos_t + myMallet.d.y * sin_t;  //mallet velocity along normal
						pvn = puck.d.x*cos_t + puck.d.y*sin_t;  //puck velocity normal
						pvt = puck.d.x*sin_t + puck.d.y*cos_t;  //puck velicity tangent

						var pvn2 = 2*mvn - pvn; //puck normal after meeting mallet
						puck.d.x = pvn2*cos_t + pvt*sin_t; //translate back to x and y velocities
						puck.d.y = pvn2*sin_t + pvt*cos_t;
						// send model details as they are after the collision
						if (!inPlay) {
							
								// we hit the puck before we were supposed to
								this.match.tFoul('Puck played too early');
						} else {
							this.opponent.hit(myMallet,puck);
						}
					}
				}
			} else {
				this.ontable = false;
			}
		}
	},
 	inPlay: function () {
		this.inPlay = true;
	},
 	serve: function () {
		this.myServe = true;
		this.puck.remove();
		this.myMallet.drop();
	},
	place: function (position) {
		this.ontable = true;
		this.puck.place(position);
	},
	halt: function () {
		this.ontable = false;
		this.inPlay = false;
		this.myServe = false;
	},
 	update:function(firm,mallet,puckPosition,puckDelta,ticksBehind) {
		var hm,ho;
		this.myServe = false;
		this.opmallet.update(mallet);
		var p = new simplePuck(puckPosition,puckDelta);
		while (ticksBehind > 0) {
			ticksBehind--;
			p.tick();
		}
		if (firm) {
			this.puck.set(p);
			this.ontable = true;
		} else {
			if (onTable) {
			// lets work out a percentage of contribution from each of us
				hm=(puck.y+p.y)/4800;
				ho=1-hm;
				p.scale(ho);
				puck.scale(hm).add(p);
				p.d.scale(ho);
				puck.d.scale(hm).add(p.d);
				puck.update();
			}
		}
	},
 	getUpdate: function () {
		return {puck:this.puck,mallet:this.myMallet};
	}
});
			
var Opponent = new Class({
	initialize: function(me,oid,master,timers,match,table,els) {
		this.comms = new Comms(me.oid,fail);
		this.master = master;
		this.timers = timers;
		this.match = match;
		this.table = table;
		this.inSync = false;
		var that = this;
		var fail = function() {
			this.match.end();
			$clear(that.poller);
			this.inSync = false;
		};
		var poll = function() {
			var reply = that.table.getUpdate();
			that.comms.write('M:'+reply.mallet.x+':'+reply.mallet.y+':'+reply.puck.x+':'+reply.puck.y+':'+reply.puck.d.x+':'+reply.puck.d.y
							+':'+(new Date().getTime() + timeOffset),null);
		};
		var awaitOpponent = function() {
			if (that.master) {
				that.comms.write('Start',startMatch);
				that.comms.setTimeout(that.timers.opponent);
			} else {
				that.comms.read(startMatchS,that.timers.opponent);
			}
		};
		var startMatchS = function(time,msg) {
			switch (msg) {
				case 'Start':
					startMatch(time);
					break;
				case 'Abandon':
					that.match.end();
					break;
				default:
					awaitOpponent();
			}
		};	
		var startMatch = function (time) {
			that.inSync = true;
			var now = new Date().getTime() + that.timeOffset;
			that.match.start(time+1000 - now);	//we want to start the match from 1 second from when the server told us.
			that.comms.read.delay(1,that.comms,[eventReceived,that.timers.timeout]);
			this.poller = poll.periodical(1000);
		};

		var eventReceived = function (time,msg) {
			var splitMsg = msg.split(':');
			var firm = false;
			switch (splitMsg[0]) {
				case 'O':
					that.match.faceoff();
					break;
				case 'S' :
					that.match.serve(new Duple([splitMsg[1].toInt(),splitMsg[2].toInt]);
					break;
				case 'E' :
					fail(); //use this, as it shuts things down too
					break;
				case 'F' :
					that.match.foul();
					break;
				case 'G' :
					that.match.goal();
					break;
				case 'C' :
					firm = true;
				case 'M' :
					that.table.update(firm,
	 					[splitMsg[1].toInt(),splitMsg[2].toInt()],
	 					[splitMsg[3].toInt(),2400 - splitMsg[4].toInt()],
	 					[splitMsg[5].toInt(),splitMsg[6].toInt()],
	   					((new Date().getTime() + that.timeOffset -splitMsg[7].toInt())/that.timers.tick | 0));
					//calculate where I think the puck should be based on the time
					break;
				default :
					els.message.AppendText('Invalid Message:'+msg);
			}
			that.comms.read.delay(1,that.comms,[eventReceived,that.timers.timeout]); //Just ensure the current read request completes before restarting it
		};

		var startTime;
		var totalOffset = 0;
		var i = timers.count;
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
					timeReq.delay(50);  //delay, otherwise if fast link it doesn't have time to exit this routing before re entering
				} else {
					that.timeOffset = totalOffset/t.count;
					awaitOpponent();
				}
			}
		}});
		timeReq();
	},
	hit: function(mallet,puck) {
		if(this.inSync) this.comms.write('C:'+mallet.x+':'+mallet.y+':'+puck.x+':'+puck.y+':'+puck.d.x+':'+puck.d.y+':'+(new Date().getTime()+timeOffset),null);
	},
	goalFor = function() {
		return;
	},
	end: function() {
		if(this.inSync) this.comms.write('E');
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
	initialize: function(me,oid,fail) {
		var that = this;
		this.me = me;
		this.ropt = {uid:oid}
		this.sopt = {uid:me.user,msg:''};
		this.fail = fail;
		this.sendFunc = null;
		this.readFunc = null;
		this.sendReq = new Request.JSON({url:'send.php',link:'chain',onComplete: function(response) {
			$clear(this.timeout);
			if (that.sendFunc) that.sendFunc(response.time);
		}});
		this.readReq = new Request.JSON({url:'read.php',link:'chain',onComplete: function(response,errorstr) {
			$clear(this.timeout);
			if (response) {
				if (response.ok) {
					if(that.readFunc) that.readFunc(response.time,response.msg);
				} else {
					fail(response.time);
				}
			}
		}});
		this.abortReq = new Request.JSON({url:'abort.php',link:'chain'});
		this.timeout = null;
	},
	read: function (success,time) {
		this.readFunc = success;
		this.readReq.post(this.ropt);
		if(timeout) this.timeout = this.fail.delay(time)
	},
	write: function (msg,success) {
		sendFunc = success;
		this.sopt.msg=msg;
		this.sendReq.post(sopt);
	},
	setTimeout: function (time) {
		this.timeout = this.fail.delay(time);
	},
	die: function () {
		abortReq.post($merge(this.me,{oid:this.me.user}));  //kill off all of my requests
	}
});
