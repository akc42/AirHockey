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
			var myDate = new Date(new Date().getTime() - match.retrieve('start')*1000);
			var min = myDate.getMinutes();
			min = min + "";
			min = (min.length == 1)?'0'+min:min;
			var secs = myDate.getSeconds();
			secs = secs + "";
			secs = (secs.length == 1)?'0'+secs:secs;
			duration.set('text',myDate.getUTCHours()+':'+min+':'+secs);
		}
	};
	var userclick = function(e) {
		e.stop();
		var oid = this.get('id').substr(1).toInt(); //he will be my opponent
		var changedState = false;
		if(personalState.get('id') != 'S3') {
			var pstext = personalState.get('text');
			personalState.set('html',pstext);  //removes tick image
			personalState = document.id('S3');  //we set ourselves into invite mode
			pstext = personalState.get('text');
			personalState.set('html', pstext+'<img src="tick.gif" alt="selected" />') ;
			ropt.state = 3;  //set ourselves into invite mode
			changedState = true;
		}
		var statediv = this.getFirst().getNext();
		if(statediv.hasClass('free') || statediv.hasClass('inviteFrom')) {
			stateReq.post(Object.merge({cmd:'A',oid:oid},ropt)); //accept an invite
		} else {
			if(statediv.hasClass('byInvite') || statediv.hasClass('inviteTo')) {
				stateReq.post(Object.merge({cmd:'I',oid:oid},ropt)); // send an invite
			} else {
				if(changedState) {
					/* even though the person we clicked on was not eligable to be invited, our
					attempt to invite him implies that we want to be in invite mode so set that mode
					anyway */
					stateReq.post(ropt);  
				}
			}
		}
	};
	var doingExitToForum;
	var requestresponse = function(response,errorstr) {
		if(response) {
			if(response.t) {
				ropt.t = response.t; //set for next poll
				if (response.matches) {
					response.matches.each(function(match) {
						var el = document.id('M'+match.mid);  //see of match already has a record
						if (match.deletion) {
							if(el) el.destroy();
						} else {
							var d,p;
							match.stime += timeOffset; //adjust for server offset
							if(el) {
								el.getChildren().destroy(); //clear out all children
							} else {
								el = new Element('div',{'class':'match','id':'M'+match.mid});
								el.store('start',match.stime);  //save the start time
								var injected = false;
								$$('.match').each(function(item) {
									if(!injected && match.stime < item.retrieve('start')) {
										injected = true;
										el.inject(item,'before');
									}
								});
								if (!injected) {
									el.inject(document.id('matchlist'),'bottom');
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
								if(match.abandon) d.addClass('abandon');
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
						var el = document.id('U'+user.pid);
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
								el = new Element('div',{'class':'onlineUser','id':'U'+user.pid}).inject(document.id('onlineListHeader'),'after');
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
									el.addClass('cpoint');
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

									el.addClass('cpoint');
									break;
								case 4:
								case 5:
									d.addClass('inmatch');
									d.set('text','M');
									break;
								case 6:
									d.addClass('inmatch');
									d.set('text','P');
									break;
								default:
							}
						}	
					});
				}
			}
			if (response.state) {
				if(response.state == 5) {
				    doingExitToForum = false;
					window.location.assign('play.php?user='+ropt.user+'&pass='+ropt.pass+'&mid='+response.mid);
				} else {
					if(response.state == 6) {
					    doingExitToForum = false;
						window.location.assign('play.php?user='+ropt.user+'&pass='+ropt.pass);
					}
				}
			}
		} else {
			var el = new Element('div',{'html':errorstr});
			el.inject(document.id('copyright'),'before');
		}
	};
	var ropt;
	var stateReq = new Request.JSON({url:'request.php',link:'chain',onComplete:requestresponse});
	var pollerID;
	var poll = function() {
		stateReq.post(ropt);
	};
	var durationID;
	var durationUpdate = function() {
		$$('.match').each(function(m) {
			formatDuration(m);
		});
	};
	var personalState;
	return {
		init: function (param,initialstate,polldelay) {
		    doingExitToForum = true;
			ropt = param;  //save request options
			ropt.state = initialstate;
			timeOffset = new Date().getTime()/1000 - ropt.t;
			personalState = document.id('S'+initialstate);
			stateReq.post(ropt); //tell underlying system state to go to
			$$('.ps').addEvent('click',function(e) {
				e.stop();
				var pstext = personalState.get('text');
				personalState.set('html',pstext); //This should remove the tick image
				personalState = this;
				pstext = this.get('text');
				this.set('html', pstext+'<img src="tick.gif" alt="selected" />') ;
				//only do something if now checked
				ropt.state = this.get('id').substr(1).toInt();
				stateReq.post(ropt);
			});
			//Go through matches and set the durations up, and then kick of regular update
			$$('.match').each(function(match) {
				var duration = match.getFirst('.duration');
				if (duration) {
					//Only do this if a duration - ended matches are not included we add the time offset
					match.store('start',duration.get('text').toInt() + timeOffset);
					formatDuration(match);
				} else {
					var endmatch = match.getFirst('.endmatch');
					if (endmatch) {
						endmatch.set('text',formatDate(endmatch.get('text')));
					}
				}
			});
			// For each online user, set up the function of what to do when we click on him
			$$('.onlineUser').addEvent('click',userclick);
			var addCpoint = function(user) {
				user.addClass('cpoint');
			} 
			$$('.free').each(addCpoint);
			$$('.byInvite').each(addCpoint);
			$$('.inviteTo').each(addCpoint);
			$$('.inviteFrom').each(addCpoint);
			pollerID = poll.periodical(polldelay);
			durationID = durationUpdate.periodical(1000);
		},
		logout: function () {

		    if (doingExitToForum) {
		    	ropt.state = 0;
		    	stateReq.post(ropt); //say going offline (except when going to match or practice)
		    }
			window.clearInterval(pollerID); //stop poller
			window.clearInterval(durationID);
		}
	}
}();
