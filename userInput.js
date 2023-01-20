let mode = "MOVE";
let MOUSE_CLICKS = [];
let running = true;


let canvasPosition = getPosition(canvas);

// take into account page scrolls and resizes
window.addEventListener("scroll", updatePosition, false);
window.addEventListener("resize", updatePosition, false);

function updatePosition() {
    canvasPosition = getPosition(canvas);
}

document.body.onmousedown = function () {
    mouseDown = true;
    doSomething();
}
document.body.onmouseup = function () {
    mouseDown = false;
    BODIES.forEach((b) => {
        b.player = false;
    });
}


document.onmousemove = function(e)
{
    mouseX = +e.clientX - +canvasPosition.x;
    mouseY = +e.clientY - +canvasPosition.y;
}


// Helper function to get an element's exact position
function getPosition(el) {
    let xPos = 0;
    let yPos = 0;

    while (el) {
        if (el.tagName == "BODY") {
            // deal with browser quirks with body/window/document and page scroll
            let xScroll = el.scrollLeft || document.documentElement.scrollLeft;
            let yScroll = el.scrollTop || document.documentElement.scrollTop;

            xPos += (el.offsetLeft - xScroll + el.clientLeft);
            yPos += (el.offsetTop - yScroll + el.clientTop);
        } else {
            // for all other non-BODY elements
            xPos += (el.offsetLeft - el.scrollLeft + el.clientLeft);
            yPos += (el.offsetTop - el.scrollTop + el.clientTop);
        }

        el = el.offsetParent;
    }
    return {
        x: xPos,
        y: yPos
    };
}


function collideTimer() {
    clickCollide = false;
}

function doSomething() {

    if (mode === "MOVE") {
        let clickBall = new Ball(mouseX, mouseY, 10, 0);
        let found = false;
        BODIES.forEach((b, index) => {
            if (collide(b, BODIES[BODIES.indexOf(clickBall)]) != false && found === false) {
                BODIES[index].player = true;
                found = true;
                mouseDiffX = +BODIES[index].position.x - +mouseX;
                mouseDiffY = +BODIES[index].position.y - +mouseY;
            }
            else {
                BODIES[index].player = false;
            }
        });
        clickBall.remove();
    }

    if (mode === "DELETE") {
        let clickBall = new Ball(mouseX, mouseY, 10, 0);
        let found = false;
        let object;
        BODIES.forEach((b, index) => {
            if (collide(b, BODIES[BODIES.indexOf(clickBall)]) != false && found === false) {
                object = b;
                found = true;
            }
        });
        clickBall.remove();
        if (found) {
            for (let i = 0; i < SPRINGS.length; i++) {
                if (SPRINGS[i].body1 == object || SPRINGS[i].body2 == object) {
                    SPRINGS[i].remove();
                    i--
                }
            }
            object.remove();
        }

    }

}

let clothSizeXContainer = document.getElementById("clothSizeXContainer");
let clothSizeXSlider = document.getElementById("clothSizeXRange");
let clothSizeXOutput = document.getElementById("clothSizeX");
clothSizeXOutput.innerHTML = clothSizeXSlider.value;

clothSizeXSlider.oninput = function () {
    clothSizeXOutput.innerHTML = this.value;
}

let clothSizeYContainer = document.getElementById("clothSizeYContainer");
let clothSizeYSlider = document.getElementById("clothSizeYRange");
let clothSizeYOutput = document.getElementById("clothSizeY");
clothSizeYOutput.innerHTML = clothSizeYSlider.value;

clothSizeYSlider.oninput = function () {
    clothSizeYOutput.innerHTML = this.value;
}

let distanceXContainer = document.getElementById("distanceXContainer");
let distanceXSlider = document.getElementById("distanceXRange");
let distanceXOutput = document.getElementById("distanceX");
distanceXOutput.innerHTML = distanceXSlider.value;

distanceXSlider.oninput = function () {
    distanceXOutput.innerHTML = this.value;
}

let distanceYContainer = document.getElementById("distanceYContainer");
let distanceYSlider = document.getElementById("distanceYRange");
let distanceYOutput = document.getElementById("distanceY");
distanceYOutput.innerHTML = distanceYSlider.value;

distanceYSlider.oninput = function () {
    distanceYOutput.innerHTML = this.value;
}

let springContainer = document.getElementById("springContainer");
let springSlider = document.getElementById("springRange");
let springOutput = document.getElementById("spring");
springOutput.innerHTML = springSlider.value;

springSlider.oninput = function () {
    springOutput.innerHTML = this.value;
}

let colorContainer = document.getElementById("colorContainer");

function clearPlayer() {
    BODIES.forEach((b, index) => {
        BODIES[index].player = false;
    });
}

function clickMove() {
    clearPlayer();
    mode = "MOVE";
    console.log("Mode changed");
}

function clickDelete() {
    clearPlayer();
    mode = "DELETE";
    console.log("Mode changed");
}


function clickGravity() {
    clearPlayer();
    if (toggleGravity === true) {
        toggleGravity = false;
    }
    else if (toggleGravity === false) {
        toggleGravity = true;
    }
    console.log("Gravity changed");
}

function drawPoints() {
    if (drawPoint === true) {
        drawPoint = false;
    }
    else if (drawPoint === false) {
        drawPoint = true;
    }
}

function pause() {
    clearPlayer();
    if (running === true) {
        running = false;
        fc.pause();
        console.log("Simulation paused");
    }
    else if (running === false) {
        running = true;
        fc.start();
        console.log("Simulation started");
    }

}