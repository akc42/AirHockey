var Match = new Class({
	initialize: function(links,timers,els) {
		this.links = links;
		links.scoreboard.status('Please wait ...');
		this.timers = timers;
		this.els = els;
		var that = this
		this.matchInProgress = true;
		this.inPlay = false;
		this.scorer = new Scorer({
			faceoff: function (me) {
				that.links.scoreboard.faceoff(me);
			},
			score: function(me) {
				that.links.scoreboard.score(me);
			},
			game: function(me) {
				that.links.scoreboard.score(me);
				that.links.scoreboard.newGame();
			},
			match: function(me) {
				that.links.scoreboard.score(me);
				that.links.scoreboard.endMatch();
				that.matchInProgress = false;

			}
		});
	},
	start: function(wait) {
		var doStart = function() {
			var that = this;
			var inPlay = function () {
				that.links.table.inPlay();
			};
			this.links.scoreboard.status('Start Match');
			this.links.scoreboard.set(this.timers.startup,inPlay);
			this.links.table.place({x:560,y:1200});
			this.inPlay = true;
		};
		this.startDelay = doStart.delay(wait,this);
	},
	serve: function(position) {
		this.links.table.place(position);
		this.inPlay = true;
		this.links.scoreboard.status('');
	},
	served: function (position) {
		var that = this;
		var setInPlay = function() {
			that.links.table.inPlay();
			that.links.table.transition();
		};
		this.links.scoreboard.cancel(); //stop any serve timeout
		this.links.opponent.serve(position);
		this.links.scoreboard.set(this.timers.inplay, setInPlay);
		this.links.scoreboard.serve(false);
		this.inPlay = true;
	},
	abandon: function() {
		if (this.matchInProgress) {
			this.links.opponent.end();
			$clear(this.startDelay);
			this.links.table.halt();
			this.links.scoreboard.cancel();
			this.links.scoreboard.abandonMatch();
			this.inPlay = false;
			this.matchInProgress=false;
		}
	},
	end: function () {
		if(this.matchInProgress) {
			$clear(this.startDelay);
			this.links.table.halt();
			this.links.scoreboard.cancel();
			this.links.scoreboard.status('Opponent Abandoned Match');
			this.inPlay = false;
			this.matchInProgress = false;
		}
	},
	inControl: function () {
		if (!this.scorer.faceoffSet()) this.links.opponent.faceoff();;
	},
	faceoffConfirmed: function () {
		this.scorer.faceoffMe();
	},
	faceoff: function () {
		if(this.scorer.faceoffSet()) return false;
		this.scorer.faceoffOp();
		return true;
	},
	tFoul: function(msg) {
		if(this.inPlay) {
			this.links.opponent.foul(msg);
		}
	},
	foulConfirmed: function (msg) {
		this.inPlay = false;
		this.links.table.halt();
		this.links.play('foul');
		this.links.scoreboard.cancel();
		this.links.scoreboard.status(msg);
		this.links.scoreboard.foul(true);
	},
	foul: function() {
		if(this.inPlay) {
			this.inPlay = false;
			this.links.table.halt();
			this.links.play('foul');
			this.links.scoreboard.status('Opponent Foul');
			this.requestServe();
			return true;
		}
		return false;
	},
	requestServe: function() {
		var that = this;
		this.links.scoreboard.serve(true);
		this.links.scoreboard.set(this.timers.restart,function () {
			that.links.scoreboard.serve(false);
			that.served({x:560,y:1200}); //simulate a serve followed by a foul so opponent knows
			that.tFoul('You took too long to serve');
		});
		this.links.table.serve();
	},
	goalAgainst: function() {
		if(this.inPlay) {
			this.links.opponent.goal();
		}
	},
	goalConfirmed: function() {
		this.inPlay = false;
		this.links.table.halt();
		this.links.play('goal');
		this.links.scoreboard.status('Opponent Scored');
		if(this.scorer.goalAgainst()) {
			this.requestServe();
		}
	},		
	goal: function() {
		if(this.inPlay) {
			this.inPlay = false;
			this.links.table.halt();
			this.links.play('goal');
			this.links.scoreboard.status('GOAL !!!!!!');
			if(this.scorer.goalFor()) {
				this.requestServe();
			}
			return true;
		}
		return false;
	}
});

