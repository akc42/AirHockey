MBahladder = function() {
	opponent = {};
	var controlType;
	return {
		init: function (me) {
			
			//Temp for testing
			if (me.uid == 4) {
				opponent.uid = 165;
				opponent.name = 'Confused';
				controlType = 'M';  //I am master
			} else {
				opponent.uid = 4;
				opponent.name = 'Alan';
				controlType = 'S';  //I am slave
			}
			var newURL = 'play.php?pid='+me.uid+'&pn='+me.name+'&pp='+me.password+'&oid='+opponent.uid+'&on='+opponent.name+'&ct='+controlType;
			$('playit').addEvent('click',function(e) {
				window.location.assign(newURL); //leaves a back button to get out
			});
		},
		logout: function () {
		}
	}
}();
