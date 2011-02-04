/*
 	Copyright (c) 2009-2011 Alan Chandler
    This file is part of AirHockey, an real time simulation of Air Hockey
    for playing over the internet.

    AirHockey is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    AirHockey is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with AirHockey (file supporting/COPYING.txt).  If not, 
    see <http://www.gnu.org/licenses/>.

*/
// Coordinates of table and objects related
var TX = 1120;		//Table width (X axis)
var TY = 2400;		//Table length (Y axis)
var PR = 41;		//Puck Size (Radius)
var MR = 53;		//Mallet Size(Radius)
var GW = 360;		//Goal Size
var PX = 4;			//Ratio of Coordinate System to Actual Pixels
var PM = PR+MR;					// distance between puck and mallet centres when just touching
var PM2 = (PM)*(PM);   //Constant - giving square of distance between puck and mallet centres when just touching
var G1 = (TX-GW)/2;		//Calculate goal edges
var G2 = (TX+GW)/2;
var TX2 = TX/2;
var TY2 = TY/2;
var TXP = TX-PR;
var TYP = TY-PR;

var Table = new Class({
	initialize: function(links,timers,els,positions) {
		var that = this;
		this.els = els;
		this.links = links;
		this.opmallet = new opMallet(els.opmallet,positions.opmallet);
		this.puck = new ComplexPuck({
			goalAgainst:function() {that.links.match.goalAgainst();},
			transition:function() {that.transition();},
			play:function(sound) {that.links.play(sound);}
		},els.puck,{x:TX/2,y:TY/2,dx:0,dy:0});
		this.myMallet = new myMallet(els,positions.mymallet);
		if(els.table) els.table.addEvent('click',function(e) {
			e.stop();
			if(that.myServe) {
				var mp ={y: TY-(e.page.x - els.table.getPosition().x)*PX,x:(e.page.y - els.table.getPosition().y)*PX}; // convert to internal co-ordinates
				if(mp.y > TY2) {
				//Make sure we are on the table and on my side				
					mp.x = Math.max(PR,Math.min(mp.x,TXP));
					mp.y = Math.max(TY2+PR,Math.min(mp.y,TYP));
					that.place(mp);
					that.myServe = false;
					that.links.match.served(that.puck);
				}
			}
		});
		this.timers = timers;
		this.timer = null;
		this.halt();
	},
	start: function () {
		this.time = new Date().getTime();
		this.tickId = this.tick.periodical(this.timers.tick,this);
	},
	stop: function () {
		this.tickId = $clear(this.tickId);
	},
	tick: function () {
		var now = new Date().getTime();
		var timeSince = now - this.time;
		this.time = now;
		if(this.ontable) {
			this.myMallet.tick(timeSince);
			if(this.puck.tick(timeSince)) {
				var d1,d2,cos_t,sin_t,pvn,pvt;
				//check for collision with my Mallet
				var x = this.puck.x - this.myMallet.x;
				var y = this.puck.y - this.myMallet.y;
				var dx = this.puck.dx - this.myMallet.dx;
				var dy = this.puck.dy - this.myMallet.dy;
				var t;
				if(dx != 0 || dy !=0) {
						//calculate how long in the past the minimum pass of puck and mallet was
					t = (x*dx + y*dy)/(dx*dx + dy*dy);

				} else {
					t=0;
				}
				//if we are closer than the two radii, or if since the last tick we got closer
				// (this if puck is moving really fast we may have missed it)
				if ((x*x + y*y) < PM2 || (t > 0 && t < timeSince && ((x-dx*t)*(x-dx*t)+(y-dy*t)*(y-dy*t)) < PM2 )) {
					this.links.play('mallet');
					// Collision Occurred
					if (!this.inP) {
							// we hit the puck before we were supposed to
							this.links.match.tFoul('Puck played too early');
					} else {
						//Check if puck is entirely on opponents side and so is opponents mallet, or my mallet is entirely his side
						if ((this.puck.y < (TY2 -PR) && this.opmallet.y < (TY2-MR)) || this.myMallet.y < (TY2 - 2*MR)) {
							this.links.match.tFoul('Invalid Hit - wrong side');
						} else {
							d2 = Math.sqrt(x*x+y*y); //keep earlier distance
							if (t <= 0 || t > timeSince) {
								x -= dx*this.timers.tick;  //step back to previous tick (in case centres have passed)
								y -= dy*this.timers.tick;
							} else {
								x -= dx*(t+10);  //at least 10 milliseconds beyond closest point
								y -= dy*(t+10);
							}
							d1 = Math.sqrt(x*x+y*y);
							if(d1 != 0) {
								cos_t = x/d1; //cos theta where theta angle of normal to x axis
								sin_t = y/d1; //sin theta where theta angle of normal to x axis
							} else {
								cos_t = 1; //got to assume something - 
								sin_t = 0;
							}
							if (d2 < PM) {
								d2 = 2*(PM-d2);
								this.puck.x += d2*cos_t;
								this.puck.y += d2*sin_t;
							}
							var mvn = this.myMallet.dx*cos_t + this.myMallet.dy * sin_t;  //mallet velocity along normal
							pvn = this.puck.dx*cos_t + this.puck.dy*sin_t;  //puck velocity normal
							pvt = this.puck.dx*sin_t - this.puck.dy*cos_t;  //puck velicity tangent

							var pvn2 = Math.min(2*mvn - pvn,this.timers.maxspeed); //puck normal after meeting mallet (although not beyond limit)
							this.puck.dx = pvn2*cos_t + pvt*sin_t; //translate back to x and y velocities
							this.puck.dy = pvn2*sin_t - pvt*cos_t;
							// send model details as they are after the collision
							this.links.opponent.hit(this.myMallet,this.puck,this.time);
							this.links.scoreboard.status('');
						}
					}
				}
			} else {
				this.ontable = false;
			}
		}
	},
 	inPlay: function () {
		this.inP = true;
		this.links.scoreboard.status('Puck in play');
	},
 	serve: function () {
		this.myServe = true;
		this.puck.remove();
		this.myMallet.drop(); //have to serve before I can pick up the mallet again
	},
	place: function (position) {
		this.ontable = true;
		if(position) {
			this.puck.place(position);
		} else {
			this.puck.place({x:TX2,y:TY2});
		}
		this.myMallet.hold();
	},
	halt: function () {
		this.ontable = false;
		this.puck.remove();
		this.inP = false;
		this.myServe = false;
		this.myMallet.drop(); //drops the mallet - but also says can't pick it up again until ...
		this.myMallet.hold(); //... but I am allowed to pick up the mallet again 
		this.transition();
	},
 	update:function(firm,mallet,puck,time) {
		var hm,ho;
		mallet.y = TY-mallet.y;	//need to reflect the fact that the other end is backwards
		this.opmallet.update(mallet);
		if(puck) {
			puck.y = TY-puck.y; //other end backwards
			puck.dy = -puck.dy;
			this.tick(); //ensure this side is up to date
			var p = new SimplePuck(puck);
			var timeBehind = this.time - time;
			if (Math.abs(timeBehind) > 1500) {
				return ;//defense against problem with its size.
			}
			if (timeBehind > 0) {
				p.tick(timeBehind);
			}
			if (firm) {
		  		this.puck.set(p);
				this.puck.update();
				this.ontable = true;
				this.inP = true; //opponent hit the puck, so it must be in play
				this.myServe = false;
				this.myMallet.hold(); //can also pick up the mallet
		  		this.links.scoreboard.foul(false);
				this.links.scoreboard.status('');
	  		} else {
		  		if (this.ontable) {
		  		// lets work out a percentage of contribution from each of us
					hm=(this.puck.y+p.y)/(2*TY);
			  		ho=1-hm;
			  		p.x *= ho;
			  		p.y *= ho;
			  		this.puck.x *=hm;
			  		this.puck.y *=hm;
			  		this.puck.x += p.x;
			  		this.puck.y += p.y;
			  		p.dx *= ho;
			  		p.dy *= ho;
			  		this.puck.dx *= hm;
					this.puck.dy *= hm;
					this.puck.dx += p.dx;
			  		this.puck.dy += p.dy; 
			  		this.puck.update();
				}
			}
		}
	},
 	getUpdate: function () {
		if(this.ontable ) {
			//only send data if on the table
			return {puck:this.puck,mallet:this.myMallet,time:this.time};
		} else {
			return {mallet:this.myMallet};
		}
	},
	transition: function () {
		var that = this;
		var control = function() {
			this.links.match.inControl();
		};
		if(this.puck.y <= TY2 || !this.ontable) {
			this.links.scoreboard.cancel();
			this.timer= $clear(this.timer);
		} else {
			this.links.scoreboard.set(this.timers.myside, function() {
				that.links.match.tFoul('Puck too long on your side');
			});
			this.timer = $clear(this.timer);  //clear in case was already running.
			this.timer = control.delay(this.timers.control,this);
		}
	}
});
			

var opMallet = new Class ({
	initialize: function(el,p) {
		this.x = p.x;
		this.y = p.y;
		this.el = el;
		this.update();
		return this;
	},
	x:0,
 	y:0,
	update: function(d) {
		if (d) {
			this.x = d.x;
			this.y = d.y;
		}
		var a = (this.x - MR)/PX ;
		var b = (this.y-MR)/PX;
		if (this.el) this.el.setStyles({'top':((this.x - MR)/PX).toInt(),'right':((this.y-MR)/PX).toInt()});
		return this;
	}
});

var myMallet = new Class({
	Extends:opMallet,
	initialize: function(els,position) {
		var that = this;
		this.parent(els.mymallet,position);
		this.serve = false;
		this.held = false;
		this.mp.x = this.x;
		this.mp.y = this.y;
		this.els = els;
		if(this.el) this.el.addEvent('mouseover',function(e) {
			var setMalletPosition = function(e) {
				var table = that.els.table.getPosition();
				that.mp.x = (e.page.y - table.y)*PX;
				that.mp.y = TY-(e.page.x - table.x)*PX;
				if (that.mp.x < 0 || that.mp.y < 0) {
					return false;
				} else {
					if (that.mp.x > TX || that.mp.y > TY) {
						return false;
					}
				}
				that.mp.x=Math.max(MR,Math.min(that.mp.x,(TX-MR)));
				that.mp.y=Math.max(MR,Math.min(that.mp.y,(TY-MR)));
				return true;
			}
			e.stop();
			if (setMalletPosition(e)) {
				if (!that.serve) {
					if(!that.held) els.surround.addEvent('mousemove',function(e) {
						if (that.held) {
							if (!setMalletPosition(e)) {
								that.held = false
								els.surround.removeEvents('mousemove');
							}
						}
					});
					that.held = true;
				}
			}
		});
	},
	dx:0,
 	dy:0,
	mp: {},
	tick: function(time) {
		if(this.held) {
			if(time != 0) {
				this.dx = (this.mp.x - this.x)/time; //set velocity from movement over the period
				this.dy = (this.mp.y - this.y)/time;
			} else {
				var x = 1;
			}
			this.update(this.mp); //update position from where mouse moved it to
		}
	},
 	drop: function() {
		this.held = false;
		if(this.els.surround) this.els.surround.removeEvents('mousemove');
		this.serve = true;  //say can't pick up until served.
	},
	hold: function () {
		this.serve = false; //not serving so can hold mallet
	}
	
});

var SimplePuck = new Class({
	initialize:function (p) {
		this.set(p);
		this.side = (this.y > TY2)?1:(this.y<TY2)?-1:0;
	},
	x:0,
	y:0,
	dx:0,
	dy:0,
	set: function(p) {
		this.y = p.y;
		this.x = p.x;
		this.dx = p.dx;
		this.dy = p.dy;
	},
	tick: function(n) {
		var that = this;
		var m = function() {
			return that.dy/that.dx;
		};
		var c = function() {
			return (that.y-PR)-m()*(that.x-PR);
		};
		var x,y;
		var t = 0;
		var dn = (n==1)?1:Math.pow(0.9995,n-1);
		var s = false;
		if(this.dx !=0) {
			this.x += n*dn*this.dx;
		}
		if(this.dy !=0) {
			this.y += n*dn*this.dy;
		}
		do {
			hit = false;
			if (this.y <= TY2) s=true;
			if (this.x < PR) {
				hit=true;
				t = 2;
				if (this.y < PR) {
					if ( c() > 0) {
						//we hit the side first
						this.x = 2*PR-this.x;
						this.dx = - (this.dx*0.96);
					} else {
						this.y = 2*PR - this.y;
						this.dy = - (this.dy*0.96);
					}
				} else {
					if (this.y > TYP) {
						if (c() < (TYP-PR)) {
							//hit the side first
							this.x = 2*PR-this.x;
							this.dx = - (this.dx*0.96);
						} else {
							x = this.x - (this.y-TYP)/m();
							if (x > G1 && x < G2) {
								t = 6; //goal scored
								hit = false; //no need to carry on
							}
							this.y= 2*(TYP) - this.y;
							this.dy = -(this.dy * 0.96);
						}
					} else {
						this.x = 2*PR-this.x;
						this.dx = - (this.dx*0.96);
					}
				}
			} else {
				if(this.x > TXP) {
					hit = true;
					t=2;
					y = m()*(TXP-PR)+c(); //where it meets the side
					if(this.y < PR) {
						if (y > 0) {
							//hit the side first
							this.x= 2*TXP - this.x;
							this.dx = -(this.dx * 0.96);
						} else {
							this.y = 2*PR - this.y;
							this.dy = - (this.dy*0.96);
						}
					} else {
						if ( this.y > TYP) {
							if (y < TYP-PR) {
								//hit the side first
								this.x= 2*TXP - this.x;
								this.dx = -(this.dx * 0.96);
							} else {
								x = this.x - (this.y-TYP)/m();
								if (x > G1 && x < G2) {
									t = 6; //goal scored
									hit = false; //no need to carry on
								}
								this.y= 2*TYP - this.y;
								this.dy = -(this.dy * 0.96);
							}
						} else { 	
							this.x= 2*TXP - this.x;
							this.dx = -(this.dx * 0.96);						}
					}
				} else {
					if (this.y < PR) {
						hit= true;
						t=2;
						this.y = 2*PR - this.y;
						this.dy = - (this.dy*0.96);
					} else {
						if (this.y > TYP) {
							hit = true;
							t=2;
							x = this.x - (this.y-TYP)/m();
							if (x > G1 && x < G2) {
								t = 6; //goal scored
								hit = false; //no need to carry on
							}
							this.y= 2*TYP - this.y;
							this.dy = -(this.dy * 0.96);
						}
					}
				}
			}
		} while (hit) ;	
		dn *= 0.9995;
		this.dx *= dn;
		this.dy *= dn;
		var news = (this.y > TY2)?1:(this.y<TY2)?-1:0;
		if (t!=6 && (this.side != news || (s && this.y>TY2 ))) t++;
		this.side = news;
		return t;
	}
});
				

var ComplexPuck = new Class({
	Extends: SimplePuck,
	initialize: function(links,el,p){
		var that = this;
		this.parent(p);
		this.el = el;
		if (el) el.removeClass('hidden'); //Make Sure
		this.links = links;
		this.update();
	},
	tick: function(n) {
		var t = this.parent(n);
		switch (t) {
			case 1:
				this.links.transition();
				break;
			case 3:
				this.links.transition();
			case 2:
				this.links.play('table');
				break;
			case 5:
			case 4:
				break;
			case 6:
				this.links.goalAgainst();
				return false;
			default:
		}
		this.update();
		return true;
	},
 	place: function(position) {
		position.dy = 0;//ensure it is not moving
		position.dx = 0;
		this.set(position);
		this.side = (this.y > TY2)?1:(this.y<TY2)?-1:0;
		if(this.el) this.el.removeClass('hidden');
		this.update();
		this.links.play('mallet'); //mallet sound as place on table (or will get this from comms saying hit occurred)
	},
	remove: function() {
		if(this.el) this.el.addClass('hidden');
	},
	update: function() {
		if (isNaN(this.x) || isNaN(this.y) ) {
			this.x = TX2;
			this.y = TY2;
			this.dx = 0;
			this.dy = 0;
		}
		if(this.el) this.el.setStyles({'top':(this.x-PR)/PX,'right':(this.y-PR)/PX});
	}
	
});

