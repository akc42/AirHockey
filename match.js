var Match = new Class({
	initialize: function(links,timers) {
		this.links = links;
		links.scoreboard.status('Please wait ...');
		this.timers = timers;
		var that = this
		this.matchInProgress = true;
		this.scorer = new Scorer({
			faceoff: function (me) {
				that.links.scoreboard.faceoff(me);
				if(me) that.links.opponent.faceoff();
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
			this.serve({x:560,y:1200});
		};
		this.startDelay = doStart.delay(wait,this);
	},
	serve: function(position) {
		this.links.table.place(position);
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
	},
	abandon: function() {
		if (this.matchInProgress) {
			this.links.opponent.end();
			$clear(this.startDelay);
			this.links.table.halt();
			this.links.scoreboard.cancel();
			this.links.scoreboard.abandonMatch();
			this.matchInProgress=false;
		}
	},
	end: function () {
		if(this.matchInProgress) {
			$clear(this.startDelay);
			this.links.table.halt();
			this.links.scoreboard.cancel();
			this.links.scoreboard.status('Opponent Abandoned Match');
			this.matchInProgress = false;
		}
	},
	inControl: function () {
		this.scorer.faceoffMe();
	},
	faceoff: function () {
		this.scorer.faceoffOp();
	},
	tFoul: function(msg) {
		this.links.table.halt();
		this.links.play('foul');
		this.links.scoreboard.cancel();
		this.links.scoreboard.status(msg);
		this.links.scoreboard.foul(true);
		this.links.opponent.foul();
	},
	foul: function() {
		this.links.table.halt();
		this.links.play('foul');
		this.links.scoreboard.status('Opponent Foul');
		this.requestServe();
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
	goalAgainst: function() {
		this.links.table.halt();
		this.links.play('goal');
		this.links.scoreboard.status('Opponent Scored');
		this.links.opponent.goal();
		if(this.scorer.goalAgainst()) {
			this.requestServe();
		}
	},
	goal: function() {
		this.links.table.halt();
		this.links.play('goal');
		this.links.scoreboard.status('GOAL !!!!!!');
		if(this.scorer.goalFor()) {
			this.requestServe();
		}
	}
});

