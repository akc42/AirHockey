var Practice = new Class({
//'my' in this class refers to the opponent, which I am simulating
	initialize: function(links,timers) {
		var that = this;
		this.timers = timers;
		this.links = links;
		this.scorer = new Scorer({
			faceoff:function(b) {
				if(b) that.links.match.faceoff();
			},
			score:function(b){},
  			game:function(b){},
			match:function(b){}
		});
		this.links.match.start.delay(50,this.links.match,1000);  //start in one second
		this.ontable=this.myside.periodical(5000,this);
	},
 	hit: function(mallet,puck) {
		return; //practice, do nothing
	},
	goal: function() {
		$clear(this.ontable);
		if(this.scorer.goalFor()) this.foul();
	},
	foul: function () {
		$clear(this.ontable);
		//simulate me serving and then hitting puck
		this.d1=this.myserve.delay(3000,this);
	},
	serve: function (puck) {
		this.ontable=this.myside.periodical(5000,this);
	},
	faceoff: function () {
		this.scorer.faceoffOp();
	},
	end: function () {
		$clear(this.d1);
		$clear(this.ontable);
	},
	myside: function() {
		var reply = this.links.table.getUpdate();
		if(reply.puck && reply.puck.y < 1159) {
			//puck is my side and out of reach players mallet
			if (Math.abs(reply.puck.dy) < 5) {
				//going slowly
				this.scorer.faceoffMe(); //claim it
				reply.puck.dx = $random(-40,40);
				reply.puck.dy = $random(40,80);
				this.links.table.update(true,{x:560,y:148},reply.puck,0);
			}
		}
	},
 	myserve: function() {
		this.links.match.serve({x:560,y:250});
		this.ontable=this.myside.periodical(5000,this);
	}		
});

