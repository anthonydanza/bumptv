var urlParams;
window.onload = function () {
    var match,
        pl     = /\+/g,  // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
        query  = window.location.search.substring(1);

    urlParams = {};
    while (match = search.exec(query))
       urlParams[decode(match[1])] = decode(match[2]);
   console.log(urlParams);
   document.getElementById(urlParams.d).classList.toggle("active");

   var schedule_dir = "schedule/"
   var filename = schedule_dir + urlParams.d + "_schedule_table.html";

	var xhr = typeof XMLHttpRequest != 'undefined' ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
	xhr.open('get', filename, true);
	xhr.onreadystatechange = function() {
	if (xhr.readyState == 4 && xhr.status == 200) { 
	    	document.getElementById("schedule-table-container").innerHTML = xhr.responseText;
		} 
		else if(xhr.status == 404) {
			document.getElementById("schedule-table-container").innerHTML = "<h1>404: SCHEDULE FILE NOT FOUND</h1>";
		}
	}
	xhr.send();

};

