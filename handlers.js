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
					beatmapSet = {
						maps: []
					};
					for (var i in zip.files) {
						let file = zip.files[i];
						let format = file.name.split('.').splice(-1)[0];
						if (format === "osu") {
							file.async("string").then(
								(str) => {
									var map = {hitObjects: []};
									let lines = str.split('\r\n');
									lines.splice(-1);
									var currentTag;
									for (var i in lines) {
										let line = lines[i];

										// Interpret line
										if (currentTag === "General") {
											if (line.startsWith("Mode:")) {
												map.mode = parseInt(line.substring("Mode:".length));
											}
										} else if (currentTag === "Metadata") {
											var tags = {
												"Title:": "title",
												"Artist:": "artist",
												"Creator:": "creator",
												"Version:": "difficulty"
											}
											for (var tag in tags) {
												if (line.startsWith(tag)) {
													map[tags[tag]] = line.substring(tag.length);
												}
											}
										} else if (currentTag === "HitObjects") {
											let hitObject = line.split(',');
											for (var i in hitObject) {
												if (parseInt(hitObject[i]) >= 0) {
													hitObject[i] = parseInt(hitObject[i]);
												}
											}
											// let typeBin = ('00000000'+hitObject[3].toString(2)).slice(-8);
											// let b = typeBin;
											// if (map.mode === 0) {
											// 	let type = [
											// 		(b[7] === '1' ?
											// 			"Circle"
											// 			: (b[6] === '1' ?
											// 				"Slider":
											// 				(b[4] === '1' ?
											// 					"Spinner" :
											// 					undefined
											// 				)
											// 			)
											// 		)
											// 	];
											// }
											map.hitObjects.push(hitObject);
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
								}
							);
						}
					}
				});
			}
		}
	}
}