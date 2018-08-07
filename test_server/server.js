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
	//if there is a time difference greater than some amount, play a random bumper with a special nextBumper oneded() fcn
	//if the time difference is small, move to the next block

	//openSchedule(scheduleFileURL);
	var curBlock;

	var sched = fs.readFileSync("../test.json");
	sched = JSON.parse(sched);

	var adjusted = new Date();
	adjusted = adjusted.getMilliseconds() - delta;
	var now = new Date();
	now.setMilliseconds(adjusted);
	

	for(var i = 0; i < sched.length; i++) { //find block
		var blockStartTime = parseDate(sched[i].startTime);
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
			endTime.setMilliseconds(startTime.getMilliseconds() + curBlock.videos[j].duration);
			if(endTime > now) {
				curVideo = curBlock.videos[j];
				console.log("PLAYING:::::::::::::::: " + curVideo.title);
				var seekTime = now - startTime;
				return curVideo.filename + "," + seekTime;
				break;
			}
		} 
		var files = fs.readdirSync(mediaPath + "/bumpers");
		var filename = "/bumpers/" + files[getRandomInt(files.length)];
		console.log(filename);
		if(sched[sched.indexOf(curBlock)+1]) { 
			var nextStartTime = parseDate(sched[sched.indexOf(curBlock)+1].startTime);
			var timeLeftInBlock = nextStartTime - now;
			return filename + "," + timeLeftInBlock + ",bumper";	
		} else {
			return filename + ",5000,bumper";
		}
		
	}	
}	




function sendUpdateVideoResponse(filename, seekTime) {
	
}

var server = http.createServer(app);
server.listen(8080);