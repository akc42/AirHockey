MBahladder = function() {
	opponent = {};
	var controlType;
	return {
		init: function (me) {
			
			//Temp for testing
			if (me.uid == 4) {
				opponent.name = 'Joe';
			} else {
				opponent.name = 'Alan';
			}
			var newURL = 'play.php?pid='+me.uid+'&pn='+me.name+'&pp='+me.password+'&on='+opponent.name+'&ct=';
			$('master').addEvent('click',function(e) {
				window.location.assign(newURL+'M'); //leaves a back button to get out
			});
			$('slave').addEvent('click',function(e) {
				window.location.assign(newURL+'S'); //leaves a back button to get out
			});
		},
		logout: function () {
		}
	}
}();
