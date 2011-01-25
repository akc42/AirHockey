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

