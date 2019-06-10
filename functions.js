function showSmoothPointsOnCurve(cpx1, cpy1, x1, y1, x2, y2, cpx2, cpy2) {
  showPointsOnCurve(cpx1, cpy1, x1, y1, x2, y2, cpx2, cpy2, true);
}

function curveLength (cpx1, cpy1, x1, y1, x2, y2, cpx2, cpy2, returnArray = false, dM = 20) {
  let detail = c._pInst._curveDetail*dM;
  var lengths = [];
  for (let i = 0; i < detail; i++) {
    let step = 1/detail;
    let start = step*i;
    let end = step*(i+1);
    let sX = curvePoint(cpx1, x1, x2, cpx2, start);
    let eX = curvePoint(cpx1, x1, x2, cpx2, end);
    let sY = curvePoint(cpy1, y1, y2, cpy2, start);
    let eY = curvePoint(cpy1, y1, y2, cpy2, end);
    let w = sX-eX;
    let h = sY-eY;
    let length = Math.sqrt(Math.pow(w,2)+Math.pow(h,2));
    lengths.push(
      returnArray ? {sX: sX, sY: sY, w: w, h: h, length: length} : length
    );
	}
  if (returnArray) {
  	return lengths;
  } else {
  	return lengths.reduce(function (a, b) {return a+b;});
  }
}

function curveA (vectors) {
	beginShape();
  for (let i = vectors.length-1; i >= 0; i--) {
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

function curveAPoint (vectors, t, dM = 20, smooth = false) {
  t = 1-t;
	if (t < 0) {
		t = 0;
	}
	
	let curveALengths = curveALength(vectors, true, dM);
  let _curveALength = curveALengths.reduce(function (a, b) {return a+b;});
  let curveALengthsN = [];
  for (let i = 0; i < curveALengths.length; i++) {
    curveALengthsN.push(curveALengths[i]/_curveALength);
  }
  var currentProg = 0;
  for (let i = 0; i < curveALengthsN.length; i++) {
  	if (t >= currentProg && t <= currentProg+curveALengthsN[i]) {
    	let _t = (t-currentProg)/curveALengthsN[i];
      if (smooth) {
        return smoothCurvePoint(
        	vectors[i].x,
          vectors[i].y,
          vectors[i+1].x,
          vectors[i+1].y,
          vectors[i+2].x,
          vectors[i+2].y,
          vectors[i+3].x,
          vectors[i+3].y,
          _t
        );
      } else {
        return createVector(
          curvePoint(vectors[i].x, vectors[i+1].x, vectors[i+2].x, vectors[i+3].x, _t),
          curvePoint(vectors[i].y, vectors[i+1].y, vectors[i+2].y, vectors[i+3].y, _t)
        );
      }
    }
    currentProg += curveALengthsN[i];
  }
}

function smoothCurveAPoint (vectors, t, dM = 20) {
  return curveAPoint(vectors, t, dM, true);
}

function showPointsOnCurveA (vectors, dM = 20, smooth = false) {
  let detail = c._pInst._curveDetail;
  var length = 0;
  for (let i = 0; i <= detail; i++) {
    let step = 1/detail;
    let pos = curveAPoint(vectors, step*i, dM, smooth);
    ellipse(
      pos.x,
      pos.y,
      4,
      4
    );
  }
}

function showSmoothPointsOnCurveA (vectors, dM = 20) {
	showPointsOnCurveA(vectors, dM, true);
}

function smoothCurvePoint (cpx1, cpy1, x1, y1, x2, y2, cpx2, cpy2, t, dM = 20) {
	let detail = c._pInst._curveDetail*dM;
  let lengths = curveLength(cpx1, cpy1, x1, y1, x2, y2, cpx2, cpy2, true, dM);
  let length = 0;
  for (let i in lengths) {
    length += lengths[i].length;
  }
  let lengthsN = [0];
  for (let i = 1; i < lengths.length; i++) {
    lengthsN.push(lengthsN[i-1]+lengths[i].length/length);
  }
  lengthsN.push(1);
  for (let i = 0; i < lengthsN.length; i++) {
  	if (t >= lengthsN[i] && t <= lengthsN[i+1]) {
    	let _t = (t-lengthsN[i])/(lengthsN[i+1]-lengthsN[i]);
      let point = lengths[i];
      return createVector(
      	point.sX+point.h*_t,
        point.sY+point.w*_t
      );
    }
  }
}