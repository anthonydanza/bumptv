var express = require('express');
var https = require('https');
var http = require('http');
var fs = require("fs");
var multer = require('multer')
var serveIndex = require('serve-index');
const path = require('path')
const ffprobe = require('ffprobe');
const ffprobeStatic = require('ffprobe-static');
var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;
var flash = require('connect-flash');
var session = require('express-session');
var bodyParser = require('body-parser');



// passport.use(new LocalStrategy(
//   function(username, password, done) {
//   	console.log("fuck");
//     User.findOne({ username: username }, function(err, user) {
//       if (err) { return done(err); }
//       if (!user) {
//       	console.log("incorrect username");
//         return done(null, false, { message: 'Incorrect username.' });
//       }
//       if (!user.validPassword(password)) {
//       	console.log("incorrect password");
//         return done(null, false, { message: 'Incorrect password.' });
//       }
//       return done(null, user);
//     });
//   }
// ));


function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        return res.redirect('/login');
    }
}

var app = express();
app.use(express.static(path.join(__dirname, '../'), { dotfiles: 'allow' }));

app.use('/uploads', serveIndex(path.join(__dirname + '/uploads'), { 'icons': true, 'view': 'details' }));
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(flash());

// app.use(session({ cookie: { maxAge: 60000 }, 
//                   secret: 'woot',
//                   resave: false, 
//                   saveUninitialized: false}));

// app.use(passport.initialize());
// app.use(passport.session());


// app.post('/login', passport.authenticate('local', { successRedirect: '/uploads',
//                                    failureRedirect: '/login.html',
//                                    failureFlash: false })
// );

// app.get('/logout', (req, res) => {
//         req.logout();
//         res.redirect('/login');
//     });

// passport.use(new LocalStrategy(
//   function(username, password, done) {
//   	return done(null,{username: username});
//   	if(username == "email" && password == "pwd") {
//   		return done(null,username);
//   	}
//   }
// ));

// passport.serializeUser(function(user, done) {
//     done(null, user.username);
// });

// passport.deserializeUser((username, done) => {
//     done(null, {username: username});
// }); 








// SET STORAGE
var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function(req, file, cb) {
        console.log(file);
        console.log(req);
        console.log(req.read());
        tempFilename = Date.now() + ".mkv";
        cb(null, tempFilename)
    }
})

var upload = multer({ storage: storage })




app.get('/nextVideo', function(req, res) {
    playNextVideo(function(response) { res.send(response); });
})




var videoUploadFields = upload.fields([{ name: 'video', maxCount: 1 }, { name: 'filename', maxCount: 1 }])
var tempFilename = Date.now() + ".mkv";

app.get("/getDirectoryListing", function(req, res, next) {
    console.log("getDirectoryListing request");

    fs.readdir("../assets/shaders", function(err, files) { res.send(files) });



    //res.send(fs.readdir("/shaders",function(){}));
});

app.post('/uploadVideo', videoUploadFields, function(req, res, next) {

    const file = req.file;
    console.log("FILE: ");
    console.log(file);
    console.log('BODY: ');
    console.log(req.body.filename);
    username = req.body.filename;
    topic = req.body.topic;
    console.log("TOPIC: ", topic);

    fs.rename("uploads/" + tempFilename, "uploads/" + username + "-" + topic + "-" + tempFilename, function(err) {

        if (err) { console.log("UPLOAD ERROR"); return console.log(err); }
        console.log('no error');
    });



    res.send();
});

// app.post('/uploadVideo', function(request, respond) {
//     var body = '';
//     filePath = 'poopoo.webm';
//     request.on('data', function(data) {
//         body += data;
//     });

//     request.on('end', function (){
//         fs.appendFile(filePath, body, function() {
//             respond.end();
//         });
//     });
// });

function parseDate(dateStr) {
    var d = dateStr.split(':').map(Number);
    date = new Date();
    date.setHours(d[0], d[1], d[2], d[3]);
    return date;
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

// FOR TESTING ---------------
// var actualTime = new Date();
// var bootTime = new Date();
// bootTime.setHours(16,0,0,0);
// var delta = actualTime - bootTime;

var curVideo;
var mediaPath = "../media";

function playNextVideo(sendResponse) {

    // FOR TESTING ----------------
    //var adjusted = new Date();
    //adjusted = adjusted.getMilliseconds() - delta;
    //now.setMilliseconds(adjusted);
    var now = new Date();

    console.log("now: ", now);

    var curBlock;

    var DOTW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var day = DOTW[now.getDay()];

    console.log(day);

    var sched = fs.readFileSync("../schedule/" + day + ".json");
    sched = JSON.parse(sched);





    // find block
    for (var i = 0; i < sched.length; i++) {
        var blockStartTime = parseDate(sched[i].startTime);
        if (blockStartTime >= now) {
            if (i == 0) {
                //break;
            } else {
                curBlock = sched[i - 1];
                break;
            }
        } else if (i == sched.length - 1) {
            curBlock = sched[i];
        }
    }

    console.log(curBlock.blockTitle);

    if (curBlock) { //find video within block
        //console.log(curBlock);
        for (var j = 0; j < curBlock.videos.length; j++) {
            console.log(curBlock.videos[j]);
            var startTime = parseDate(curBlock.videos[j].startTime);
            var endTime = new Date(startTime.getTime());
            endTime.setMilliseconds(startTime.getMilliseconds() + curBlock.videos[j].duration);
            //console.log(startTime, endTime, now);
            if (endTime > now && startTime < now) {
                curVideo = curBlock.videos[j];
                var seekTime = now - startTime;
                var timeRemaining = endTime - now;
                curVideo["videoType"] = "video";
                curVideo["seekTime"] = seekTime;
                curVideo["timeRemaining"] = timeRemaining;
                curVideo["now"] = now.toString();
                curVideo["blockTitle"] = curBlock.blockTitle;
                console.log(curVideo);
                sendResponse(curVideo);
                return;
            } else if (startTime > now) {
                console.log(startTime);
                console.log(now);
                var filename = getRandomBumper();
                var timeRemaining = startTime - now
                var previousStartTime = curBlock.videos[j - 1].startTime;
                console.log("pst " + previousStartTime);
                // send back a bumper with the start time of the last real video, to determine most recent time slot when loading sched
                var resp = { "videoType": "bumper", "filename": filename, "timeRemaining": timeRemaining, "startTime": previousStartTime, "now": now.toString(), "blockTitle": curBlock.blockTitle };
                console.log(resp);
                sendResponse(resp);
                return;
            }
        }

        var filename = getRandomBumper();
        var bumperResp = {};
        var duration = 0;

        ffprobe("../media" + filename, { path: ffprobeStatic.path }, function(err, info) {
            if (err) { console.log(err); return done(err); }

            duration = parseInt(info.streams[0].duration * 1000);

            if (sched[sched.indexOf(curBlock) + 1]) {

                var nextStartTime = sched[sched.indexOf(curBlock) + 1].startTime;
                var timeLeftInBlock = parseDate(nextStartTime) - now;
                console.log("nst " + nextStartTime);
                console.log(duration, timeLeftInBlock);

                var timeRemaining = 0;
                if (duration > timeLeftInBlock) {
                    timeRemaining = timeLeftInBlock;
                } else {
                    timeRemaining = duration;
                }
                bumperResp = { "videoType": "bumper", "filename": filename, "timeRemaining": timeRemaining, "startTime": nextStartTime, "duration": duration, "now": now.toString(), "blockTitle": curBlock.blockTitle };
                console.log("1 " + bumperResp);
                sendResponse(bumperResp);
            } else {
                var lastStartTime = sched[sched.length].startTime;
                console.log("lst " + lastStartTime);
                bumperResp = { "videoType": "bumper", "filename": filename, "timeRemaining": 500000, "startTime": lastStartTime, "duration": duration, "now": now.toString(), "blockTitle": curBlock.blockTitle };
                console.log("2 " + bumperResp);
                sendResponse(bumperResp);
            }
        });
    } else {
        var filename = getRandomBumper();
        bumperResp = { "videoType": "bumper", "filename": filename, "timeRemaining": 500000, "startTime": nextStartTime, "duration": duration, "now": now.toString(), "blockTitle": "" };
        sendResponse(bumperResp);
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

var http = require('http');
// http.createServer(function(req, res) {
//    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
//    res.end();
// }).listen(8080);

http.createServer(app).listen(8080);

// var privateKey  = fs.readFileSync('/etc/letsencrypt/live/www.bumptelevision.com/privkey.pem', 'utf8');
// var certificate = fs.readFileSync('/etc/letsencrypt/live/www.bumptelevision.com/cert.pem', 'utf8');
// var chain = fs.readFileSync('/etc/letsencrypt/live/www.bumptelevision.com/chain.pem', 'utf8');
// var credentials = {key: privateKey, cert: certificate, ca: chain};

// var httpsServer = https.createServer(credentials, app);

// httpsServer.listen(443);