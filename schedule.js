var urlParams;

var DOTW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function parseQuery() {
	var query  = window.location.search.substring(1);
	var vars = query.split("?");
	var output = {};
	for(var i = 0; i < vars.length; i++) {
		var keyVal = vars[i].split("=");
		var key = keyVal[0];
		var val = keyVal[1];
		output[key] = val;
	}
	return output;
}

function highlightCurrentTimeSlot(id) {
	var element = document.getElementById(id);
	if(element != null) { 
		var parentElement = element.parentElement.parentElement;
		parentElement.style.background = "linear-gradient(blue,white)";
	}
}

window.onload = function () {

	var query = parseQuery();

	if(query.d) {
		var today = query.d;
	} else {
		var date = new Date();
 		var today = DOTW[date.getDay()];
	}

	var schedule_dir = "schedule/"
	var filename = schedule_dir + today + "_schedule_table.html";

	var xhr = typeof XMLHttpRequest != 'undefined' ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
	xhr.open('get', filename, true);

	xhr.onreadystatechange = function() {
	if (xhr.readyState == 4 && xhr.status == 200) { 
	    	document.getElementById("schedule-table-container").innerHTML = xhr.responseText;
	    	if(query.t) {
		    	window.location.hash = query.t;
		    	window.scrollBy(0,-300);
		    	highlightCurrentTimeSlot(query.t);
	   		}
		} 
		else if(xhr.status == 404) {
			document.getElementById("schedule-table-container").innerHTML = "<h1>404: SCHEDULE FILE NOT FOUND</h1>";
		}
 		document.getElementById(today).classList.toggle("active");
	}
	xhr.send();

	var clock = document.getElementById("clock");
	setInterval(function() {
		var d = new Date();
  		var s = String(d.getSeconds()).padStart(2,'0');
  		var m = String(d.getMinutes()).padStart(2,'0');
  		var h = String(d.getHours()).padStart(2,'0');
  		clock.textContent = h + ":" + m + ":" + s;
	}, 1000);

};












