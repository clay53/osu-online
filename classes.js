progressionBarMethods = {
    "none": function(){},
    "line": function () {
        let audio = currentMap.audio.audio;
        noStroke();
        fill(255, 225, 79, 255*0.1);
        rect(0, height-10, width, 10);
        fill(255, 225, 79);
        rect(0, height-10, width*(audio.currentTime()/audio.duration()), 10);
    }
}