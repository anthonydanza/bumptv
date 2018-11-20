window.onload = function() {

var clock = document.getElementById("clock");

setInterval(function() {
	var d = new Date();
	var s = String(d.getSeconds()).padStart(2,'0');
	var m = String(d.getMinutes()).padStart(2,'0');
	var h = String(d.getHours()).padStart(2,'0');
	clock.textContent = h + ":" + m + ":" + s;
}, 1000);

};