function setup () {
	createCanvas(512, 384);
	noLoop();
}

function draw () {
	setTimeout(redraw, 1000/(fps*fpsM));
	background(255*0.95);
	if (scene === 'menu') {
		let spacing = 30;
		let offset = 2.5;
		for (var i in beatmapSet.maps) {
			i = parseInt(i);
			line(0, (i+1)*spacing, width, (i+1)*spacing);
			let map = beatmapSet.maps[i];
			if (map.mode === '0' && beatmapSet.audioFiles[map.audioName].loaded) {
				push();
				textAlign(RIGHT, TOP);
				text(map.title + " [" + map.version + "]\nA:" + map.artist + " M:" + map.creator, width, i*spacing+offset);
				pop();
				if (mouseY > i*spacing && mouseY < (i+1)*spacing) {
					push();
					fill(0, 0, 0, mouseIsPressed ? 40 : 20);
					rect(0, i*spacing, width, spacing);
					pop();
					if (mouseIsPressed) {
						currentMap = map;
						actions = [];
						songPlaying = false;
						scene = 'game';
					}
				}
			} else if (map.mode === '0') {
				push();
				textAlign(RIGHT, TOP);
				text("Loading Audio...", width, i*spacing+offset);
				pop();
			} else {
				push();
				textAlign(RIGHT, TOP);
				text("Mode not yet supported", width, i*spacing+offset);
				pop();
			}
		}
	} else if (scene === 'game') {
		if (!songPlaying) {
			beatmapSet.audioFiles[currentMap.audioName].audio.setVolume(0.3);
			beatmapSet.audioFiles[currentMap.audioName].audio.play();
			songPlaying = true;
		}
		currentTime = beatmapSet.audioFiles[currentMap.audioName].audio.currentTime()*1000;
		while (currentMap.hitObjects.length > 0 && currentMap.hitObjects[0][2]-currentMap.preempt <= currentTime) {
			//let latency = beatmapSet.audioFiles[currentMap.audioName].audio.currentTime()*1000-currentMap.hitObjects[0][2];
			let hitObject = currentMap.hitObjects[0];
			let type = hitObject[3];
			if (type[0] === 'Circle') {
				actions.unshift({
					x: hitObject[0],
					y: hitObject[1],
					time: hitObject[2],
					draw: function () {
						let r = currentMap.circleSize;

						push();
						fill(255, 255, 255, 0);
						strokeWeight(r/10);
						ellipse(this.x, this.y, r*((this.time-currentTime)/currentMap.preempt+1));
						pop();

						push();
						fill(255, 255, 255);
						strokeWeight(r/20);
						ellipse(this.x, this.y, r);
						pop();

						if (currentTime >= this.time) {
							actions.splice(actions.indexOf(this), 1);
						}
					}
				});
			} else if (type[0] === 'Slider') {
				
			} else {
				console.log(type[0]);
			}
			currentMap.hitObjects.shift();
		}
		for (var i in actions) {
			actions[i].draw();
		}
	}
}