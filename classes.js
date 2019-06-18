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

function menuButton() {
    // Draw Menu Button
    push();
    let mouseOverBackButton = (
        mouseX <= 70 &&
        mouseY >= height-30
    );
    fill(mouseOverBackButton ? (mouseIsPressed ? [255, 124, 183] : [255, 132, 187]) : [255, 153, 204]);
    stroke(255);
    strokeWeight(5);
    rect(0, height-30, 70, 30);

    textSize(20);
    textAlign(CENTER, CENTER);
    noStroke();
    fill(255);
    text("Menu", 70/2, height-30/2);
    if (mouseOverBackButton && mouseIsPressed && !mouseDownLastFrame) {
        toMenu();
        mouseDownLastFrame = true;
    }
    pop();
}

function checkBox(value, x, y, w, h) {
    push();
    stroke(255);
    strokeWeight(2);
    fill(value ? [255, 124, 183] : [255, 204, 226]);
    rect(x, y, w, h);
    pop();
    if (
        mouseIsPressed &&
        !mouseDownLastFrame &&
        mouseX >= x &&
        mouseX <= x+w &&
        mouseY >= y &&
        mouseY <= y+h
    ) {
        mouseDownLastFrame = true;
        return !value;
    } else {
        return value;
    }
}

function textArea(value, type, i, x, y, w, h) {
    push();
    stroke(255);
    strokeWeight(2);
    fill(i===configOptionSelected ? [255, 226, 239] : [255, 244, 249]);
    rect(x, y, w, h);
    noStroke();
    fill(0)
    textSize(h*0.8);
    textAlign(LEFT, CENTER);
    text(value, x+w*0.05, y+h/2+config.verticalTextOffset);
    pop();
    if (
        i !== configOptionSelected &&
        mouseIsPressed &&
        !mouseDownLastFrame &&
        mouseX >= x &&
        mouseX <= x+w &&
        mouseY >= y &&
        mouseY <= y+h
    ) {
        mouseDownLastFrame = true;
        configOptionSelected = i;
    } else {
    }
    return value;
}