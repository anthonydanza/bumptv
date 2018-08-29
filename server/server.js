var express = require('express');
var http = require('http');
var fs = require("fs");
const path = require('path')


//both moons
var app = express();
app.use(express.static(path.join(__dirname, '../')));

//var app = module.exports = express();

//app.get('/', (req, res) => res.send('Hello World!'))

app.get('/nextVideo', function(req, res) {   
   console.log("Got a GET request for next video");
   res.send(playNextVideo());
})


function playNextBumper(scheduleFileURL) {

	//bumper finishes
	// check time difference between now and next block
	// if it is greater than some amount, play another bumper
	// if not, call playNextVideo


}

function parseDate(dateStr) {
	var d = dateStr.split(':').map(Number);
	date = new Date();
	date.setHours(d[0],d[1],d[2],d[3]);
	return date;
}

var curVideo = 0;

var actualTime = new Date();

var bootTime = new Date();
bootTime.setHours(16,0,0,0);

var delta = actualTime - bootTime;
console.log(delta);

var mediaPath = "../media";

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function playNextVideo() {

	//video finishes
	//look in current block for video after this one
	//if there is no next video, check the time difference
	//if there is a time difference greater than some amount, play a random bumper 
	//if the time difference is small, move to the next block

	var adjusted = new Date();
	adjusted = adjusted.getMilliseconds() - delta;
	var now = new Date();
	//now.setMilliseconds(adjusted);

	//openSchedule(scheduleFileURL);
	var curBlock;

	var DOTW = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
	var day = DOTW[now.getDay()];

	var sched = fs.readFileSync("../schedule/" + day + ".json");
	sched = JSON.parse(sched);
	console.log(sched);
	

	for(var i = 0; i < sched.length; i++) { //find block
		var blockStartTime = parseDate(sched[i].startTime);
		console.log(now);
		console.log(blockStartTime);
		if(blockStartTime >= now) {
			if(i == 0) {
				curBlock = sched[i];
				break;
			} else {
				curBlock = sched[i-1];
				break;
			}
		} else if(i == sched.length - 1) {
			curBlock = sched[i];
		}
	}
	console.log(curBlock.blockTitle);
	if(curBlock) {	//find video within block
		for(var j = 0; j < curBlock.videos.length; j++) {
			var startTime = parseDate(curBlock.videos[j].startTime);
			var endTime = new Date(startTime.getTime());
			console.log("startTime: " + startTime);
			endTime.setMilliseconds(startTime.getMilliseconds() + curBlock.videos[j].duration);
			console.log("endTime: " + endTime);
			console.log("now: " +  now);
			if(endTime > now && startTime < now) {
				curVideo = curBlock.videos[j];
				console.log("PLAYING:::::::::::::::: " + curVideo.title);
				var seekTime = now - startTime;
				console.log("seekTime", seekTime);
				//return "video," + curVideo.filename + "," + seekTime + "," + curVideo.title + "," + curVideo.author + "," + curVideo.description

				curVideo["videoType"] = "video";
				curVideo["seekTime"] = seekTime;


				return curVideo;//{"videoType":"video", "filename":curVideo.filename, "seekTime":seekTime, "title":curVideo.title, "author":curVideo.author, "authorLink":curVideo.authorLink, "description":curVideo.description};
			} else if(startTime > now) {
				var filename = getRandomBumper();
				var timeRemaining = startTime - now
				console.log("timeLeft: "+ timeRemaining);
				return {"videoType":"bumper", "filename":filename, "timeRemaining": timeRemaining};
			}
		} 

		var filename = getRandomBumper();
		if(sched[sched.indexOf(curBlock)+1]) { 
			var nextStartTime = parseDate(sched[sched.indexOf(curBlock)+1].startTime);
			var timeLeftInBlock = nextStartTime - now;
			return {"videoType":"bumper", "filename":filename, "timeRemaining":timeLeftInBlock}; 	
		} else {
			return {"videoType":"bumper", "filename":filename, "timeRemaining":500000};
		}
		
	}	
}	

function getRandomBumper() {
	var files = fs.readdirSync("../media/bumpers");
	files = files.filter(function(file) {
    	return path.extname(file).toLowerCase() === ".mp4";
	});
	var filename = "/bumpers/" + files[getRandomInt(files.length)];
	console.log(files);
	console.log(filename);
	return filename;
}

function sendUpdateVideoResponse(filename, seekTime) {
	
}

var server = http.createServer(app);
server.listen(8080);