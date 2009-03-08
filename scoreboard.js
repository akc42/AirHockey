var Scoreboard = new Class({
	initialize: function(mid,startTime,me,master,els,play) {
		this.params = {m:mid,g:1,h:0,a:0};
		$extend(this.params,me);
		this.game = els.firstgame;
		this.startTime = startTime;
		this.master = master;
		this.els = els;
		this.play = play;
		var updateDuration = function() {
			var myDate = new Date(new Date().getTime() - this.startTime*1000);
			var min = myDate.getMinutes();
			min = min + "";
			min = (min.length == 1)?'0'+min:min;
			var secs = myDate.getSeconds();
			secs = secs + "";
			secs = (secs.length == 1)?'0'+secs:secs;
			this.els.duration.set('text',myDate.getHours()+':'+min+':'+secs);
		};
		this.duration = updateDuration.periodical(1000,this);
		if(mid != 0) {
			//not a practice
			this.updateMatchReq = new Request.JSON({url:'match.php',link:'chain',onComplete:function(response,errstr) {
				if(response) {
					var x = 1;
				}else{
					els.message.appendText(errstr);
				}
			}});
		}
		this.countdown = null;
		this.n = -1;
	},
	endMatch: function() {
		this.duration = $clear(this.duration);
		this.countdown = $clear(this.countdown);
		if(this.params.m != 0 && this.master) {
			this.params.g = 0;  //special flag to say end the game
			this.updateMatchReq.post(this.params);
		}
	},
	abandonMatch: function () {
		this.duration = $clear(this.duration);
		this.countdown = $clear(this.countdown);
		if (this.params.m !=0) {
			this.params.g = -1;
			this.updateMatchReq.post(this.params);
		}
		this.status('Match Abandoned');
	},
	score: function (me) {
		if((me && this.master) || !(me || this.master)) {
			this.params.h++;
		} else {
			this.params.a++;
		}
		var h = this.game.getFirst();
		h.set('text',(this.master)?this.params.h:this.params.a);
		var a = h.getNext();
		a.set('text',(this.master)?this.params.a:this.params.h);
		if(this.master && this.params.m != 0) 	this.updateMatchReq.post(this.params);
	},
	newGame: function() {
		var d = new Element('div',{'class':'game'}).inject(this.game,'after');
		var p = new Element('div',{'class':'score','text':0}).inject(d);
		p = new Element('div',{'class':'score','text':0}).inject(d);
		this.game = d;
		this.params.h=0;
		this.params.a=0;
		this.params.g++;
	},
	serve: function(s) {
		if(s) {
			this.els.server.set('html','<img src="serve.gif" alt="my serve" />');
		} else {
			this.els.server.set('html','');
		}
	},
	foul: function(s) {
		if(s) {
			this.els.server.set('html','<img src="foul.gif" alt="my foul" />');
		} else {
			this.els.server.set('html','');
		}
	},
	status: function(msg) {
		this.els.state.set('text',msg);
	},
	faceoff: function(s) {
		if(s) {
			this.els.faceoff.set('text','Won FaceOff');
		} else {
			this.els.faceoff.set('text','Lost FaceOff');
		}
	},
	set: function(n,callback) {
		var that = this;
		var counter = function() {
			this.n--;
			if (this.n < 0) {
				this.els.countdown.set('text','');
				this.countdown = $clear(this.countdown);
			} else {
				this.els.countdown.set('text',this.n);
				if (this.n == 0) {
					this.play('start');
					callback();
				} else {
					this.play('count');
				}
			}
		};
		this.countdown = $clear(this.countdown);
		this.n = n;
		this.countdown = counter.periodical(1000,this);
		this.els.countdown.set('text',this.n);
	},
	cancel: function() {
		this.countdown = $clear(this.countdown);
		this.n = -1;
		this.els.countdown.set('text','');
	}
});

