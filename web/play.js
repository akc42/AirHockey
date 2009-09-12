var Play = new Class({
	initialize: function(mid,startTime,me,oid,master,timers,els) {
		var play = function(sound) {
			if(soundReady) soundManager.play(sound);
		};
if(master) {
	els.message.appendText('MASTER:');
} else {
	els.message.appendText('SLAVE:');
}
		this.links = {
			table:null,
			match:null,
			opponent:null,
   			scoreboard:new Scoreboard(mid,startTime,me,master,els,play),
	  		play:play
		};
		this.links.match = new Match(this.links,timers,els);
		this.links.table = new Table(this.links,timers,els,play);
		//this needs to be last, as it starts everything off - the rest has to be set up before it
		if (mid == 0) {
			//this is a practice
			this.links.opponent = new Practice(this.links,timers);
			els.opmallet.addClass('hidden'); // hide other mallet
		} else {
			this.links.opponent = new Opponent(this.links,me,oid,master,timers,els);
		}
		var that = this;
		els.abandon.addEvent('click', function(e) {
			e.stop();
			that.links.match.end();
			window.location.assign('index.php');
		});
	},
	end: function() {
		this.links.match.end();
	}
});


