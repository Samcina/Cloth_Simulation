const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.focus();

let clothSizeX = 10;
let clothSizeY = 8;
let distanceX = 30;
let distanceY = 30;
let ballSize = 2;
let springStrength = 200;

function generateCloth() {
	
	console.log("Generating:");
	BODIES.splice(0, BODIES.length);
	SPRINGS.splice(0, SPRINGS.length);

	let clothSizeXSlider = document.getElementById("clothSizeXRange");
	let clothSizeYSlider = document.getElementById("clothSizeYRange");
	let distanceXSlider = document.getElementById("distanceXRange");
	let distanceYSlider = document.getElementById("distanceYRange");
	let springSlider = document.getElementById("springRange");
	let color = document.getElementById("color");

	let initialSpawnX = (width / 2) - +distanceXSlider.value * ((+clothSizeXSlider.value - 1) / 2);
	let initialSpawnY = 50;

	clickDistance = false;
	clickBounds = false;

	if (ballSize * 2 > +distanceXSlider.value || ballSize * 2 > +distanceYSlider.value) {
		clickDistance = true;
		return;
	}

	if (+distanceXSlider.value * clothSizeXSlider.value >= canvas.clientWidth ||
		initialSpawnY + +distanceYSlider.value * clothSizeYSlider.value >= canvas.clientHeight) {
		clickBounds = true;
		return;
	}


	for (let i = 0; i < +clothSizeYSlider.value; i++) {
		for (let j = 0; j < +clothSizeXSlider.value; j++) {
			if (i == 0) {
				new Ball(initialSpawnX + +distanceXSlider.value * j, initialSpawnY + +distanceYSlider.value * i, ballSize, 0, color.value, true);
			}
			else {
				new Ball(initialSpawnX + +distanceXSlider.value * j, initialSpawnY + +distanceYSlider.value * i, ballSize, 10, color.value);
			}
		}
	}

	for (let i = 0; i < +clothSizeYSlider.value; i++) {
		for (let j = 0; j < +clothSizeXSlider.value; j++) {
			if ((j + 1) < +clothSizeXSlider.value) { //right
				new Spring(BODIES[i * +clothSizeXSlider.value + j], BODIES[i * +clothSizeXSlider.value + j + 1], +springSlider.value);
			}
			if ((i - 1) >= 0) { //top
				new Spring(BODIES[i * +clothSizeXSlider.value + j], BODIES[(i - 1) * +clothSizeXSlider.value + j], +springSlider.value);
			}
			if ((j + 1) < +clothSizeXSlider.value && (i - 1) >= 0) { //top right
				new Spring(BODIES[i * +clothSizeXSlider.value + j], BODIES[(i - 1) * +clothSizeXSlider.value + j + 1], +springSlider.value);
			}
			if ((j + 1) < +clothSizeXSlider.value && (i + 1) < clothSizeYSlider.value) { //bottom right
				new Spring(BODIES[i * +clothSizeXSlider.value + j], BODIES[(i + 1) * +clothSizeXSlider.value + j + 1], +springSlider.value);
			}
			if ((j + 2) < +clothSizeXSlider.value) { //right right
				new Spring(BODIES[i * +clothSizeXSlider.value + j], BODIES[i * +clothSizeXSlider.value + j + 2], +springSlider.value, true);
			}
			if ((i - 2) >= 0) { //top top
				new Spring(BODIES[i * +clothSizeXSlider.value + j], BODIES[(i - 2) * +clothSizeXSlider.value + j], +springSlider.value, true);
			}

		}
	}

}




function FpsCtrl(fps, callback) {

	var delay = 1000 / fps,
		time = null,
		frame = -1,
		tref;

	function loop(timestamp) {
		if (time === null) time = timestamp;
		var seg = Math.floor((timestamp - time) / delay);
		if (seg > frame) {
			frame = seg;
			callback({
				time: timestamp,
				frame: frame
			})
		}
		tref = requestAnimationFrame(loop)
	}

	this.isPlaying = false;

	this.frameRate = function (newfps) {
		if (!arguments.length) return fps;
		fps = newfps;
		delay = 1000 / fps;
		frame = -1;
		time = null;
	};

	this.start = function () {
		if (!this.isPlaying) {
			this.isPlaying = true;
			tref = requestAnimationFrame(loop);
		}
	};

	this.pause = function () {
		if (this.isPlaying) {
			cancelAnimationFrame(tref);
			this.isPlaying = false;
			time = null;
			frame = -1;
		}
	};
}

var fc = new FpsCtrl(60, function (e) {
	mainLoop();
});

fc.start();