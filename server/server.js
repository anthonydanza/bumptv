var express = require('express');
var http = require('http');
var fs = require("fs");
const path = require('path')


//both moons
var app = express();
app.use(express.static(path.join(__dirname, '../')));

app.get('/nextVideo', function(req, res) {   
   //console.log("Got a GET request for next video");
   res.send(playNextVideo());
})

function parseDate(dateStr) {
	var d = dateStr.split(':').map(Number);
	date = new Date();
	date.setHours(d[0],d[1],d[2],d[3]);
	return date;
}

var curVideo = 0;

// FOR TESTING ---------------
// var actualTime = new Date();
// var bootTime = new Date();
// bootTime.setHours(16,0,0,0);
// var delta = actualTime - bootTime;

var mediaPath = "../media";

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function playNextVideo() {

	// FOR TESTING ----------------
	//var adjusted = new Date();
	//adjusted = adjusted.getMilliseconds() - delta;
	//now.setMilliseconds(adjusted);
	var now = new Date();

	var curBlock;

	var DOTW = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
	var day = DOTW[now.getDay()];

	var sched = fs.readFileSync("../schedule/" + day + ".json");
	sched = JSON.parse(sched);
	//console.log(sched);
	

	for(var i = 0; i < sched.length; i++) { //find block
		var blockStartTime = parseDate(sched[i].startTime);
		//console.log(now);
		//console.log(blockStartTime);
		if(blockStartTime >= now) {
			if(i == 0) {
				//curBlock = sched[i];
				//break;
			} else {
				curBlock = sched[i-1];
				break;
			}
		} else if(i == sched.length - 1) {
			curBlock = sched[i];
		}
	}
	//console.log(curBlock.blockTitle);
	if(curBlock) {	//find video within block
		for(var j = 0; j < curBlock.videos.length; j++) {
			var startTime = parseDate(curBlock.videos[j].startTime);
			var endTime = new Date(startTime.getTime());
			endTime.setMilliseconds(startTime.getMilliseconds() + curBlock.videos[j].duration);

			if(endTime > now && startTime < now) {
				curVideo = curBlock.videos[j];
				var seekTime = now - startTime;
				var timeRemaining = endTime - now;			
				curVideo["videoType"] = "video";
				curVideo["seekTime"] = seekTime;
				curVideo["timeRemaining"] = timeRemaining;
				return curVideo;
			} else if(startTime > now) {
				var filename = getRandomBumper();
				var timeRemaining = startTime - now
				var previousStartTime = curBlock.videos[j-1].startTime;
				console.log("pst " +previousStartTime);
				// send back a bumper with the start time of the last real video, to determine most recent time slot when loading sched
				return {"videoType":"bumper", "filename":filename, "timeRemaining": timeRemaining, "startTime":previousStartTime};
			}
		} 

		var filename = getRandomBumper();
		if(sched[sched.indexOf(curBlock)+1]) { 
			var nextStartTime = sched[sched.indexOf(curBlock)+1].startTime;
			var timeLeftInBlock = parseDate(nextStartTime) - now;
			console.log("nst " + nextStartTime);
			return {"videoType":"bumper", "filename":filename, "timeRemaining":timeLeftInBlock, "startTime":nextStartTime}; 	
		} else {
			var lastStartTime = sched[sched.length].startTime;
			console.log("lst " + lastStartTime);
			return {"videoType":"bumper", "filename":filename, "timeRemaining":500000, "startTime":lastStartTime};
		}		
	}	
}	

function getRandomBumper() {
	var files = fs.readdirSync("../media/bumpers");
	files = files.filter(function(file) {
    	return path.extname(file).toLowerCase() === ".mp4";
	});
	var filename = "/bumpers/" + files[getRandomInt(files.length)];
	//console.log(files);
	//console.log(filename);
	return filename;
}

var server = http.createServer(app);
server.listen(8080);