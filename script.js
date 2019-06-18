function setup () {
	c = createCanvas(enlarge ? windowWidth : 512, enlarge ? windowHeight : 384);
	//noLoop();
}

function windowResized () {
	resizeCanvas(enlarge ? windowWidth : 512, enlarge ? windowHeight : 384);
}

function draw () {
	//setTimeout(redraw, 1000/(fps*fpsM));
	var wRSmaller = width/512 < height/384;
	var s = (width/512 < height/384 ? width/512 : height/384);
	if (scene === 'select') {
		background(255*0.95);
		if (selectedMap && selectedMap.hasBG && typeof(selectedMap.pictureBackground) !== "undefined" && selectedMap.pictureBackground.loaded) {
			let bgC = selectedMap.pictureBackground.img;
			let bgS = width/bgC.width > height/bgC.height ? width/bgC.width : height/bgC.height;
			image(bgC, 0, 0, bgC.width*bgS, bgC.height*bgS);
		}
		
		let spacing = 30;
		let offset = 2.5;
		
		push();
		translate(0, height/2-(selectedMapIndex+0.5)*spacing);
		if (beatmapSets.length > 0 && beatmapSets[0].maps.length > 0) {
			if (selectedMap === undefined) {
				selectedMapIndex = 0;
				selectedMap = beatmapSets[0].maps[0];
			}
			line(0, 0, width, 0);
		}
		let mapIndex = -1;
		for (let i in beatmapSets) {
			let beatmapSet = beatmapSets[i];
			for (let j in beatmapSet.maps) {
				mapIndex++;
				let map = beatmapSet.maps[j];

				// Verify background
				for (let i in map.possibleBackgrounds) {
					if (beatmapSet.backgroundFiles[map.possibleBackgrounds[i]] !== undefined) {
						let bg = beatmapSet.backgroundFiles[map.possibleBackgrounds[i]];
						if (bg.type === 'image') {
							map.pictureBackground = bg;
						} else {
							map.videoBackground = bg;
						}
						map.hasBG = true;
					}
				}
				map.possibleBackgrounds = [];

				// Verify audio
				if (typeof(map.audio) === "undefined") {
					map.audio = beatmapSet.audioFiles[map.audioName];
				}

				// Display
				line(0, (mapIndex+1)*spacing, width, (mapIndex+1)*spacing);
				push();
				fill(0, 0, 0, 255*0.9);
				rect(0, mapIndex*spacing, width, spacing);
				pop();
				if (map.mode !== '0' && map.mode !== '3') {
					push();
					textAlign(RIGHT, TOP);
					fill(255);
					text("Mode not yet supported", width, mapIndex*spacing+offset);
					pop();
				} else if (
					map.hasBG &&
					backgroundDim < 1 &&
					((typeof(map.pictureBackground) !== "undefined" ? !map.pictureBackground.loaded : false) ||
					(typeof(map.videoBackground) !== "undefined" ? !map.videoBackground.loaded : false))
				) {
					push();
					textAlign(RIGHT, TOP);
					fill(255);
					text("Loading Background...", width, mapIndex*spacing+offset);
					pop();
				} else if (!map.audio.loaded) {
					push();
					textAlign(RIGHT, TOP);
					fill(255);
					text("Loading Audio...", width, mapIndex*spacing+offset);
					pop();
				} else {
					push();
					textAlign(RIGHT, TOP);
					fill(255);
					text(map.title + " [" + map.version + "]\nA:" + map.artist + " M:" + map.creator, width, mapIndex*spacing+offset);
					pop();
					if (selectedMapIndex === mapIndex) {
						push();
						fill(0, 255, 0, 20);
						noStroke();
						rect(0, mapIndex*spacing, width, spacing);
						pop();
					}
					if (mouseY > height/2-(selectedMapIndex+0.5)*spacing+mapIndex*spacing && mouseY < height/2-(selectedMapIndex+0.5)*spacing+(mapIndex+1)*spacing) {
						push();
						fill(255, 255, 255, mouseIsPressed ? 40 : 20);
						noStroke();
						rect(0, mapIndex*spacing, width, spacing);
						pop();
						if (mouseIsPressed && !mouseDownLastFrame) {
							if (mapIndex === selectedMapIndex) {
								currentMap = map;
								actions = [];
								songPlaying = false;
								scene = 'game';
							} else {
								selectedMapIndex = mapIndex;
								selectedMap = map;
								mouseDownLastFrame = true;
							}
						}
					}
				}
			}
		}
		pop();
	} else if (scene === 'game') {
		let bg = (!disableVideo && typeof(currentMap.videoBackground) !== "undefined" ? currentMap.videoBackground : currentMap.pictureBackground);
		if (!songPlaying) {
			currentMap.audio.audio.setVolume(0.1);
			currentMap.audio.audio.play();
			if (currentMap.hasBG && backgroundDim < 1 && bg.type === 'video') {
				bg.vid.play();
			}
			songPlaying = true;
		}
		push();
		imageMode(CENTER);

		// Draw Background
		background(0);
		if (currentMap.hasBG && backgroundDim < 1) {
			let bgC = bg.type === 'image' ? bg.img : bg.vid;
			let bgS = width/bgC.width > height/bgC.height ? width/bgC.width : height/bgC.height;
			image(bgC, width/2, height/2, bgC.width*bgS, bgC.height*bgS);
			push();
			noStroke();
			fill(0, 0, 0, 255*backgroundDim);
			rect(0, 0, width, height);
			pop();
		}
		pop();
		
		currentTime = currentMap.audio.audio.currentTime()*1000; // set current time

		// Draw progression bar
		push();
		progressionBarMethods[progressionBarMethod]();
		pop();

		// Do timing points
		while (currentMap.timingPoints.length > 0 && currentMap.timingPoints[0][0]-currentMap.preempt <= currentTime) {
			currentMap.timing = currentMap.timingPoints[0];
			currentMap.timingPoints.shift();
		}

		// Add hitObjects
		while (currentMap.hitObjects.length > 0 && currentMap.hitObjects[0][2]-currentMap.preempt <= currentTime) {
			//let latency = currentMap.audio.audio.currentTime()*1000-currentMap.hitObjects[0][2];
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
						stroke(255);
						strokeWeight(r/10);
						ellipse(this.x, this.y, r*((this.time-currentTime)/currentMap.preempt*ACScale+1));
						pop();

						push();
						fill(this.color);
						stroke(255);
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
							stroke(255);
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
								stroke(255);
								strokeWeight(r/10);
								ellipse(this.x, this.y, r*((this.time-currentTime)/currentMap.preempt*ACScale+1));
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
								translate(progressionF % 2 === 1-(this.repeats%2) ? this.length*(progressionF+1)-progression*this.length : progression*this.length-this.length*(progressionF), 0);
								rotate(-this.rotation);
								noFill();
								stroke(255);
								strokeWeight(r/10);
								ellipse(0, 0, r*ACScale);
								pop();
							}
							pop();
						}
					});
				} else if (hitObject[5].startsWith("P|")) {
					let tPoses = hitObject[5].substr(2).split('|');
					let t1Pos = tPoses[0].split(':');
					let t2Pos = tPoses[1].split(':');
					//console.log(t1Pos, t2Pos);
					let duration = hitObject[7]/(100*currentMap.sliderMultiplier)*currentMap.timing[1];
					actions.unshift({
						color: type[1],
						combo: type[2],
						points: [
							createVector(
								hitObject[0],
								hitObject[1]
							),
							createVector(
								hitObject[0],
								hitObject[1]
							),
							createVector(
								parseInt(t1Pos[0]),
								parseInt(t1Pos[1])
							),
							createVector(
								parseInt(t2Pos[0]),
								parseInt(t2Pos[1])
							),
							createVector(
								parseInt(t2Pos[0]),
								parseInt(t2Pos[1])
							)
						],
						moved: 0,
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
							noFill();
							stroke(255);
							strokeWeight(r/20);
							curveA(this.points);
							
							fill(this.color);
							ellipse(this.points[0].x, this.points[0].y, r);
							ellipse(this.points[4].x, this.points[4].y, r);
							pop();

							if (currentTime <= this.time) {
								push();
								noFill();
								stroke(255);
								strokeWeight(r/10);
								ellipse(this.points[0].x, this.points[0].y, r*((this.time-currentTime)/currentMap.preempt*ACScale+1));
								textAlign(CENTER, CENTER);
								textSize(r);
								fill(0);
								text(this.combo, this.points[0].x, this.points[0].y+verticalTextOffset);
								pop();
							} else {
								push();
								fill(this.color);
								strokeWeight(r/20);
								let progression = (this.endTime-currentTime)/this.duration;
								let progressionF = Math.floor(Math.abs(progression));
								let t = progressionF % 2 === (this.repeats%2) ? (progressionF+1)-progression : progression-(progressionF);
								if (t > 0) {
									let slidePos = smoothCurveAPoint(this.points, t, 1);
									noFill();
									stroke(255);
									strokeWeight(r/10);
									ellipse(slidePos.x, slidePos.y, r*ACScale);
								}
								pop();
							}
						}
					});
				} else {
					console.log(hitObject[5][0] + "|Slider");
				}
			} else if (type[0] === 'Tap') {
				actions.unshift({
					x: Math.floor(hitObject[0]/(512/currentMap.circleSize)),
					y: hitObject[1],
					time: hitObject[2]-currentMap.preempt,
					endTime: hitObject[2],
					w: 512/currentMap.circleSize/3,
					h: 384/currentMap.circleSize/4,
					draw: function () {
						if (currentTime >= this.endTime) {
							actions.splice(actions.indexOf(this), 1);
						}

						rect(
							this.x*(this.w),
							384-this.h-(this.endTime-currentTime)/currentMap.preempt*384,
							this.w,
							this.h
						);
					}
				});
			} else if (type[0] === 'Hold') {
				actions.unshift({
					x: Math.floor(hitObject[0]/(512/currentMap.circleSize)),
					y: hitObject[1],
					time: hitObject[2]-currentMap.preempt,
					endTime: hitObject[2],
					w: 512/currentMap.circleSize/3,
					h: 384/currentMap.circleSize/4,
					draw: function() {
						if (currentTime >= this.endTime) {
							actions.splice(actions.indexOf(this), 1);
						}

						rect(
							this.x*(this.w),
							384-this.h-(this.time-currentTime)/(currentMap.preempt)*384,
							this.w,
							(this.endTime-this.time)*(currentMap.preempt/currentMap.circleSize/384)
						);
					}
				});
			} else {
				console.log(type[0]);
			}
			currentMap.hitObjects.shift();
		}

		// Draw hitObjects
		push();
		scale(s, s);
		translate(wRSmaller ? (width-512*s)/2 : 0, wRSmaller ? 0 : (height-384*s)/2);
		if (currentMap.mode === '3') {
			push();
			noStroke();
			fill(255, 0, 0);
			rect(
				0,
				384-384/currentMap.circleSize/4,
				512/3,
				384/currentMap.circleSize/4
			);
			pop();
		}
		for (let i in actions) {
			actions[i].draw();
		}
		pop();
	}

	push();
	textAlign(LEFT, BOTTOM);
	fpsTimings.push(1/((millis()-lastDraw)/1000));
	fpsTimings.shift();
	avgFPS = (function (arr) {let sum = 0; for (let i in arr) {sum += arr[i];} return sum/arr.length;})(fpsTimings);
	text("FPS: " + Math.round(avgFPS*100)/100, 0, 0, width, height);
	pop();
	lastDraw = millis();

	mouseDownLastFrame = mouseIsPressed;
}