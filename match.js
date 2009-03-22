var Match = new Class({
	initialize: function(links,timers,els) {
		this.links = links;
		links.scoreboard.status('Please wait ...');
		this.timers = timers;
		this.els = els;
		var that = this
		this.matchInProgress = true;
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
				that.end();
				

			}
		});
	},
	start: function(wait) {
		var that = this;
		var inPlay = function () {
			that.links.table.inPlay();
			that.links.table.transition();
		};
		this.links.scoreboard.status('Start Match');
		this.links.scoreboard.set(this.timers.startup,inPlay);
		this.links.table.start();
		this.links.table.place({x:560,y:1200});
	},
	serve: function(position) {
		this.links.table.place(position);
		this.links.table.inPlay();
		this.links.scoreboard.status('');
		this.links.scoreboard.foul(false);
	},
	served: function (position) {
		this.links.scoreboard.cancel(); //stop any serve timeout
		this.links.opponent.serve(position);
	},
	serveConfirmed: function() {
		var that = this;
		var setInPlay = function() {
			that.links.table.inPlay();
			that.links.table.transition();
		};
		this.links.scoreboard.set(this.timers.inplay, setInPlay);
		this.links.scoreboard.serve(false);
	},
	inControl: function () {
		if (!this.scorer.faceoffSet()) {
			this.links.opponent.faceoff();
		}
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
		this.links.scoreboard.cancel();
		this.links.table.halt();
		this.links.opponent.foul(msg);
	},
	foulConfirmed: function (msg) {
		this.links.play('foul');
		this.links.scoreboard.status(msg);
		this.links.scoreboard.foul(true);
	},
	foul: function() {
		this.links.table.halt();
		this.links.scoreboard.cancel();
		this.links.play('foul');
		this.links.scoreboard.status('Opponent Foul');
		this.requestServe();
	},
	goalAgainst: function() {
		this.links.table.halt();
		this.links.scoreboard.cancel();
		this.links.play('goal');
		this.links.opponent.goal();
	},
	goalConfirmed: function() {
		this.links.scoreboard.status('Opponent Scored');
		if(this.scorer.goalAgainst()) {
			this.requestServe();
		}
	},		
	goal: function() {
		this.links.table.halt();
		this.links.scoreboard.cancel();
		this.links.play('goal');
		this.links.scoreboard.foul(false); //clear foul if it was there
		this.links.scoreboard.status('GOAL !!!!!!');
		if(this.scorer.goalFor()) {
			this.requestServe();
		}
	},
	requestServe: function() {
		var that = this;
		this.links.scoreboard.serve(true);
		this.links.scoreboard.set(this.timers.restart,function () {
			that.links.scoreboard.serve(false);
			that.tFoul('You took too long to serve');
		});
		this.links.table.serve();
	},
	end: function() {
		if (this.matchInProgress) {
			$clear(this.startDelay);
			this.links.table.halt();
			this.links.scoreboard.cancel();
			this.links.scoreboard.abandonMatch();
			this.inPlay = false;
			this.matchInProgress=false;
		}
		this.links.opponent.end();
	}
});

