function toggleMute() {
  var state = document.getElementById("main-vid").muted;
  document.getElementById("main-vid").muted = !state;

  var mute_button = document.getElementById("mute");

   if (state == true) {
    mute_button.style.fontWeight = 'normal';
    mute_button.innerHTML = "SOUND IS ON";
  } else {
    mute_button.style.fontWeight = 'bold';
    mute_button.innerHTML = "SOUND IS OFF";
   }
}

function toggleArtistInfo() {
  var state = document.getElementById('artist-info-description').style.display;
  if(state != "block") {
    document.getElementById('artist-info-description').style.display = "block";
  } else {
    document.getElementById('artist-info-description').style.display = "none";
  }
}

function openSchedule() {
  var week = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var d = new Date();
  var dotw = week[d.getDay()];
  var url = "schedule.html?d=" + dotw;

  window.open(url, "_self");
}

function requestNextVideo() {
  console.log("REQUESTING NEXT VIDEO");
  var req = new XMLHttpRequest();
  console.log("REQ BEFORE: " + req);
  req.open("GET", "nextVideo", true);
  req.setRequestHeader("Cache-Control", "no-cache");
  req.send();
  console.log("REQ AFTER: " + req);

  req.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {

      var resp = this.responseText.split(',');
      console.log("RESP: " + resp);
      resp = JSON.parse(this.responseText);
      console.log("Parsed JSON: " + resp);
      console.log("JSON RESP: ", resp);

      var video = document.getElementById("main-vid");
      video.src = "media/" + resp.filename;

      if(resp.videoType == "video") {
        document.getElementById("artist-info-msg").innerHTML = "NOW PLAYING: ";
        document.getElementById("artist-info-title").innerHTML = resp.title;
        document.getElementById("artist-info-author").innerHTML = resp.author;
        document.getElementById("artist-info-description").innerHTML = resp.description;
        var seekTime = parseFloat(resp.seekTime) / 1000.0;
        console.log(seekTime);
        video.currentTime = seekTime; 
      }
      else if(resp.videoType == "bumper") {
        document.getElementById("artist-info-msg").innerHTML = "stay tuned!";
        document.getElementById("artist-info-title").innerHTML = "";
        document.getElementById("artist-info-author").innerHTML = "";
        document.getElementById("artist-info-description").innerHTML = "";
        var timeRemaining = parseInt(resp.timeRemaining);
        console.log("BUMPER TIME REMAINING: " + timeRemaining); 
        setTimeout(function() {requestNextVideo();}, timeRemaining);
        return;
      } 
    }
  }
}

document.getElementById("main-vid").addEventListener('onended',requestNextVideo());

window.onload = function() {
  console.log("onload called!!!!!!!!!");
  requestNextVideo();
};

function fullscreen() {
  var elem = document.getElementById("player");
  var requestFullScreen = elem.requestFullscreen || elem.msRequestFullscreen || elem.mozRequestFullScreen || elem.webkitRequestFullscreen;
  requestFullScreen.call(elem);
}
