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


Comms = function () {
    var sender = new Request({link:'chain'}); 
    var messageCallback;
    var failCallback;
	var readTimerID;
	var readTimeoutValue;
	var oid = 0;
	var me;
	var counter = 0;
    var reader = 0;
    var readerStarted = false;
	function readTimeout () {
		messageBoard.appendText(' [R:TO]');
		reader.cancel();
		failCallback();
	};	
    var messageBoard;
 	var open = true;
	var ahv;
    return {
    	initialize: function (myself,opId,errDiv,fail,ahvar) {
			me = myself;
			oid = opId;
			messageBoard = errDiv;
			ahv = ahvar;
			if (oid != 0) {
				failCallback = fail;
				//Set up the read request
				reader = new Request({
					url:'read.php',
					link:'chain',
					onSuccess: function(html) {
						window.clearTimeout(readTimerID);
						readTimerID = readTimeout.delay(readTimeoutValue);
						var holder = new Element('div').set('html',html);
						if(holder.getElement('error')) {
							 messageBoard.appendText(holder.getElement('error').get('text'));
						} else {
							var m = holder.getElement('message');
							if(m) {
								var c = m.get('count');
								if(++counter != c) messageBoard.appendText(' [C:'+counter+':'+c+']'); //Should catch out of sequence counts
								messageCallback(m.get('time').toInt(),m.get('text'));
							}
						}
						reader.post({oid:oid,ahv:ahv}); //Queue up next request 
					}
				});
			}
		},
        Stream : new Class({
            initialize: function(myURL) {
            	this.url = myURL;
            	this.counter = 0;
             },                
			send: function(myParams) {
				if (open) sender.send({
					url:this.url,
					data:Object.merge({c:++this.counter,ahv:ahv},me,myParams),
					method:'post',
					onSuccess:function(html) {
						var holder = new Element('div').set('html',html);
						if(holder.getElement('error')) messageBoard.appendText(' [S:'+holder.getElement('error').get('text')+']');
					}
				});
			}
		}),
		set: function(callback,timeout) {
			messageCallback = callback;
			readTimeoutValue = timeout;
			if(oid != 0) {
				//reset timeout
				window.clearTimeout(readTimerID);
				readTimerID = readTimeout.delay(readTimeoutValue);
				if(!readerStarted) {
					reader.post({oid:oid}); //Startup read request sequence if not already going 
					readerStarted = true;
				}
			}
		},
		die: function() {
			function shutdown () {
				if (oid != 0 ) reader.cancel();//Kill off any read requests as we are going to reset them
				sender.cancel();
			}
			if(open) {
				if (oid !=0 ) window.clearTimeout(readTimerID);
				shutdown.delay(2000);  //Wait 2 seconds to ensure that all traffic in flight completes.	
				open = false; //ensure nothing else goes
			}
		}
    }
}();

