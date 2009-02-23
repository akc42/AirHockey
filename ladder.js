MBahladder = function() {
	var timeOffset; //seconds we are ahead of the server (-ve means we are behind)
	var m_names = ["Jan","Feb","Mar","Apr","May","Jun","Jly","Aug","Sep","Oct","Nov","Dec"];
	var d_names = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
	var formatDate = function(d) {
		//d is a string with seconds from 1st Jan 1970
		var myDate = new Date(d.toInt()*1000);
		var ch = myDate.getHours();
		var ap = (ch < 12)? 'am':'pm';
		ch = (ch == 0)?12:(ch > 12)?ch-12:ch;
		var min = myDate.getMinutes();
		min = min + "";
		min = (min.length == 1)?'0'+min:min;
		return	myDate.getDate() + ' ' + m_names[myDate.getMonth()] + ' ' + myDate.getFullYear() +
				' '+ ch + ':' + min + ' ' + ap + ' ('+d_names[myDate.getDay()] +')';
	};
	var formatDuration = function(match) {
		var duration = match.getChildren('.duration');
		if (duration) {
			var myDate = new Date(new Date.getTime() - match.retrieve('start')*1000);
			var min = myDate.getMinutes();
			min = min + "";
			min = (min.length == 1)?'0'+min:min;
			var secs = myDate.getSeconds();
			secs = secs + "";
			secs = (secs.length == 1)?'0'+secs:secs;
			duration.set('text',mydate.getHours()+':'+min+':'+secs);
		}
	};
	var userclick = function(e) {
		e.stop();
		var oid = this.get('id').substr(1).toInt(); //he will be my opponent
		var statediv = this.getFirst().getNext();
		if(statediv.hasClass('free') || statediv.hasClass('inviteTo')) {
			cmdReq.post($merge(ropt,{cmd:'A',oid:oid}));
		} else {
			if(statediv.hasClass('byInvite') || statediv.hasClass('inviteFrom')) {
				cmdReq.post($merge(ropt,{cmd:'I',oid:oid}));
			}
		}
	};
	var requestresponse = function(response,errorstr) {
		if(response) {
			if(response.t) {
				ropt.t = response.t; //set for next poll
				if (response.matches) {
					response.matches.each(function(match) {
						var el = $('M'+match.mid);  //see of match already has a record
						if (match.abandon) {
							if(el) el.destroy();
						} else {
							var d,p;
							match.stime += timeOffset; //adjust for server offset
							if(el) {
								el.getChildren().destroy(); //clear out all children
							} else {
								el = new Element('div',{'class':'match','id':'M'+match.mid});
								el.store('start',match.stime+timeOffset);  //save the start time
								var injected = false;
								$$('.match').each(function(item) {
									if(!injected && match.stime < item.retrieve('start')) {
										injected = true;
										el.inject(item,'before');
									}
								});
								if (!injected) {
									el.inject($('matchlist'),'bottom');
								};
							}
							//Now we have the match element, build up contents
							if(match.event) {
								//only add an the event title if there is one
								d = new Element('div',{'class':'eventtitle','html':match.event}).inject(el);
							}
							d = new Element('div',{'class':'players'}).inject(el);
							p = new Element('div',{'class':'user','text':match.hname}).inject(d);
							p = new Element('div',{'class':'user','text':match.aname}).inject(d);
							if(match.games) {
								//There are some games, so lets include them
								match.games.each(function(game) {
									d = new Element('div',{'class':'game'}).inject(el);
									p = new Element('div',{'class':'score','text':game[0]}).inject(d);
									p = new Element('div',{'class':'score','text':game[1]}).inject(d);
								});
							}
							if(match.etime) {
								//match is ended so set end time in place
								d = new Element('div',{'class':'endmatch','text':formatDate(match.etime)}).inject(el);
							} else {		
								el.store('start',match.stime);
								d = new Element('div',{'class':'duration'}).inject(el);
								formatDuration(el);
							}
						}
					});		
				}
				if (response.users) {
					response.users.each(function(user) {
						var el = $('U'+user.pid);
						var d;
						if (user.state == 0) {
							if(el) el.destroy(); //remove offline users
						} else {
							if (el) {
								d = el.getFirst();
								if(user.name) {
									d.set('text',user.name);
								}
								d = d.getNext();
								d.removeProperty('class');
								d.set('text','');
							} else {
								el = new Element('div',{'class':'onlineUser','id':'U'+user.pid}).inject($('onlineListHeader'),'after');
								d = new Element('div',{'class':'ouser','text':user.name}).inject(el);
								d = new Element('div').inject(el);
								el.addEvent('click',userclick);
							}
							// at this point d has the element we have to set the class of
							switch (user.state) {
								case 1 :
									break;
								case 2 :
									d.addClass('free');
									d.set('text','A');
									break;
								case 3 :
									if (user.invite) {
										if (user.invite == 'T') {
											d.addClass('inviteTo');
											d.set('text','T');
										} else {
											d.addClass('inviteFrom');
											d.set('text','F');
										}
									} else {
										d.addClass('byInvite');
										d.set('text','I');
									}
									break;
								case 4:
								case 5:
									d.addClass('inMatch');
									d.set('text','M');
									break;
								case 6:
									d.addClass('inMatch');
									d.set('text','P');
									break;
								default:
							}
						}	
					});
				}
				if (response.state) {
					if(response.state == 5) {
						//start a match
					} else {
						if(response.state == 6) {
							//start practicing
						}
					}
				}
			}
		} else {
			var el = new Element('div',{'html':errorstr});
			el.inject($('copyright'),'before');
		}
	};
	var ropt;
	var stateReq = new Request.JSON({url:'request.php',link:'chain',onComplete:requestresponse});
	var pollReq = new Request.JSON({url:'request.php',link:'chain',onComplete:requestresponse});
	var cmdReq = new Request.JSON({url:'request.php',link:'chain',onComplete:requestresponse});
	var pollerID;
	var poll = function() {
		pollReq.post(ropt);
	};
	var durationID;
	var duration = function() {
		$$('match').each(function(match) { formatDuration(match);});
	};

	return {
		init: function (param,initialstate,polldelay) {
			ropt = param;  //save request options
			timeOffset = new Date().getTime()/1000 - ropt.t;
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
					stateReq.post($merge(ropt,{state: this.value.toInt()}));
				} else {
					var y = false; //just in case
				}
			});
			//Go through matches and set the durations up, and then kick of regular update
			$$('.match').each(function(match) {
				var duration = match.getChildren('.duration');
				if (duration) {
					//Only do this if a duration - ended matches are not included we add the time offset
					match.store('start',duration.get('text').toInt() + timeOffset);
					formatDuration(match);
				} else {
					var endmatch = match.getChildren('.endmatch');
					if (endmatch) {
						endmatch.set('text',formatDate(endmatch.get('text')));
					}
				}
			});
			// For each online user, set up the function of what to do when we click on him
			$$('.userOnline').addEvent('click',userclick);
			pollerID = poll.periodical(polldelay);
			durationID = duration.periodical(1000);
		},
		logout: function (statecode) {
			$clear(pollerID); //stop poller
			$clear(durationID);
			stateReq.post($merge(ropt,{state:statecode}));
		}
	}
}();
