var c;

var beatmapSets = [];
var selectedMapIndex;
var selectedMap;
var scene = 'menu';
var currentMap;
var actions = [];
var songPlaying = false;
var currentTime = 0;

var fpsTimings = (function () {let arr = []; for (let i = 0; i < config.fps*config.fpsM; i++) {arr.push([config.fps*config.fpsM]);} return arr;})(); // Create & fill array
var lastDraw = 0;

var mouseDownLastFrame = false;

function resetToSelect() {
    try {
        currentMap.audio.audio.stop();
    } catch (err) {console.log("Warn: ", err);}
    scene = 'select';
}