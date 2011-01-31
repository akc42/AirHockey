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
		},els.puck,{x:560,y:1200,dx:0,dy:0});
		this.myMallet = new myMallet(els,positions.mymallet);
		if(els.table) els.table.addEvent('click',function(e) {
			e.stop();
			if(that.myServe) {
				var mp ={y: 2400-(e.page.x - els.table.getPosition().x)*4,x:(e.page.y - els.table.getPosition().y)*4}; // convert to internal co-ordinates
				if(mp.y > 1200) {
				//Make sure we are on the table and on my side				
					mp.x = Math.max(41,Math.min(mp.x,1079));
					mp.y = Math.max(1241,Math.min(mp.y,2359));
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
				if ((x*x + y*y) < 8836 || (t > 0 && t < timeSince && ((x-dx*t)*(x-dx*t)+(y-dy*t)*(y-dy*t)) < 8836 )) {
					this.links.play('mallet');
					// Collision Occurred
					if (!this.inP) {
							// we hit the puck before we were supposed to
							this.links.match.tFoul('Puck played too early');
					} else {
						if (this.puck.y < 1159 && this.opmallet.y < 1147 || this.myMallet.y < 1094) {
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
							if (d2 < 94) {
								d2 = 2*(94-d2);
								this.puck.x += d2*cos_t;
								this.puck.y += d2*sin_t;
							}
							var mvn = this.myMallet.dx*cos_t + this.myMallet.dy * sin_t;  //mallet velocity along normal
							pvn = this.puck.dx*cos_t + this.puck.dy*sin_t;  //puck velocity normal
							pvt = this.puck.dx*sin_t - this.puck.dy*cos_t;  //puck velicity tangent

							var pvn2 = 2*mvn - pvn; //puck normal after meeting mallet
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
		this.myMallet.drop();
	},
	place: function (position) {
		this.ontable = true;
		this.puck.place(position);
		this.myMallet.hold();
	},
	halt: function () {
		this.ontable = false;
		this.puck.remove();
		this.inP = false;
		this.myServe = false;
		this.myMallet.drop();
		this.myMallet.hold(); //but I am allowed to pick up the mallet again (prevented during serving)
		this.transition();
	},
 	update:function(firm,mallet,puck,time) {
		var hm,ho;
		this.opmallet.update(mallet);
		if(puck) {
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
		  		this.links.scoreboard.foul(false);
				this.links.scoreboard.status('');
	  		} else {
		  		if (this.ontable) {
		  		// lets work out a percentage of contribution from each of us
					hm=(this.puck.y+p.y)/4800;
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
		if(this.puck.y <= 1200 || !this.ontable) {
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
		if (this.el) this.el.setStyles({'top':this.x/4 - 14,'right':this.y/4 -14});
		return this;
	}
});

var myMallet = new Class({
	Extends:opMallet,
	initialize: function(els,position) {
		var that = this;
		this.parent(els.mymallet,position);
		if(els.table) this.table = els.table.getPosition();
		this.serve = false;
		this.held = false;
		this.mp.x = this.x;
		this.mp.y = this.y;
		this.els = els;
		if(this.el) this.el.addEvent('mouseover',function(e) {
			var setMalletPosition = function(e) {
				that.mp.x = (e.page.y - that.table.y)*4;
				that.mp.y = 2400-(e.page.x - that.table.x)*4;
				if (that.mp.x < 0 || that.mp.y < 0) {
					return false;
				} else {
					if (that.mp.x > 1120 || that.mp.y > 2400) {
						return false;
					}
				}
				that.mp.x=Math.max(53,Math.min(that.mp.x,1067));
				that.mp.y=Math.max(53,Math.min(that.mp.y,2347));
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
		this.serve = false; //cant hold during serving
	}
	
});

var SimplePuck = new Class({
	initialize:function (p) {
		this.set(p);
		this.side = (this.y > 1200)?1:(this.y<1200)?-1:0;
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
			return (that.y-41)-m()*(that.x-41);
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
			if (this.y <= 1200) s=true;
			if (this.x < 41) {
				hit=true;
				t = 2;
				if (this.y < 41) {
					if ( c() > 0) {
						//we hit the side first
						this.x = 82-this.x;
						this.dx = - (this.dx*0.96);
					} else {
						this.y = 82 - this.y;
						this.dy = - (this.dy*0.96);
					}
				} else {
					if (this.y > 2359) {
						if (c() < 2318) {
							//hit the side first
							this.x = 82-this.x;
							this.dx = - (this.dx*0.96);
						} else {
							x = this.x - (this.y-2359)/m();
							if (x > 380 && x < 740) {
								t = 6; //goal scored
								hit = false; //no need to carry on
							}
							this.y= 4718 - this.y;
							this.dy = -(this.dy * 0.96);
						}
					} else {
						this.x = 82-this.x;
						this.dx = - (this.dx*0.96);
					}
				}
			} else {
				if(this.x > 1079) {
					hit = true;
					t=2;
					y = m()*1038+c(); //where it meets the side
					if(this.y < 41) {
						if (y > 0) {
							//hit the side first
							this.x= 2158 - this.x;
							this.dx = -(this.dx * 0.96);
						} else {
							this.y = 82 - this.y;
							this.dy = - (this.dy*0.96);
						}
					} else {
						if ( this.y > 2359) {
							if (y < 2318) {
								//hit the side first
								this.x= 2158 - this.x;
								this.dx = -(this.dx * 0.96);
							} else {
								x = this.x - (this.y-2359)/m();
								if (x > 380 && x < 740) {
									t = 6; //goal scored
									hit = false; //no need to carry on
								}
								this.y= 4718 - this.y;
								this.dy = -(this.dy * 0.96);
							}
						} else { 	
							this.x= 2158 - this.x;
							this.dx = -(this.dx * 0.96);						}
					}
				} else {
					if (this.y < 41) {
						hit= true;
						t=2;
						this.y = 82 - this.y;
						this.dy = - (this.dy*0.96);
					} else {
						if (this.y > 2359) {
							hit = true;
							t=2;
							x = this.x - (this.y-2359)/m();
							if (x > 380 && x < 740) {
								t = 6; //goal scored
								hit = false; //no need to carry on
							}
							this.y= 4718 - this.y;
							this.dy = -(this.dy * 0.96);
						}
					}
				}
			}
		} while (hit) ;	
		dn *= 0.9995;
		this.dx *= dn;
		this.dy *= dn;
		var news = (this.y > 1200)?1:(this.y<1200)?-1:0;
		if (t!=6 && (this.side != news || (s && this.y>1200 ))) t++;
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
		this.side = (this.y > 1200)?1:(this.y<1200)?-1:0;
		if(this.el) this.el.removeClass('hidden');
		this.update();
		this.links.play('mallet'); //mallet sound as place on table (or will get this from comms saying hit occurred)
	},
	remove: function() {
		if(this.el) this.el.addClass('hidden');
	},
	update: function() {
		if (isNaN(this.x) || isNaN(this.y) ) {
			this.x = 560;
			this.y = 1200;
			this.dx = 0;
			this.dy = 0;
		}
		if(this.el) this.el.setStyles({'top':this.x/4 - 10,'right':this.y/4 -10});
	}
	
});


