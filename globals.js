var c;

var beatmapSet = {};
var scene = 'menu';
var currentMap;
var actions = [];
var songPlaying = false;
var currentTime = 0;

var fpsTimings = (function () {let arr = []; for (let i = 0; i < fps*fpsM; i++) {arr.push([fps*fpsM]);} return arr;})(); // Create & fill array
var lastDraw = 0;

function resetToMenu() {
    try {
        beatmapSet.audioFiles[currentMap.audioName].audio.stop();
    } catch (err) {console.log("Warn: ", err);}
    try { 
        beatmapSet.backgroundFiles[currentMap.background].remove();
    } catch (err) {console.log("Warn: ", err);}
    scene = 'menu';
}