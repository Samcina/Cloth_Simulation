const BODIES = [];
const SPRINGS = [];
const COLLISIONS = [];

let width = canvas.clientWidth;
let height = canvas.clientHeight;
let render = 0;

let left = false;
let right = false;
let up = false;
let down = false;
let rotLeft = false;
let rotRight = false;
let action = false;
let toggleGravity = true;
let clickDistance = false;
let clickBounds = false;
let mouseDiffX = 0;
let mouseDiffY = 0;
let mouseDown = false;
let mouseX = 0;
let mouseY = 0;
let drawPoint = false;

// Vector class with operations
class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    set(x, y) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        return new Vector(this.x + v.x, this.y + v.y);
    }

    subtr(v) {
        return new Vector(this.x - v.x, this.y - v.y);
    }

    mag() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }

    mult(n) {
        return new Vector(this.x * n, this.y * n);
    }

    normal() {
        return new Vector(-this.y, this.x).unit();
    }

    unit() {
        if (this.mag() === 0) {
            return new Vector(0, 0);
        } else {
            return new Vector(this.x / this.mag(), this.y / this.mag());
        }
    }

    drawVec(start_x, start_y, n, color) {
        ctx.beginPath();
        ctx.moveTo(start_x, start_y);
        ctx.lineTo(start_x + this.x * n, start_y + this.y * n);
        ctx.strokeStyle = color;
        ctx.stroke();
        ctx.closePath();
    }

    static dot(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y;
    }

    static cross(v1, v2) {
        return v1.x * v2.y - v1.y * v2.x;
    }
}

// Matrix class with operations
class Matrix {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.data = [];

        for (let i = 0; i < this.rows; i++) {
            this.data[i] = [];
            for (let j = 0; j < this.cols; j++) {
                this.data[i][j] = 0;
            }
        }
    }

    multiplyVec(vec) {
        let result = new Vector(0, 0);
        result.x = this.data[0][0] * vec.x + this.data[0][1] * vec.y;
        result.y = this.data[1][0] * vec.x + this.data[1][1] * vec.y;
        return result;
    }

    rotMx22(angle) {
        this.data[0][0] = Math.cos(angle);
        this.data[0][1] = -Math.sin(angle);
        this.data[1][0] = Math.sin(angle);
        this.data[1][1] = Math.cos(angle);
    }
}

// primitive shapes
// primitive Circle shape
class Circle {
    constructor(x, y, r, color = "red") {
        this.color = color;
        this.vertices = [];
        this.position = new Vector(x, y);
        this.r = r;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.r, 0, 2 * Math.PI);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.fillStyle = "";
        ctx.closePath();
    }
}


// parent Body class
class Body {
    constructor(x, y) {
        this.components = [];
        this.position = new Vector(x, y);
        //physics constants
        this.mass = 0;
        this.inv_mass = 0;
        this.inertia = 0;
        this.inv_inertia = 0;
        this.elasticity = 0.4;

        this.friction = 0.05;
        this.angFriction = 0.01;
        this.maxSpeed = 0;
        this.color = "";

        this.velocity = new Vector(0, 0);
        this.acceleration = new Vector(0, 0);
        this.outsideForce = new Vector(0, 0);
        this.keyForce = 0.4;
        this.angKeyForce = 0.1;
        this.angle = 0;
        this.angVelocity = 0;
        this.gravity = 0.4;
        this.player = false;

        //add to array
        BODIES.push(this);
    }

    render() {
        if (this.color) {
            this.setColor(this.color)
        }
        for (let i in this.components) {
            this.components[i].draw();
        }
    }

    setColor(color) {
        this.components.forEach(components => {
            components.color = color
        })
    }

    clearForce() {
        this.outsideForce.x = 0;
        this.outsideForce.y = 0;
    }

    addForce(force) {
        if (this.mass != 0) {
            this.outsideForce = this.outsideForce.add(force);
        }
    }

    reposition(substeps) {

        let totalAcceleration = this.acceleration;
        if (this.mass != 0) {
            let outsideAcceleration = this.outsideForce.mult(1 / this.mass);
            totalAcceleration = totalAcceleration.add(outsideAcceleration);
        }
        this.velocity = this.velocity.add(totalAcceleration.mult(1 / substeps));
        this.velocity = this.velocity.mult(1 - (this.friction * (1 / substeps)));
        if (this.velocity.mag() > this.maxSpeed && this.maxSpeed !== 0) {
            this.velocity = this.velocity.unit().mult(this.maxSpeed);
        }
        this.angVelocity *= (1 - (this.angFriction * (1 / substeps)));

        if (this.mass === 0) {
            this.velocity.x = 0;
            this.velocity.y = 0;
            this.acceleration.x = 0;
            this.acceleration.y = 0;
        }
    }
    keyControl() { }
    remove() {
        if (BODIES.indexOf(this) !== -1) {
            BODIES.splice(BODIES.indexOf(this), 1);
        }
    }
    checkBounds() {
        if (this.position.x > width - this.r) {
            this.position.x = width - this.r;
        }
        if (this.position.x < this.r) {
            this.position.x = this.r;
        }
        if (this.position.y > height - this.r) {
            this.position.y = height - this.r;
        }
        if (this.position.y < this.r) {
            this.position.y = this.r;
        }
    }
}

class Spring {
    constructor(body1, body2, k, show = true) {
        this.body1 = body1;
        this.body2 = body2;
        //physics constants
        this.k = k;
        this.show = show
        this.initialLen = this.body1.position.add(this.body2.position.mult(-1)).mag();
        SPRINGS.push(this);
    }

    calculateForce() {

        let currentLen = this.body1.position.add(this.body2.position.mult(-1)).mag();
        let delta = currentLen - this.initialLen;
        if(delta === undefined) return;
        if (delta >= (1 / (this.k)**(0.3)) * 800) {
            this.remove();
        }
        let direction = this.body1.position.add(this.body2.position.mult(-1)).unit();
        this.body1.addForce(direction.mult(-delta * this.k));
        this.body2.addForce(direction.mult(delta * this.k));
    }

    remove() {
        if (SPRINGS.indexOf(this) !== -1) {
            SPRINGS.splice(SPRINGS.indexOf(this), 1);
        }
    }

    render() {
        if(this.show){
            ctx.beginPath();
            ctx.moveTo(this.body1.position.x, this.body1.position.y);
            ctx.lineTo(this.body2.position.x, this.body2.position.y);
            ctx.strokeStyle = "black";
            ctx.stroke();
            ctx.strokeStyle = "";
            ctx.closePath();
        }
    }
}




class Ball extends Body {
    constructor(x, y, r, m, color = "Red", fixed = false) {
        super(x, y);
        this.position = new Vector(x, y);
        this.components = [new Circle(x, y, r, color)];
        this.mass = m * 300;
        this.fixed = fixed;
        this.r = +r;
        if (this.mass === 0) {
            this.inv_mass = 0;
        } else {
            this.inv_mass = 1 / this.mass;
        }
    }

    setPosition(x, y, a = this.angle) {
        this.position.set(x, y);
        this.components[0].position = this.position;
    }

    reposition(substeps) {
        if (!this.player) {
            super.reposition(substeps);
            if (!this.fixed) {
                this.setPosition(this.position.add(this.velocity.mult(1 / substeps)).x, this.position.add(this.velocity.mult(1 / substeps)).y);
            }
            super.checkBounds();
        }
        else {
            this.velocity.x = 0;
            this.velocity.y = 0;
        }
    }

    keyControl() {
        if (this.player) {
            if (mouseDown && !this.fixed) {
                let newPositionX = mouseX + mouseDiffX;
                let newPositionY = mouseY + mouseDiffY;
                if(+newPositionX + +this.r > width) {
                    newPositionX = width - this.r;
                }
                if(+newPositionX - +this.r < 0) {
                    newPositionX = this.r;
                }
                if(+newPositionY + +this.r > height) {
                    newPositionY = height - this.r;
                }
                if(+newPositionY - +this.r < 0) {
                    newPositionY = this.r;
                }
                this.setPosition(+newPositionX, +newPositionY);
            }
            else {
                this.player = false;
            }

        }
        this.acceleration.x = 0;
        this.acceleration.y = this.gravity;
        if (toggleGravity === false) {
            this.acceleration.y = 0;
        }
    }
}

//Collision manifold, consisting the data for collision handling
//Manifolds are collected in an array for every frame
class CollData {
    constructor(o1, o2, normal, pen, cp) {
        this.o1 = o1;
        this.o2 = o2;
        this.normal = normal;
        this.pen = pen;
        this.cp = cp;
    }

    penRes() {
        let penResolution = this.normal.mult(this.pen / (this.o1.inv_mass + this.o2.inv_mass));
        this.o1.position = this.o1.position.add(penResolution.mult(this.o1.inv_mass * 1.01));
        this.o2.position = this.o2.position.add(penResolution.mult(-this.o2.inv_mass * 1.01));
        this.o1.checkBounds();
        this.o2.checkBounds();
    }

    collRes() {

        let collArm1 = this.cp.subtr(this.o1.components[0].position);
        let rotVel1 = new Vector(-this.o1.angVelocity * collArm1.y, this.o1.angVelocity * collArm1.x);
        let closVel1 = this.o1.velocity.add(rotVel1);
        let collArm2 = this.cp.subtr(this.o2.components[0].position);
        let rotVel2 = new Vector(-this.o2.angVelocity * collArm2.y, this.o2.angVelocity * collArm2.x);
        let closVel2 = this.o2.velocity.add(rotVel2);

        let impAug1 = Vector.cross(collArm1, this.normal);
        impAug1 = impAug1 * this.o1.inv_inertia * impAug1;
        let impAug2 = Vector.cross(collArm2, this.normal);
        impAug2 = impAug2 * this.o2.inv_inertia * impAug2;

        let relVel = closVel1.subtr(closVel2);
        let sepVel = Vector.dot(relVel, this.normal);
        let new_sepVel = -sepVel * Math.min(this.o1.elasticity, this.o2.elasticity);
        let vsep_diff = new_sepVel - sepVel;

        let impulse = vsep_diff / (this.o1.inv_mass + this.o2.inv_mass + impAug1 + impAug2);
        let impulseVec = this.normal.mult(impulse);

        this.o1.velocity = this.o1.velocity.add(impulseVec.mult(this.o1.inv_mass));
        this.o2.velocity = this.o2.velocity.add(impulseVec.mult(-this.o2.inv_mass));

        this.o1.angVelocity += this.o1.inv_inertia * Vector.cross(collArm1, impulseVec);
        this.o2.angVelocity -= this.o2.inv_inertia * Vector.cross(collArm2, impulseVec);
    }
}

//Separating axis theorem on two objects
//Returns with the details of the Minimum Translation Vector (or false if no collision)
function sat(o1, o2) {
    let minOverlap = null;
    let smallestAxis;
    let vertexObj;

    let axes = findAxes(o1, o2);
    let proj1, proj2 = 0;
    let firstShapeAxes = getShapeAxes(o1);

    for (let i = 0; i < axes.length; i++) {
        proj1 = projShapeOntoAxis(axes[i], o1);
        proj2 = projShapeOntoAxis(axes[i], o2);
        let overlap = Math.min(proj1.max, proj2.max) - Math.max(proj1.min, proj2.min);
        if (overlap < 0) {
            return false;
        }

        if ((proj1.max > proj2.max && proj1.min < proj2.min) ||
            (proj1.max < proj2.max && proj1.min > proj2.min)) {
            let mins = Math.abs(proj1.min - proj2.min);
            let maxs = Math.abs(proj1.max - proj2.max);
            if (mins < maxs) {
                overlap += mins;
            } else {
                overlap += maxs;
                axes[i] = axes[i].mult(-1);
            }
        }

        if (overlap < minOverlap || minOverlap === null) {
            minOverlap = overlap;
            smallestAxis = axes[i];
            if (i < firstShapeAxes) {
                vertexObj = o2;
                if (proj1.max > proj2.max) {
                    smallestAxis = axes[i].mult(-1);
                }
            } else {
                vertexObj = o1;
                if (proj1.max < proj2.max) {
                    smallestAxis = axes[i].mult(-1);
                }
            }
        }
    };

    let contactVertex = projShapeOntoAxis(smallestAxis, vertexObj).collVertex;

    if (vertexObj === o2) {
        smallestAxis = smallestAxis.mult(-1);
    }

    return {
        pen: minOverlap,
        axis: smallestAxis,
        vertex: contactVertex
    }
}

//Helping functions for the SAT below
//returns the min and max projection values of a shape onto an axis
function projShapeOntoAxis(axis, obj) {
    setBallVerticesAlongAxis(obj, axis);
    let min = Vector.dot(axis, obj.vertices[0]);
    let max = min;
    let collVertex = obj.vertices[0];
    for (let i = 0; i < obj.vertices.length; i++) {
        let p = Vector.dot(axis, obj.vertices[i]);
        if (p < min) {
            min = p;
            collVertex = obj.vertices[i];
        }
        if (p > max) {
            max = p;
        }
    }
    return {
        min: min,
        max: max,
        collVertex: collVertex
    }
}

//finds the projection axes for the two objects
function findAxes(o1, o2) {
    let axes = [];
    if (o1 instanceof Circle && o2 instanceof Circle) {
        if (o2.position.subtr(o1.position).mag() > 0) {
            axes.push(o2.position.subtr(o1.position).unit());
        } else {
            axes.push(new Vector(Math.random(), Math.random()).unit());
        }
        return axes;
    }
    if (o1 instanceof Circle) {
        axes.push(closestVertexToPoint(o2, o1.position).subtr(o1.position).unit());
    }
    if (o2 instanceof Circle) {
        axes.push(closestVertexToPoint(o1, o2.position).subtr(o2.position).unit());
    }
    return axes;
}

//iterates through an objects vertices and returns the one that is the closest to the given point
function closestVertexToPoint(obj, p) {
    let closestVertex;
    let minDist = null;
    for (let i = 0; i < obj.vertices.length; i++) {
        if (p.subtr(obj.vertices[i]).mag() < minDist || minDist === null) {
            closestVertex = obj.vertices[i];
            minDist = p.subtr(obj.vertices[i]).mag();
        }
    }
    return closestVertex;
}

//returns the number of the axes that belong to an object
function getShapeAxes(obj) {
    if (obj instanceof Circle || obj instanceof Line) {
        return 1;
    }
    if (obj instanceof Rectangle) {
        return 2;
    }
    if (obj instanceof Triangle) {
        return 3;
    }
}

//the ball vertices always need to be recalculated based on the current projection axis direction
function setBallVerticesAlongAxis(obj, axis) {
    if (obj instanceof Circle) {
        obj.vertices[0] = obj.position.add(axis.unit().mult(-obj.r));
        obj.vertices[1] = obj.position.add(axis.unit().mult(obj.r));
    }
}

function collide(o1, o2) {
    let bestSat = {
        pen: null,
        axis: null,
        vertex: null
    }
    for (let o1comp = 0; o1comp < o1.components.length; o1comp++) {
        for (let o2comp = 0; o2comp < o2.components.length; o2comp++) {
            if (sat(o1.components[o1comp], o2.components[o2comp]).pen > bestSat.pen) {
                bestSat = sat(o1.components[o1comp], o2.components[o2comp]);
            }
        }
    }
    if (bestSat.pen !== null) {
        return bestSat;
    } else {
        return false;
    }
}


function userInteraction() {
    BODIES.forEach((b) => {
        b.keyControl();
    })
}

function physicsLoop() {

    let substeps = 128;
    if (BODIES.length >= 100) {
        substeps = 64;
    }
    if (BODIES.length >= 300) {
        substeps = 32;
    }
    if (BODIES.length >= 500) {
        substeps = 16;
    }
    if (BODIES.length >= 1000) {
        substeps = 8;
    }



    for (let step = 0; step < substeps; step++) {
        BODIES.forEach((b) => {
            b.clearForce();
        });

        SPRINGS.forEach((s) => {
            s.calculateForce();
        });

        BODIES.forEach((b) => {
            b.reposition(substeps);
        });
    }

}

function renderLoop() {
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    SPRINGS.forEach((s) => {
        s.render();
    });
    BODIES.forEach((b) => {
        if(drawPoint) {
            b.render();
        }
    });
    if (clickDistance === true) {
        ctx.fillStyle = "red";
        ctx.font = '15px "JetBrains Mono",monospace';
        ctx.fillText('Distance cannot be smaller than half of the radius', 25, 25);
    }
    if (clickBounds === true) {
        ctx.fillStyle = "red";
        ctx.font = '15px "JetBrains Mono",monospace';
        ctx.fillText('Generating would put the cloth out of bounds', 25, 25);
    }

}

function mainLoop() {
    userInteraction();
    physicsLoop();
    renderLoop();
}

