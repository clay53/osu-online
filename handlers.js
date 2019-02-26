function onBeatmapUpload () {
	files = document.getElementById('beatmapUpload').files
	for (var i = 0; i < files.length; i++) {
		let file = files[i];
		if (file.name.split('.').splice(-1)[0] === "osz") {
			console.log(file.name);

			var fileReader = new FileReader();
			fileReader.readAsBinaryString(file);
			fileReader.onload = () => {
				var new_beatmap = new JSZip();
				JSZip.loadAsync(fileReader.result).then((zip) => {
					resetToMenu();
					beatmapSet = {
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
								var map = {hitObjects: [], timingPoints: []};
								let lines = str.split('\r\n');
								lines.splice(-1);
								var currentTag;
								for (var i in lines) {
									let line = lines[i];

									// Interpret line
									if (currentTag === 'General') {
										var tags = {
											"AudioFilename: ": "audioName",
											"Mode: ": "mode",
										}
										for (var tag in tags) {
											if (line.startsWith(tag)) {
												map[tags[tag]] = line.substring(tag.length);
											}
										}
									} else if (currentTag === 'Metadata') {
										var tags = {
											"Title:": "title",
											"Artist:": "artist",
											"Creator:": "creator",
											"Version:": "version"
										}
										for (var tag in tags) {
											if (line.startsWith(tag)) {
												map[tags[tag]] = line.substring(tag.length);
											}
										}
									} else if (currentTag === 'HitObjects') {
										let hitObject = line.split(',');
										for (var i in hitObject) {
											if (parseInt(hitObject[i]) >= 0) {
												hitObject[i] = parseInt(hitObject[i]);
											}
										}
										let typeBin = ('00000000'+hitObject[3].toString(2)).slice(-8);
										let b = typeBin;
										if (map.mode === '0') {
											let type = [
												(b[7] === '1' ?
													'Circle'
													: (b[6] === '1' ?
														'Slider':
														(b[4] === '1' ?
															'Spinner' :
															undefined
														)
													)
												)
											];
											hitObject[3] = type;
										}
										map.hitObjects.push(hitObject);
									} else if (currentTag === 'Difficulty') {
										var tags = {
											"CircleSize:" : function (sub) {
												let CS = parseInt(sub);
												map.circleSize = 54.4-4.48*CS;
											}, "ApproachRate:": function (sub) {
												let AR = parseFloat(sub);
												map.preempt = AR < 5 ? 1200+600*(5-AR)/5 : (AR === 5 ? 1200 : 1200+750*(AR-5)/5);
												map.fadeIn = AR < 5 ? 800+400*(5-AR)/5 : (AR === 5 ? 800 : 800-500*(AR-5)/5);
											}, "SliderMultiplier:": function (sub) {
												map.sliderMultiplier = parseFloat(sub);
											}
										}
										for (var i in tags) {
											if (line.startsWith(i)) {
												tags[i](line.substring(i.length));
											}
										}
									} else if (currentTag === 'TimingPoints') {
										var point = line.split(',');
										if (point.length > 1) {
											for (var i in point) {
												point[i] = parseFloat(point[i]);
											}
											if (point[1] < 0) {
												point[1] = map.lastPositiveMPB*(-point[1]/100);
											} else {
												map.lastPositiveMPB = point[1];
											}
											map.timingPoints.push(point);
										}
									} else if (currentTag === 'Events') {
										if (line.startsWith('//Background and Video events')) {
											try {
												map.hasBG = true;
												map.background = lines[parseInt(i)+1].split(',')[2].slice(1, -1);
											} catch {
												map.hasBG = false;
											}
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
				});
			}
		}
	}
}