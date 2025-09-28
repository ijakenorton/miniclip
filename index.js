const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

const height = canvas.height
const width = canvas.width

const PLAYER_START_VELOCITY = 100
const PLAYER_START_HEIGHT = height / 2
const EPSILON = 0.000001

let all_offset = 0

let prevTimestamp = 0
let deltaTime = 0

const state = {
    background_speed: 1,
    gravity: 800,
    floor: {
        colour: "yellow",
        x: 0,
        y: height / 2 + 40,
        width: width,
        height: height / 20,
    },
    arrows: []
}

function lerp(from, to, weight) {
    return from + (to - from) * weight
}

function float_equals(x, y) {
    return Math.abs(x - y) <= (EPSILON * Math.max(1, Math.max(Math.abs(x), Math.abs(y))));
}

function apply_gravity(velocity) {
    return velocity + (state.gravity * deltaTime)
}

function clear_screen(colour) {
    ctx.fillStyle = colour
    ctx.fillRect(0, 0, width, height)
}


class Player {
    constructor(ctx) {
	this.colour = "white";
	this.x = 20;
	this.y = height / 2;
	this.velocityY = 0;  
	this.width = 20;
	this.height = 40;
	this.ctx = ctx
	this.jump_height = 100;
	this.jump_time_to_peak = 0.5;
	this.jump_time_to_descent = 0.3;
	this.update_jump_values()
    }

    reset() {
	y = PLAYER_START_HEIGHT
	velocityY = 0  
    }

    update_jump_values() {
	this.jump_velocity = ((2.0 * this.jump_height) / this.jump_time_to_peak) * -1.0;
	this.jump_gravity = ((-2.0 * this.jump_height) / (this.jump_time_to_peak * this.jump_time_to_peak)) * -1.0;
	this.fall_gravity = ((-2.0 * this.jump_height) / (this.jump_time_to_descent * this.jump_time_to_descent)) * -1.0;
    }

    update() {
	this.velocityY += this.get_gravity() * deltaTime;

	this.y += this.velocityY * deltaTime

	if (this.y + this.height > state.floor.y) this.y = state.floor.y - this.height
    }

    draw() {
	this.ctx.fillStyle = this.colour
	this.ctx.fillRect(this.x, this.y, this.width, this.height)
    }

    jump() {
	if (this.is_on_floor()) {
	    this.velocityY = this.jump_velocity;
	}
    }

    get_gravity() {
	return this.velocityY < 0.0 ? this.jump_gravity : this.fall_gravity;
    }

    is_on_floor() {
        return this.y + this.height >= state.floor.y ? true : false;
    }
}

class Spawner {
    constructor() {
	// this.seed = 42069
	this.count = 0
	this.arrows = []
	this.start_position = width + 100
	for (let i = 0; i < 20; ++i) {
	    this.spawn()
	}
    }

    spawn() {
	const x_offset = Math.random() * 100
	const y_offset = Math.random() * height / 2
        this.arrows[this.count] = { 
	    x: this.start_position + x_offset, 
	    y: y_offset, 
	    width: 20, 
	    height: 20, 
	    colour: "red" 
	}
    }

    update() {
	for (let i = 0; i < this.arrows.length; ++i) {
	    offset = state.background_speed * deltaTime
	    this.arrows[i].x = arrow_left.x - offset
	    draw_arrow_left(arrow_left.x, arrow_left.y, arrow_left.width, arrow_left.height, arrow_left.colour)
	}
	if (all_offset > 2000) {
	    all_offset = 0
	} else {
	    all_offset += 1
	}

    }

    draw() {
    }
}

function draw_arrow_left(x, y, width, height, colour) {
    ctx.fillStyle = colour
    ctx.fillRect(x, y, width / 3, height)
    ctx.fillRect(x, y, width, height / 3)
}

function draw_player() {
    player.update()
    player.draw()
}

function draw_floor() {
    ctx.fillStyle = state.floor.colour
    ctx.fillRect(state.floor.x, state.floor.y, state.floor.width, state.floor.height)
}

function draw_background() {
    for (let i = 0; i < state.arrows.length; ++i) {
        arrow_left = state.arrows[i]
        offset = all_offset + state.background_speed * deltaTime
        draw_arrow_left(arrow_left.x - offset, arrow_left.y, arrow_left.width, arrow_left.height, arrow_left.colour)
    }
    if (all_offset > 2000) {
        all_offset = 0
    } else {
        all_offset += 1
    }
}

function update() {
    clear_screen("blue")
    draw_floor()
    draw_player()
    draw_background()
}

const loop = (timestamp) => {
    deltaTime = (timestamp - prevTimestamp) / 1000;
    prevTimestamp = timestamp
    update(timestamp)
    requestAnimationFrame(loop)
}


let player = new Player(ctx)
let spawner = new Spawner()

function main() {

    for (let i = 0; i < 10; ++i) {

        state.arrows[i] = { 
	    x: width / i + width, 
	    y: height / i, 
	    width: 20, 
	    height: 20, 
	    colour: "red" 
	}

        state.arrows[i + 10] = { 
	    x: (width / i) + 200 + width, 
	    y: (height / i) - 30, 
	    width: 20, 
	    height: 20, 
	    colour: "magenta" 
	}
	
        state.arrows[i + 20] = { 
	    x: (width / i) + 400 + width, 
	    y: (height / i) - 60, 
	    width: 20, 
	    height: 20, 
	    colour: "coral" 
	}

    }

    document.addEventListener('keydown', (event) => {
	const key = event.key;
	switch (key) {
	    case "ArrowUp": player.jump(); break;
	    case " ":       player.jump(); break; 
	    case "w":       player.jump(); break;    
	}
    });

    window.requestAnimationFrame((timestamp) => {
        prevTimestamp = timestamp;
        window.requestAnimationFrame(loop);
    });
}

main()
