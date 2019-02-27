function setup () {
	createCanvas(enlarge ? windowWidth : 512, enlarge ? windowHeight : 384);
	noLoop();
}

function windowResized () {
	resizeCanvas(enlarge ? windowWidth : 512, enlarge ? windowHeight : 384);
}

function draw () {
	setTimeout(redraw, 1000/(fps*fpsM));
	var wRSmaller = width/512 < height/384;
	var s = width/512 < height/384 ? width/512 : height/384;
	if (scene === 'menu') {
		background(255*0.95);
		let spacing = 30;
		let offset = 2.5;
		for (var i in beatmapSet.maps) {
			i = parseInt(i);
			line(0, (i+1)*spacing, width, (i+1)*spacing);
			let map = beatmapSet.maps[i];
			if (map.mode != '0') {
				push();
				textAlign(RIGHT, TOP);
				text("Mode not yet supported", width, i*spacing+offset);
				pop();
			} else if (map.hasBG && showBG && !beatmapSet.backgroundFiles[map.background].loaded) {
				push();
				textAlign(RIGHT, TOP);
				text("Loading Background...", width, i*spacing+offset);
				pop();
			} else if (!beatmapSet.audioFiles[map.audioName].loaded) {
				push();
				textAlign(RIGHT, TOP);
				text("Loading Audio...", width, i*spacing+offset);
				pop();
			} else {
				push();
				textAlign(RIGHT, TOP);
				text(map.title + " [" + map.version + "]\nA:" + map.artist + " M:" + map.creator, width, i*spacing+offset);
				pop();
				if (mouseY > i*spacing && mouseY < (i+1)*spacing) {
					push();
					fill(0, 0, 0, mouseIsPressed ? 40 : 20);
					noStroke();
					rect(0, i*spacing, width, spacing);
					pop();
					if (mouseIsPressed) {
						currentMap = map;
						actions = [];
						songPlaying = false;
						scene = 'game';
					}
				}
			}
		}
	} else if (scene === 'game') {
		let bg = beatmapSet.backgroundFiles[currentMap.background];
		if (!songPlaying) {
			beatmapSet.audioFiles[currentMap.audioName].audio.setVolume(0.3);
			beatmapSet.audioFiles[currentMap.audioName].audio.play();
			if (currentMap.hasBG && showBG && bg.type === 'video') {
				bg.vid.play();
			}
			songPlaying = true;
		}
		push();
		imageMode(CENTER);
		if (currentMap.hasBG && showBG && bg.type === 'image') {
			let bgS = width/bg.img.width > height/bg.img.height ? width/bg.img.width : height/bg.img.height;
			background(0);
			image(bg.img, width/2, height/2, bg.img.width*bgS, bg.img.height*bgS);
		} else if (currentMap.hasBG && showBG && bg.type === 'video') {
			let bgS = width/bg.vid.width > height/bg.vid.height ? width/bg.vid.width : height/bg.vid.height;
			background(0);
			image(bg.vid, width/2, height/2, bg.vid.width*bgS, bg.vid.height*bgS);
		} else {
			background(255*0.95);
		}
		pop();
		currentTime = beatmapSet.audioFiles[currentMap.audioName].audio.currentTime()*1000;
		while (currentMap.timingPoints.length > 0 && currentMap.timingPoints[0][0]-currentMap.preempt <= currentTime) {
			currentMap.timing = currentMap.timingPoints[0];
			currentMap.timingPoints.shift();
		}
		while (currentMap.hitObjects.length > 0 && currentMap.hitObjects[0][2]-currentMap.preempt <= currentTime) {
			//let latency = beatmapSet.audioFiles[currentMap.audioName].audio.currentTime()*1000-currentMap.hitObjects[0][2];
			let hitObject = currentMap.hitObjects[0];
			let type = hitObject[3];
			if (type[0] === 'Circle') {
				actions.unshift({
					color: type[1],
					combo: type[2],
					x: hitObject[0],
					y: hitObject[1],
					time: hitObject[2],
					draw: function () {
						if (currentTime >= this.time) {
							actions.splice(actions.indexOf(this), 1);
						}

						let r = currentMap.circleSize;

						push();
						fill(255, 255, 255, 0);
						strokeWeight(r/10);
						ellipse(this.x, this.y, r*((this.time-currentTime)/currentMap.preempt+1));
						pop();

						push();
						fill(this.color);
						strokeWeight(r/20);
						ellipse(this.x, this.y, r);
						textAlign(CENTER, CENTER);
						textSize(r);
						fill(0);
						text(this.combo, this.x, this.y+verticalTextOffset);
						pop();
					}
				});
			} else if (type[0] === 'Slider') {
				if (hitObject[5].startsWith("L|")) {
					let tPos = hitObject[5].substr(2).split(':');
					let distX = hitObject[0]-tPos[0];
					let distY = hitObject[1]-tPos[1];
					let duration = hitObject[7]/(100*currentMap.sliderMultiplier)*currentMap.timing[1];
					actions.unshift({
						color: type[1],
						combo: type[2],
						x: hitObject[0],
						y: hitObject[1],
						tX: tPos[0],
						tY: tPos[1],
						distX: distX,
						distY: distY,
						moved: 0,
						rotation: Math.atan2(distY, distX)*180/Math.PI-180,
						length: Math.sqrt(distX*distX+distY*distY),
						time: hitObject[2],
						endTime: hitObject[2]+duration*hitObject[6],
						duration: duration,
						repeats: hitObject[6],
						draw: function () {
							if (currentTime >= this.endTime) {
								actions.splice(actions.indexOf(this), 1);
							}

							let r = currentMap.circleSize;

							push();
							fill(this.color);
							strokeWeight(r/20);

							push();
							translate(this.x, this.y);
							angleMode(DEGREES);
							rotate(this.rotation);
							rect(
								0,
								-r/2,
								this.length,
								r
							);
							pop();

							ellipse(this.x, this.y, r);
							ellipse(this.tX, this.tY, r);

							if (currentTime <= this.time) {
								push();
								noFill();
								strokeWeight(r/10);
								ellipse(this.x, this.y, r*((this.time-currentTime)/currentMap.preempt+1));
								textAlign(CENTER, CENTER);
								textSize(r);
								fill(0);
								text(this.combo, this.x, this.y+verticalTextOffset);
								pop();
							} else {
								push();
								translate(this.x, this.y);
								angleMode(DEGREES);
								rotate(this.rotation);
								strokeWeight(r/10);
								let progression = (this.endTime-currentTime)/this.duration;
								let progressionF = Math.floor(Math.abs(progression));
								translate(progressionF % 2 === 0 ? this.length*(progressionF+1)-progression*this.length : progression*this.length-this.length*(progressionF), 0);
								rotate(-this.rotation);
								ellipse(0, 0, r);
								textAlign(CENTER, CENTER);
								textSize(r);
								fill(0);
								text(this.combo, 0, 0+verticalTextOffset);
								pop();
							}
							pop();
						}
					});
				} else {
					console.log(hitObject[5][0] + "|Slider");
				}
			} else {
				console.log(type[0]);
			}
			currentMap.hitObjects.shift();
		}
		for (var i in actions) {
			push();
			scale(s, s);
			translate(wRSmaller ? (width-512*s)/2 : 0, wRSmaller ? 0 : (height-384*s)/2);
			actions[i].draw();
			pop();
		}
	}
}