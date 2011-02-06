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
	var readTimeoutLimit;
    var reader = 0;
	function readTimeout () {
		messageBoard.appendText('Read Timeout ');
		if(readTimeoutLimit-- <= 0) {
			failCallback('Read Timeout Limit Reached');
		}
	}	
    var messageBoard;	 
    return {
        Stream : new Class({
            initialize: function(myURL) {
            	this.url = myURL;
             },                
			send: function(myParams) {
				var data = me;
				if(myParams) Object.append(data,myParams);
				if (sender != 0) sender.send({url:this.url,data:data,method:'post',onSuccess:function(html) {
						var holder = new Element('div').set('html',html);
						if(holder.getElement('error')) messageBoard.appendText(holder.getElement('error').get('text'));
					}});
			}
		}),
		set: function(myself,opId,callback,timeout,limit,fail,errDiv) {
			me = myself;
			oid = opId;
			messageCallback = callback;
			messageBoard = errDiv;
			readTimeoutValue = timeout;
			readTimeoutLimit = limit;
			failCallback = fail;
			//reset timeout
			window.clearTimeout(readTimerID);
			readTimerId = readTimeout.delay(readTimeoutValue);
			if (reader == 0 && oid != 0) { 
				//Set up the first time (only)
				reader = new Request({
					url:'read.php',
					link:'chain',
					onSuccess: function(html) {
						window.clearTimeout(readTimerID);
						readTimerID = readTimeout.delay(readTimeoutValue);
						var holder = new Element('div').set('html',html);
						if(holder.getElement('error')) {
							errDiv.appendText(holder.getElement('error').get('text'));
						} else {
							var m = holder.getElement('message');
							if(m) {
								messageCallback(m.get('time'),m.get('text'));
								if(m=m.getNext()) {
									errDiv.appendText('++++SECOND MESSAGE+++);
									messageCallback(m.get('time'),m.get('text')); //do second message if we actually got one
								}
							}
						}
						reader.post({oid:oid}); //Queue up next request 
					}
				});
				reader.post({oid:oid}); //Startup read request chain 
			}
		},
		die: function() {
			if (reader) {
				window.clearTimeout(readTimerID);
				reader.cancel();  //Kill off any read requests as we are going to reset them
			}
			sender.cancel();
			sender = 0; //ensure nothing else goes
		}
    }
}();

