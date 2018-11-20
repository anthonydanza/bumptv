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

function findCurrentShow() {
	var anchor_list = document.getElementsByClassName("start-time-anchor");
	var now = new Date();
	var d = new Date();

	for (i = 0; i < anchor_list.length; i++) {
		var t = anchor_list[i].id.split(":");
		d.setHours(t[0]);
		d.setMinutes(t[1]);
		d.setSeconds(t[2]);

		if(now < d) {
			return anchor_list[i-1].id;
		}

	}
}

window.onload = function () {

	var query = parseQuery();

	if(query.d) {
		var query_day = query.d;
	} 

	function requestSchedule(today, timeslot) {
		var schedule_dir = "schedule/";
		var filename = schedule_dir + today + "_schedule_table.html";

		var schedule_req = typeof XMLHttpRequest != 'undefined' ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
		schedule_req.open('get', filename, true);

		schedule_req.send();

		schedule_req.onreadystatechange = function() {
		if (schedule_req.readyState == 4 && schedule_req.status == 200) { 
		    	document.getElementById("schedule-table-container").innerHTML = schedule_req.responseText;

		    	if(timeslot) {
			    	window.location.hash = "";
			      	window.location.hash = timeslot;
				 	window.scrollBy(0,-300);
				  	highlightCurrentTimeSlot(timeslot);
			  	}

			} 
			else if(schedule_req.status == 404) {
				document.getElementById("schedule-table-container").innerHTML = "<h1>404: SCHEDULE FILE NOT FOUND</h1>";
			}
		}
	}

	
	var timeslot_req = new XMLHttpRequest();
  	timeslot_req.open("GET", "nextVideo", true);
  	timeslot_req.setRequestHeader("Cache-Control", "no-cache");
  	timeslot_req.send();

	timeslot_req.onreadystatechange = function() {
	    if (this.readyState == 4 && this.status == 200) {

	      var resp = JSON.parse(this.responseText);
	      //console.log(resp);

	      timeslot = resp.startTime;

	      var now = new Date(resp.now);
	      var server_day = DOTW[now.getDay()];

	      if(server_day != query_day && query_day != undefined) {
	      	var today = query_day;
	      	timeslot = "";
	      } else {
	      	var today = server_day;
	      }
	      document.getElementById(today).classList.toggle("active");
		  requestSchedule(today, timeslot);

	  }
	}

	var clock = document.getElementById("clock");
 	setInterval(function() {
	    var d = new Date();
	    var s = String(d.getSeconds()).padStart(2,'0');
	    var m = String(d.getMinutes()).padStart(2,'0');
	    var h = String(d.getHours()).padStart(2,'0');
	    clock.textContent = h + ":" + m + ":" + s;
  }, 1000);
};












