var fps = 74;
var fpsM = 3;
var beatmapSet = {};
var scene = 'menu';
var currentMap;
var actions = [];
var songPlaying = false;
var currentTime = 0;

function resetToMenu() {
    try {
        beatmapSet.audioFiles[currentMap.audioName].audio.stop();
    } catch (err) {console.log(err)}
    scene = 'menu';
}