MBahladder = function() {
	var requestresponse = function(response,errorstr) {
		if(response) {
			if(response.t) {
				ropt.t = response.t; //set for next poll
				if (response.matches) {
					var x = false;
				}
				if (response.users) {
					var y = false;
				} else {
					var z = false;
				}
			}
		} else {
			var el = new Element('div',{'html':errorstr});
			el.inject($('copyright'),'before');
		}
	};
	var ropt;
	var stateReq = new Request.JSON({url:'request.php',link:'cancel',onComplete:requestresponse});
	var pollReq = new Request.JSON({url:'request.php',link:'cancel',onComplete:requestresponse});
	var pollerID;
	var poll = function() {
		pollReq.post(ropt);
	};
	return {
		init: function (param,initialstate,polldelay) {
			ropt = param;  //save request options
			var radio = $$('.pt');
			//ensure intially the "Spectator" radio function is the only one checked
			radio.each(function(item) {
				if (item.value == initialstate) {
					item.checked = true;
				} else {
					item.checked = false;
				}
			});
			radio.addEvent('change',function(e) {
				e.stop();
				if(this.checked) {
					//only do something if now checked
					stateReq.post($merge(ropt,{state: this.value}));
				} else {
					var y = false; //just in case
				}
			});
			pollerID = poll.periodical(polldelay);
		},
		logout: function (statecode) {
			$clear(pollerID); //stop poller
			stateReq.post($merge(ropt,{state:statecode}));
		}
	}
}();
