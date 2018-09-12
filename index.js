function muteHTML5VideoTag() {
  var tag = document.getElementsByTagName("video")[0];
  if(tag) {
    var muteState = tag.muted;
    tag.muted = !muteState;
    playerState.muted = !playerState.muted;

  }
}

function muteYouTube() {
  if(typeof youTubePlayer !== 'undefined') {
    if(youTubePlayer.isMuted()){
      youTubePlayer.unMute();
      playerState.muted = false;
    }
    else { 
      youTubePlayer.mute();
      playerState.muted = true;
    }
  }
}

function muteVimeo() {
  if(typeof vimeoPlayer !== 'undefined'){
    vimeoPlayer.getVolume().then(function(volume) {
      if(volume != 0) {
        vimeoPlayer.setVolume(0);
        playerState.muted = true;
      } else {
        vimeoPlayer.setVolume(1);
        playerState.muted = false;
      }
    }).catch(function(error) {
        // an error occurred
    });
  }
}

function toggleMute() {
  switch(playerState.playerType) {
  case "LOCAL":
    muteHTML5VideoTag();
    break;
  case "YOUTUBE":
    muteYouTube();
    break;
  case "VIMEO":
    muteVimeo();
    break;
}

  var mute_button = document.getElementById("mute");
   if (playerState.muted == false) {
    mute_button.style.fontWeight = 'normal';
    mute_button.innerHTML = "mute";
  } else {
    mute_button.style.fontWeight = 'bold';
    mute_button.innerHTML = "unmute";
   }
}

function toggleArtistInfo() {
  var state = document.getElementById('artist-info-popup').style.display;
  if(state != "inline-block") {
    document.getElementById('artist-info-popup').style.display = "inline-block";
  } else {
    document.getElementById('artist-info-popup').style.display = "none";
  }
}

function openSchedule() {
  var week = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var d = new Date();
  var dotw = week[d.getDay()];
  var url = "schedule.html?d=" + dotw + "?t=" + playerState.videoData.startTime; 
  window.open(url, "_self");
}

function isUrl(str)
{
  regexp =  /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
        if (regexp.test(str)) {
          return true;
        }
        else {
          return false;
        }
}

//determine if video is static (in the cloud or local) or from youtube or vimeo
function getVideoSource(filePath) {
  if (isUrl(filePath)) {
    if(filePath.includes("youtube")) {
      return "YOUTUBE";
    } else if(filePath.includes("vimeo")) {
        return "VIMEO";
    } else {
        return "STATIC";
    }
  }
  else {
      return "LOCAL";
  }
}

//parse videoid from youtube URL
function findYouTubeVideoId(url) {
  var video_id = url.split('v=')[1];
  var ampersandPosition = video_id.indexOf('&');
  if(ampersandPosition != -1) {
    video_id = video_id.substring(0, ampersandPosition);
  }
  return video_id;
}

function nonEmbeddedVideoEnded() {
  document.getElementById("video-container").innerHTML = "";
  requestNextVideo();
}

function nonEmbeddedVideoTag(id, src) {
  var videoContainerDiv = document.getElementById(id);
  if(videoContainerDiv == null) {
    videoContainerDiv =  document.createElement("div");
    videoContainerDiv.id = id;
    player.appendChild(videoContainerDiv);
  }

  var tag =  "<video id=\"non-embedded-video\" preload=\"metadata\" src=\"" 
              + src 
              + "\" autoplay playsinline allowfullscreen muted onclick=\"fullscreen()\"></video>"

  videoContainerDiv.innerHTML = tag;
}

function YTLogoHider(state) {
  if(state == true) {
    var hiderDiv = document.createElement("div");
    hiderDiv.id = "youtube-hider";
    document.getElementById("player").appendChild(hiderDiv);
  } else if (state==false) {
      var hiderDiv = document.getElementById("youtube-hider");
      if (hiderDiv) {
        document.getElementById("player").removeChild(hiderDiv);
      }
  }
}

//if normal video, seek into it, if it's a bumper, cut it off if necessary
function seekOrCountdown(resp) {
  var video = document.getElementById("non-embedded-video");
  var seekTime = parseFloat(resp.seekTime) / 1000.0;
  var timeRemaining = parseInt(resp.timeRemaining);

  if(resp.videoType == "video") {
    video.currentTime = seekTime; 
    video.onended=function(){nonEmbeddedVideoEnded();}
    //setTimeout(function() {requestNextVideo();}, timeRemaining); // TODO do something about drift/overlap/buffering
  } else if(resp.videoType == "bumper") {
      setTimeout(function() { nonEmbeddedVideoEnded(); }, timeRemaining);
  }
}

function padToFitVimeo(pad){
  if(pad) { 
    document.getElementById("video-container").style.paddingBottom = "70%";
  } else {
    document.getElementById("video-container").style.paddingBottom = "0%";
  }
}

function requestNextVideo() {

  var req = new XMLHttpRequest();
  req.open("GET", "nextVideo", true);
  req.setRequestHeader("Cache-Control", "no-cache");
  req.send();

  req.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {

      var resp = this.responseText.split(',');
      resp = JSON.parse(this.responseText);

      playerState.videoData = resp;      

      switch(getVideoSource(resp.filename)) {
        case "LOCAL":
          playerState.playerType = "LOCAL";
          nonEmbeddedVideoTag("video-container", "/media/" + resp.filename);
          seekOrCountdown(resp);   
          break;
        case "STATIC":
          playerState.playerType = "STATIC";
          nonEmbeddedVideoTag("video-container", resp.filename);
          seekOrCountdown(resp);
          break;
        case "YOUTUBE":
          playerState.playerType = "YOUTUBE";
          var videoId = findYouTubeVideoId(resp.filename);
          var seekTime = parseInt(resp.seekTime/1000);
          youTubePlayer = new YT.Player('video-container', {
              height: '100%',
              width: '100%',
              disablekb: 1,
              enablejsapi: 1,
              playerVars: {
               modestbranding: 0,
               controls: 0,
               start: 403,
               fs: 0,
               showinfo: 0
              },
              events: {
                  'onReady': function(event) {
                    event.target.loadVideoById(videoId, seekTime);
                    event.target.mute();
                  },
                  'onStateChange': onPlayerStateChange
              }
          });
          break;
        case "VIMEO":
          playerState.playerType = "VIMEO";
          var seekTime = parseInt(resp.seekTime/1000);
          var options = {
            url: resp.filename,  
            width: 640,
            autoplay: true,
            muted: true,
            autopause: 0,
            portrait: false,
            background: false
          };

          vimeoPlayer = new Vimeo.Player('video-container', options);       

          vimeoPlayer.ready().then(function() {
            padToFitVimeo(true);
            vimeoPlayer.setCurrentTime(seekTime);
            vimeoPlayer.play();
            });

          vimeoPlayer.on('ended', 
            function() {
              vimeoPlayer.destroy();
              padToFitVimeo(false);
              requestNextVideo();
            });
          break;
      }
      updateVideoInfoInDOM(resp);
    }
  }
}

function updateVideoInfoInDOM(resp) {
    if(resp.videoType == "video") {
      document.getElementById("artist-info-msg").innerHTML = "NOW PLAYING: ";
      document.getElementById("artist-info-title").innerHTML = "\"" + resp.title + "\"";
      document.getElementById("artist-info-author").innerHTML = resp.author;

      var artistInfoDescriptionAuthor = document.createElement('div');
      artistInfoDescriptionAuthor.id = "artist-info-popup-author";
      artistInfoDescriptionAuthor.innerHTML = "<a href=\"" + resp.authorLink + "\">" + resp.author + "</a>";

      var artistInfoDescriptionTitle = document.createElement('div');
      artistInfoDescriptionTitle.id = "artist-info-popup-title";
      artistInfoDescriptionTitle.innerHTML = resp.title;

      var artistInfoDescription = document.getElementById("artist-info-popup-container");
      artistInfoDescription.innerHTML = "";
      artistInfoDescription.appendChild(artistInfoDescriptionTitle);
      artistInfoDescription.appendChild(artistInfoDescriptionAuthor);
      artistInfoDescription.insertAdjacentHTML('beforeend', resp.description);
    }
    else if(resp.videoType == "bumper") {
      document.getElementById("artist-info-msg").innerHTML = "stay tuned...";
      document.getElementById("artist-info-title").innerHTML = "";
      document.getElementById("artist-info-author").innerHTML = "";
      document.getElementById("artist-info-popup-container").innerHTML = "More shows coming up sooooooon, see <a onclick=\"openSchedule()\">schedule</a> for details.";
      return;
    } 
}

function ApiLoadStatus() {
      this.youtube;
      this.vimeo;
      this.checkReady = function() {
        if(this.youtube && this.vimeo) {
          requestNextVideo();
        }
      };
      this.setYouTubeStatus = function (status) {
        this.youtube = status;
        this.checkReady();
      };
      this.setVimeoStatus = function (status) {
        this.vimeo = status;
        this.checkReady();
      };
}

function playerStatus() {
  this.playerType = "LOCAL";
  this.muted = true;
  this.videoData = null;
} 

var playerState = new playerStatus();
var apiState = new ApiLoadStatus();

// ---------------------- YOUTUBE -----------------------------//
function loadYouTubeAPI() {
  var tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  tag.id = "youtubeAPI";

  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

function onYouTubeIframeAPIReady() {
    apiState.setYouTubeStatus(true);       
}

function removeYouTubeAPI() {
  var scriptTag = document.getElementById("youtubeAPI");
  if(scriptTag) {
    scriptTag.parentNode.removeChild(scriptTag);
  }
}

function onPlayerStateChange(event) {
  if(event.data == YT.PlayerState.ENDED) {
    event.target.destroy();
    console.log("onplayerstatechange ENDED");    
    requestNextVideo();
  } 
}

//--------------------------------------------------------------------//

// VIMEO ------------------------------------------------------------//
function loadVimeoAPI() {
  // vimeo tag is loaded in index.html right now...
  apiState.setVimeoStatus(true);
}
//-------------------------------------------------------------------//

window.onload = function() {
  loadYouTubeAPI();
  loadVimeoAPI();
};

function fullscreen() {
  var elem = document.getElementById("player");
  var requestFullScreen = elem.requestFullscreen || elem.msRequestFullscreen || elem.mozRequestFullScreen || elem.webkitRequestFullscreen;
  requestFullScreen.call(elem);
}
