function onBeatmapUpload () {
	files = document.getElementById('beatmapUpload').files;
	for (var i = 0; i < files.length; i++) {
		let file = files[i];
		if (file.name.split('.').splice(-1)[0] === "osz") {
			console.log(file.name);

			var fileReader = new FileReader();
			fileReader.readAsBinaryString(file);
			fileReader.onload = () => {
				JSZip.loadAsync(fileReader.result).then((zip) => {
					resetToSelect();
					var beatmapSet = {
						maps: [],
						audioFiles: {},
						backgroundFiles: {}
					};
					for (var i in zip.files) {
						let file = zip.files[i];
						let format = file.name.split('.').splice(-1)[0];
						if (format === "mp3" || format === "wav") {
							beatmapSet.audioFiles[file.name] = {loaded: false};
							file.async('blob').then((blob) => {
								beatmapSet.audioFiles[file.name].audio = loadSound(blob, (audio) => {
									beatmapSet.audioFiles[file.name].loaded = true;
								});
							});
						} else if (format === "jpg" || format === "png") {
							beatmapSet.backgroundFiles[file.name] = {loaded: false, type: 'image'};
							file.async('base64').then((base64) => {
								beatmapSet.backgroundFiles[file.name].img = loadImage('data:image;base64,' + base64, (img) => {
									beatmapSet.backgroundFiles[file.name].loaded = true;
								});
							});
						} else if (format === "mp4") {
							beatmapSet.backgroundFiles[file.name] = {loaded: false, type: 'video'};
							file.async('base64').then((base64) => {
								beatmapSet.backgroundFiles[file.name].vid = createVideo('data:video/' + format + ';base64,' + base64, (vid) => {
									beatmapSet.backgroundFiles[file.name].vid.hide();
									beatmapSet.backgroundFiles[file.name].vid.volume(0);
									beatmapSet.backgroundFiles[file.name].loaded = true;
								});
							});
						} else if (format === "osu") {
							file.async('string').then((str) => {
								var map = {
									hitObjects: [],
									timingPoints: [],
									colors: [],
									currentColor: 0,
									combo: 1};
								let lines = str.split('\r\n');
								lines.splice(-1);
								var currentTag;
								for (var i in lines) {
									let line = lines[i];

									// Interpret line
									if (currentTag === 'General') {
										let tags = {
											"AudioFilename: ": "audioName",
											"Mode: ": "mode",
										};
										for (let tag in tags) {
											if (line.startsWith(tag)) {
												map[tags[tag]] = line.substring(tag.length);
											}
										}
									} else if (currentTag === 'Metadata') {
										let tags = {
											"Title:": "title",
											"Artist:": "artist",
											"Creator:": "creator",
											"Version:": "version"
										};
										for (let tag in tags) {
											if (line.startsWith(tag)) {
												map[tags[tag]] = line.substring(tag.length);
											}
										}
									} else if (currentTag === 'HitObjects') {
										if (map.colors.length === 0) {
											map.colors = [
												[
													242,
													198,
													109
												], [
													131,
													242,
													109
												], [
													109,
													176,
													242
												], [
													242,
													109,
													131
												]
											];
										}
										let hitObject = line.split(',');
										for (let i in hitObject) {
											if (parseInt(hitObject[i]) >= 0) {
												hitObject[i] = parseInt(hitObject[i]);
											}
										}
										let typeBin = ('00000000'+hitObject[3].toString(2)).slice(-8);
										let b = typeBin;
										hitObject.typeBin = b;
										if (b[5] === '1') {
											map.combo = 1;
											map.currentColor += 1 + parseInt(b.substring(3, -3), 2);
											map.currentColor -= Math.floor((map.currentColor)/map.colors.length)*map.colors.length;
										} else {
											map.combo++;
										}
										let type = [
											(map.mode === '0' ?
												(b[7] === '1' ?
													'Circle':
													(b[6] === '1' ?
														'Slider':
														(b[4] === '1' ?
															'Spinner' :
															undefined
														)
													)
												) :
												(map.mode === '3' ?
													(b[0] === '1' ?
														'Hold':
														(b[7] === '1' ?
															'Tap':
															undefined
														)
													):
													undefined
												)
											),
											map.colors[map.currentColor],
											map.combo
										];
										hitObject[3] = type;
										map.hitObjects.push(hitObject);
									} else if (currentTag === 'Difficulty') {
										let tags = {
											"CircleSize:" : function (sub) {
												let CS = parseInt(sub);
												map.circleSize = map.mode === '0' ? 54.4-4.48*CS : CS;
											}, "ApproachRate:": function (sub) {
												let AR = parseFloat(sub);
												map.preempt = AR < 5 ? 1200+600*(5-AR)/5 : (AR === 5 ? 1200 : 1200+750*(AR-5)/5);
												map.fadeIn = AR < 5 ? 800+400*(5-AR)/5 : (AR === 5 ? 800 : 800-500*(AR-5)/5);
											}, "SliderMultiplier:": function (sub) {
												map.sliderMultiplier = parseFloat(sub);
											}
										};
										for (let i in tags) {
											if (line.startsWith(i)) {
												tags[i](line.substring(i.length));
											}
										}
									} else if (currentTag === 'Events') {
										if (line.startsWith('//Background and Video events')) {
											map.possibleBackgrounds = [];
											try {
												map.possibleBackgrounds.push(lines[parseInt(i)+1].split(',')[2].slice(1, -1));
											} catch (err) {}
											try {
												map.possibleBackgrounds.push(lines[parseInt(i)+2].split(',')[2].slice(1, -1));
											} catch (err) {}
										}
									} else if (currentTag === 'TimingPoints') {
										var point = line.split(',');
										if (point.length > 1) {
											for (let i in point) {
												point[i] = parseFloat(point[i]);
											}
											if (point[1] < 0) {
												point[1] = map.lastPositiveMPB*(-point[1]/100);
											} else {
												map.lastPositiveMPB = point[1];
											}
											map.timingPoints.push(point);
										}
									} else if (currentTag === 'Colours') {
											var color = line.split(',');
											if (color.length === 3) {
												for (let i in color) {
													i = parseInt(i);
													let c = color[i];
													if (i === 0) {
														color[i] = parseInt(c.substring(c.lastIndexOf(' ')+1));
													} else {
														color[i] = parseInt(c);
													}
												}
												map.colors.push(color);
											}
									}

									// Update currentTag
									if (line.startsWith('[')) {
										currentTag = line.substring(
											line.lastIndexOf('[')+1,
											line.lastIndexOf(']')
										);
									}
								}
								console.log(map);
								beatmapSet.maps.push(map);
								console.log(beatmapSet);
							});
						} else {
							console.log("Unkown format: " + format);
						}
					}
					beatmapSets.push(beatmapSet);
				});
			};
		}
	}
}