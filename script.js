function setup () {
	c = createCanvas(config.enlarge ? windowWidth : 512, config.enlarge ? windowHeight : 384);
	//noLoop();
}

function windowResized () {
	resizeCanvas(config.enlarge ? windowWidth : 512, config.enlarge ? windowHeight : 384);
}

function keyPressed() {
	if (scene === 'options') {
		if (configOptionSelected !== -1 && typeof(config[configOptionSelected]) !== 'boolean') {
			let option = config[Object.keys(config)[configOptionSelected]];
			console.log(configOptionSelected);
			if (typeof(option) === 'number') {
				if (keyCode >= 48 && keyCode <= 57) {
					config[Object.keys(config)[configOptionSelected]] = parseInt(option.toString()+String.fromCharCode(keyCode));
				} else if (keyCode === 8) {
					config[Object.keys(config)[configOptionSelected]] = option.length === 1 ? 0 : parseInt(option.toString().substr(0, option.length-1));
				}
			} else if (typeof(option) === 'string') {
				if (keyCode >= 65 && keyCode <= 90) {
					config[Object.keys(config)[configOptionSelected]] += String.fromCharCode(keyCode+32);
				} else if (keyCode === 8 && option.length > 0) {
					config[Object.keys(config)[configOptionSelected]] = option.substr(0, option.length-1);
				}
			} else {
				console.log("Unkown option type: " + typeof(option));
			}
		}
	}
	return false;
}

function draw () {
	//setTimeout(redraw, 1000/(config.fps*config.fpsM));
	var wRSmaller = width/512 < height/384;
	var s = (width/512 < height/384 ? width/512 : height/384);
	if (scene === 'menu') {
		background(255, 204, 226);
		
		let circleX = menuCircleClicked ? width/3 : width/2;
		let mouseOverCircle = Math.sqrt(Math.pow(mouseX-circleX, 2)+Math.pow(mouseY-height/2, 2)) <= 155;

		push();
		if (menuCircleClicked) {
			// Draw Map Select Button
			let mouseOverMapSelect = (
				!mouseOverCircle &&
				mouseX >= width/4 &&
				mouseX <= width/4*3.75 &&
				mouseY >= height/2-62.5 &&
				mouseY <= height/2-62.5+50
			);
			fill(mouseOverMapSelect ? (mouseIsPressed ? [255, 124, 183] : [255, 132, 187]) : [255, 153, 204]);
			stroke(255);
			strokeWeight(5);
			rect(width/4, height/2-62.5, width/4*2.75, 50);

			textSize(30);
			textAlign(RIGHT, CENTER);
			noStroke();
			fill(255);
			text("Map Select", width/4*3.7, height/2-62.5+50/2)
			if (mouseOverMapSelect && mouseIsPressed && !mouseDownLastFrame) {
				resetToSelect();
				mouseDownLastFrame = true;
			}

			// Draw Options Button
			let mouseOverOptions = (
				!mouseOverCircle &&
				mouseX >= width/4 &&
				mouseX <= width/4*3.75 &&
				mouseY >= height/2+12.5 &&
				mouseY <= height/2+12.5+50
			);
			fill(mouseOverOptions ? (mouseIsPressed ? [255, 124, 183] : [255, 132, 187]) : [255, 153, 204]);
			stroke(255);
			strokeWeight(5);
			rect(width/4, height/2+12.5, width/4*2.75, 50);

			textSize(30);
			textAlign(RIGHT, CENTER);
			noStroke();
			fill(255);
			text("Options", width/4*3.7, height/2+12.5+50/2)
			if (mouseOverOptions && mouseIsPressed && !mouseDownLastFrame) {
				toOptions();
				mouseDownLastFrame = true;
			}
		}
		pop();

		push();
		fill(mouseOverCircle ? (mouseIsPressed ? [255, 124, 183] : [255, 132, 187]) : [255, 153, 204]);
		stroke(255);
		strokeWeight(5);
		ellipse(circleX, height/2, 300);

		textSize(45);
		textAlign(CENTER, CENTER);
		noStroke();
		fill(255);
		text("Osu!Online", circleX, height/2);
		if (mouseOverCircle && mouseIsPressed && !mouseDownLastFrame) {
			menuCircleClicked = !menuCircleClicked;
			mouseDownLastFrame = true;
		}
		pop();
	} else if (scene === 'options') {
		background(255, 204, 226);
		push();
		menuButton();
		textSize(45);
		textAlign(CENTER, CENTER);
		noStroke();
		fill(255);
		text("Options", width/2, 25);
		let i = -1;
		pop();
		for (key in config) {
			i++;
			let option = config[key];
			push();
			fill(255);
			noStroke();
			textSize(20);
			textAlign(RIGHT, TOP);
			text(key+": ", width/2, 45+i*25);
			pop();
			config[key] = (typeof(option) === 'boolean' ? checkBox(option, width/2, 45+i*25, 20, 20) : textArea(option, typeof(option), i, width/2, 45+i*25, 80, 20));
		}
	} else if (scene === 'select') {
		// Background
		background(255, 204, 226);
		if (selectedMap && selectedMap.hasBG && typeof(selectedMap.pictureBackground) !== "undefined" && selectedMap.pictureBackground.loaded) {
			let bgC = selectedMap.pictureBackground.img;
			let bgS = width/bgC.width > height/bgC.height ? width/bgC.width : height/bgC.height;
			image(bgC, 0, 0, bgC.width*bgS, bgC.height*bgS);
		}

		menuButton();

		// Draw maps/sets
		if (beatmapSets.length > 0) {
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
						config.backgroundDim < 100 &&
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
		} else {
			push();
			line(0, 0, width, 0);
			fill(0, 0, 0, 255*0.9);
			rect(0, 0, width, 30);
			fill(255);
			noStroke();
			textSize(20);
			textAlign(RIGHT, CENTER);
			text("No maps detected...", width-5, 30/2+config.verticalTextOffset);
			stroke(0);
			line(0, 30, width, 30);
			pop();
		}
	} else if (scene === 'game') {
		let bg = (!config.disableVideo && typeof(currentMap.videoBackground) !== "undefined" ? currentMap.videoBackground : currentMap.pictureBackground);
		if (!songPlaying) {
			currentMap.audio.audio.setVolume(0.1);
			currentMap.audio.audio.play();
			if (currentMap.hasBG && config.backgroundDim < 100 && bg.type === 'video') {
				bg.vid.play();
			}
			songPlaying = true;
		}
		push();
		imageMode(CENTER);

		// Draw Background
		background(0);
		if (currentMap.hasBG && config.backgroundDim < 100) {
			let bgC = bg.type === 'image' ? bg.img : bg.vid;
			let bgS = width/bgC.width > height/bgC.height ? width/bgC.width : height/bgC.height;
			image(bgC, width/2, height/2, bgC.width*bgS, bgC.height*bgS);
			push();
			noStroke();
			fill(0, 0, 0, 255*(config.backgroundDim/100));
			rect(0, 0, width, height);
			pop();
		}
		pop();
		
		currentTime = currentMap.audio.audio.currentTime()*1000; // set current time

		// Draw progression bar
		push();
		progressionBarMethods[config.progressionBarMethod]();
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
						ellipse(this.x, this.y, r*((this.time-currentTime)/currentMap.preempt*config.ACScale+1));
						pop();

						push();
						fill(this.color);
						stroke(255);
						strokeWeight(r/20);
						ellipse(this.x, this.y, r);
						textAlign(CENTER, CENTER);
						textSize(r);
						fill(0);
						text(this.combo, this.x, this.y+config.verticalTextOffset);
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
								ellipse(this.x, this.y, r*((this.time-currentTime)/currentMap.preempt*config.ACScale+1));
								textAlign(CENTER, CENTER);
								textSize(r);
								fill(0);
								text(this.combo, this.x, this.y+config.verticalTextOffset);
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
								ellipse(0, 0, r*config.ACScale);
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
								ellipse(this.points[0].x, this.points[0].y, r*((this.time-currentTime)/currentMap.preempt*config.ACScale+1));
								textAlign(CENTER, CENTER);
								textSize(r);
								fill(0);
								text(this.combo, this.points[0].x, this.points[0].y+config.verticalTextOffset);
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
									ellipse(slidePos.x, slidePos.y, r*config.ACScale);
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