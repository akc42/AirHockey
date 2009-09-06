var Scorer = new Class({
	initialize: function(callbacks) {
		this.awaitingFaceoff = true;
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
			this.callbacks.faceoff(true);
		}
		this.myscore++;
		if(this.myscore >= 7) {
			this.opscore = 0;
			this.myscore = 0;
			this.mygames++;
			if(this.mygames < 4) {
				this.callbacks.game(true);
				if (this.myFaceoff) {
					if ((this.opgames+this.mygames)%2 == 0) return true;
				} else {
					if ((this.opgames+this.mygames)%2 == 1) return true;
				}
			} else {
				this.callbacks.match(true);
			}
		} else {
			this.callbacks.score(true);
		}
		return false;
	},
	goalAgainst: function() {
		if(this.awaitingFaceoff) {
			this.myFaceoff = false;
			this.awaitingFaceoff = false;
			this.callbacks.faceoff(false);
		}
		this.opscore++;
		if(this.opscore >= 7) {
			this.opgames++;
			this.opscore = 0;
			this.myscore = 0;
			if(this.opgames < 4) {
				this.callbacks.game(false);
				if (this.myFaceoff) {
					if ((this.opgames+this.mygames)%2 == 1) return false;
				} else {
					if ((this.opgames+this.mygames)%2 == 0) return false;
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
	faceoffSet: function () {
		return !this.awaitingFaceoff;
	},
	faceoffMe: function () {
		if (this.awaitingFaceoff) {
			this.awaitingFaceoff = false;
			this.myFaceoff = true;
			this.callbacks.faceoff(true);
		}
	},
	faceoffOp: function () {
		if (this.awaitingFaceoff) {
			this.awaitingFaceoff = false;
			this.myFaceoff = false;
			this.callbacks.faceoff(false);
		}
	}
});

