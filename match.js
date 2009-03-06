var Match = new Class({
	initialize: function(links,timers,els) {
		this.links = links;
		links.scoreboard.status('Please wait ...');
		this.timers = timers;
		this.els = els;
		var that = this
		this.matchInProgress = true;
this.els.message.appendText('[IN]');
		this.scorer = new Scorer({
			faceoff: function (me) {
				that.links.scoreboard.faceoff(me);
				if(me) that.links.opponent.faceoff();
if(me) that.els.message.appendText('[MF]');
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
this.els.message.appendText('[AS]');
		};
this.els.message.appendText('[ST]');
		this.startDelay = doStart.delay(wait,this);
	},
	serve: function(position) {
this.els.message.appendText('[OV]');
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
this.els.message.appendText('[MV]');
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
this.els.message.appendText('[MA]');
	},
	end: function () {
		if(this.matchInProgress) {
			$clear(this.startDelay);
			this.links.table.halt();
			this.links.scoreboard.cancel();
			this.links.scoreboard.status('Opponent Abandoned Match');
			this.matchInProgress = false;
		}
this.els.message.appendText('[OA]');
	},
	inControl: function () {
		this.scorer.faceoffMe();
this.els.message.appendText('[IC]');
	},
	faceoff: function () {
		this.scorer.faceoffOp();
this.els.message.appendText('[OF]');
	},
	tFoul: function(msg) {
		this.links.table.halt();
		this.links.play('foul');
		this.links.scoreboard.cancel();
		this.links.scoreboard.status(msg);
		this.links.scoreboard.foul(true);
		this.links.opponent.foul();
this.els.message.appendText('[MZ]');
	},
	foul: function() {
		this.links.table.halt();
		this.links.play('foul');
		this.links.scoreboard.status('Opponent Foul');
		this.requestServe();
this.els.message.appendText('[OZ]');
	},
	requestServe: function() {
		var that = this;
		this.links.scoreboard.serve(true);
		this.links.scoreboard.set(this.timers.restart,function () {
			that.links.scoreboard.serve(false);
			that.tFoul('You took too long to serve');
		});
		this.links.table.serve();
this.els.message.appendText('[RV]');
	},
	goalAgainst: function() {
		this.links.table.halt();
		this.links.play('goal');
		this.links.scoreboard.status('Opponent Scored');
		this.links.opponent.goal();
		if(this.scorer.goalAgainst()) {
			this.requestServe();
		}
this.els.message.appendText('[OG]');
	},
	goal: function() {
		this.links.table.halt();
		this.links.play('goal');
		this.links.scoreboard.status('GOAL !!!!!!');
		if(this.scorer.goalFor()) {
			this.requestServe();
		}
this.els.message.appendText('[MG]');
	}
});

