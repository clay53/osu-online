function showPointsOnCurve(cpx1, cpy1, x1, y1, x2, y2, cpx2, cpy2) {
  let detail = c._pInst._curveDetail;
  var length = 0;
  for (let i = 0; i < detail; i++) {
    let step = 1/detail;
    let start = step*i;
    let end = step*(i+1);
    push();
    noStroke();
    fill(255);
    ellipse(
      curvePoint(cpx1, x1, x2, cpx2, start),
      curvePoint(cpy1, y1, y2, cpy2, start),
      4,
      4
    );
    pop();
  }
}

function curveLength (cpx1, cpy1, x1, y1, x2, y2, cpx2, cpy2, dM = 20) {
  let detail = c._pInst._curveDetail*dM;
  var length = 0;
  for (let i = 0; i < detail; i++) {
    let step = 1/detail;
    let start = step*i;
    let end = step*(i+1);
    length += Math.sqrt(
      Math.pow(
        (
          curvePoint(cpx1, x1, x2, cpx2, start)-
          curvePoint(cpx1, x1, x2, cpx2, end)
        ),
        2
      )+
      Math.pow(
        (
          curvePoint(cpy1, y1, y2, cpy2, start)-
          curvePoint(cpy1, y1, y2, cpy2, end)
        ),
        2
      )
    );
	}
  return length;
}

function curveA (vectors) {
	beginShape();
  for (var i in vectors) {
    let vector = vectors[i];
    curveVertex(vector.x, vector.y);
  }
  endShape();
}

function curveALength (vectors, returnArray = false, dM = 20) {
  let curveALengths = [];
  for (let i = 0; i < vectors.length-3; i++) {
    let detail = c._pInst._curveDetail*dM;
    curveALengths.push(0);
    for (let j = 0; j < detail; j++) {
      let step = 1/detail;
      let start = step*j;
      let end = step*(j+1);
      curveALengths[i] += Math.sqrt(
        Math.pow(
          (
            curvePoint(vectors[i].x, vectors[i+1].x, vectors[i+2].x, vectors[i+3].x, start)-
            curvePoint(vectors[i].x, vectors[i+1].x, vectors[i+2].x, vectors[i+3].x, end)
          ),
          2
        )+
        Math.pow(
          (
            curvePoint(vectors[i].y, vectors[i+1].y, vectors[i+2].y, vectors[i+3].y, start)-
            curvePoint(vectors[i].y, vectors[i+1].y, vectors[i+2].y, vectors[i+3].y, end)
          ),
          2
        )
      );
    }
  	// showPointsOnCurve(
  	// vectors[i].x,
  	// vectors[i].y,
  	// vectors[i+1].x,
  	// vectors[i+1].y,
  	// vectors[i+2].x,
  	// vectors[i+2].y,
  	// vectors[i+3].x,
  	// vectors[i+3].y
  	// );
  }
  if (returnArray) {
  	return curveALengths;
  } else {
  	return curveALengths.reduce(function (a, b) {return a+b;});
  }
}

function curveAPoint (vectors, t, dM = 20) {
  t = 1-t;
	let curveALengths = curveALength(vectors, true, dM);
  let _curveALength = curveALengths.reduce(function (a, b) {return a+b;});
  let curveALengthsN = [0];
  for (let i = 1; i < curveALengths.length; i++) {
    curveALengthsN.push(curveALengthsN[i-1]+curveALengths[i]/_curveALength);
  }
  curveALengthsN.push(1);
  for (let i = 0; i < curveALengthsN.length; i++) {
  	if (t >= curveALengthsN[i] && t <= curveALengthsN[i+1]) {
    	let _t = (t-curveALengthsN[i])/(curveALengthsN[i+1]-curveALengthsN[i]);
      return createVector(
      	curvePoint(vectors[i].x, vectors[i+1].x, vectors[i+2].x, vectors[i+3].x, _t),
        curvePoint(vectors[i].y, vectors[i+1].y, vectors[i+2].y, vectors[i+3].y, _t)
      );
    }
  }
}

function showPointsOnCurveA(vectors, dM = 20) {
  let detail = c._pInst._curveDetail;
  var length = 0;
  for (let i = 0; i < detail; i++) {
    let step = 1/detail;
    let pos = curveAPoint(vectors, step*i, dM);
    let end = step*(i+1);
    push();
    noStroke();
    fill(255);
    ellipse(
      pos.x,
      pos.y,
      4,
      4
    );
    pop();
  }
}