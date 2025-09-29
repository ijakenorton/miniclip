const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

const height = canvas.height
const width = canvas.width

const EPSILON = 0.000001

let all_offset = 0

let prevTimestamp = 0
let deltaTime = 0
let score = 0

const state = {
    background_speed: 1,
    gravity: 800,
    floor: {
        colour: "brown",
        x: 0,
        y: height - 40,
        width: width,
        height: height / 20,
    },

    underfloor: {
        colour: "#654321",
        x: 0,
        y: height - 40,
        width: width,
        height: height / 10,
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
	this.colour = "black";
	this.x = 20;
	this.y = height / 2;
	this.velocityY = 0;  
	this.width = 20;
	this.height = 40;
	this.extra_hitbox = 3
	this.ctx = ctx
	this.jump_height = 100;
	this.jump_time_to_peak = 0.5;
	this.jump_time_to_descent = 0.3;
	this.update_jump_values()
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
        return this.y + this.height + this.extra_hitbox >= state.floor.y ? true : false;
    }
}

let player = new Player(ctx)

class Spawner {
    constructor() {
        this.seed = 42069
        this.arrows = {
	    items: [],
	    count: 0,
	    max: 10,
	    spawn_timer: 0,
	    spawn_rate: 0.1,
	}

        this.hazards = {
	    items: [],
	    count: 0,
	    max: 3,
	    spawn_timer: 0,
	    spawn_rate: 0.1,
	}

        this.start_position = width
	this.arrow_base = state.floor.y - 200
        this.colour_palette = this.init_colour_palette(20)

        for (let i = 0; i < 5; ++i) {
            this.spawn_arrow(i)
        }
        for (let i = 0; i < 2; ++i) {
            this.spawn_hazard(i)
        }
    }

    init_colour_palette(n) {
	let colour_palette = []
        for (let i = 0; i < n; i++) {
            let ratio = i / n
            let offset = Math.floor(ratio * 130)
            let r = 125 + offset
            let g = 100 + offset  
            let b = 125 + offset
            colour_palette[i] = `rgb(${r}, ${g}, ${b})`
        }
	return colour_palette
    }

    spawn_hazard(index) {
        const x_offset = Math.random() * width
        const y_offset = (Math.random() * player.jump_height) + state.floor.y - player.jump_height
	const hazard_height = 20
	const hazard_width = Math.random() * 40

        // const color_index = Math.floor(distance_ratio * (this.colour_palette.length - 1))
        
        this.hazards.items[index] = { 
            x: this.start_position + x_offset, 
            y: y_offset, 
            width:  hazard_width, 
            height: hazard_height, 
            colour: "black",
	    speed_multiplier: 1,
            is_alive: true
        }
	console.log("hazard: ", this.hazards.items[index])
        this.hazards.count += 1
    }
    
    spawn_arrow(index) {
        const x_offset = Math.random() * width
        const y_offset = Math.random() * (state.floor.y - 200)
        const distance_ratio = y_offset / this.arrow_base
        const speed_multiplier = 0.3 + (distance_ratio * 0.8) // 0.3x to 1.0x speed
        const color_index = Math.floor(distance_ratio * (this.colour_palette.length - 1))
	const arrow_height = height * distance_ratio * 0.1
	const arrow_width = width * distance_ratio * 0.1
        
        this.arrows.items[index] = { 
            x: this.start_position + x_offset, 
            y: y_offset, 
            width: arrow_width, 
            height: arrow_height, 
            colour: this.colour_palette[color_index],
            speed_multiplier: speed_multiplier,
            is_alive: true
        }
	console.log("arrow: ", this.arrows.items[index])
        this.arrows.count += 1
    }
    
    
    update() {
	// Update arrows
	this.arrows.spawn_timer += deltaTime
	if (this.arrows.count < this.arrows.max && this.arrows.spawn_timer >= this.arrows.spawn_rate) {
	    // Find first dead arrow and reuse it
	    for (let i = 0; i < this.arrows.items.length; i++) {
		if (!this.arrows.items[i].is_alive) {
		    console.log(`resurrecting arrow:${i}`)
		    this.spawn_arrow(i)
		    break;
		}
	    }
	    this.arrows.spawn_timer = 0
	}

	// Move arrows
	for (let i = 0; i < this.arrows.items.length; ++i) {
	    if (this.arrows.items[i].is_alive) {
		const base_speed = 200
		this.arrows.items[i].x -= base_speed * deltaTime * this.arrows.items[i].speed_multiplier
		
		if (this.arrows.items[i].x < (0 - this.arrows.items[i].width)) {
		    this.arrows.items[i].is_alive = false
		    this.arrows.count -= 1 
		}
	    }
	}

	// Update hazards
	this.hazards.spawn_timer += deltaTime
	if (this.hazards.count < this.hazards.max && this.hazards.spawn_timer >= this.hazards.spawn_rate) {
	    for (let i = 0; i < this.hazards.items.length; i++) {
		if (!this.hazards.items[i].is_alive) {
		    console.log(`resurrecting hazard: ${i}`)
		    this.spawn_hazard(i)
		    break;
		}
	    }
	    this.hazards.spawn_timer = 0
	}
	
	// Move hazards
	for (let i = 0; i < this.hazards.items.length; ++i) {
	    if (this.hazards.items[i].is_alive) {
		const base_speed = 200
		this.hazards.items[i].x -= base_speed * deltaTime * this.hazards.items[i].speed_multiplier
		
		if (this.hazards.items[i].x < (0 - this.hazards.items[i].width)) {
		    this.hazards.items[i].is_alive = false
		    this.hazards.count -= 1
		}
	    }
	}
    }
    
    draw() {
        for (let i = 0; i < this.arrows.items.length; ++i) {
            if (this.arrows.items[i].is_alive) {
                const arrow = this.arrows.items[i]
		draw_arrow_left(arrow.x, arrow.y, arrow.width, arrow.height, arrow.colour)
            }
        }

        for (let i = 0; i < this.hazards.items.length; ++i) {
            if (this.hazards.items[i].is_alive) {
                const hazard = this.hazards.items[i]
		draw_hazard(hazard.x, hazard.y, hazard.width, hazard.height, hazard.colour)
            }
        }
    }
}

let spawner = new Spawner()

function draw_arrow_left(x, y, width, height, colour) {
    ctx.fillStyle = colour
    ctx.fillRect(x, y, width / 3, height)
    ctx.fillRect(x, y, width, height / 3)
}

function draw_hazard(x, y, width, height, colour) {
    const offset = 2
    ctx.fillStyle = "black"
    ctx.fillRect(x, y, width, height)
    ctx.fillStyle = colour
    ctx.fillRect(x + offset/2, y + offset/2, width - offset, height - offset)
}

function draw_player() {
    player.update()
    player.draw()
}

function draw_floor() {
    ctx.fillStyle = state.floor.colour
    ctx.fillRect(state.floor.x, state.floor.y, state.floor.width, state.floor.height)
}

function draw_underfloor() {
    ctx.fillStyle = state.underfloor.colour
    ctx.fillRect(state.underfloor.x, state.underfloor.y, state.underfloor.width, state.underfloor.height)
}

function draw_background() {
    spawner.update()
    spawner.draw()
}

function update() {
    clear_screen("skyblue")

    draw_underfloor()

    spawner.update()
    spawner.draw()

    ctx.fillStyle = state.floor.colour
    ctx.fillRect(state.floor.x, state.floor.y, state.floor.width, state.floor.height)

    player.update()
    player.draw()
}

const loop = (timestamp) => {
    deltaTime = (timestamp - prevTimestamp) / 1000;
    prevTimestamp = timestamp
    update(timestamp)

    // Simple FPS counter
    const fps = Math.round(1 / deltaTime);
    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    ctx.fillText(`FPS: ${fps}`, 10, 30);

    ctx.fillText
    ctx.fillStyle = "red";
    ctx.font = "20px Arial";

    score += deltaTime * state.background_speed
    ctx.fillText(`Score: ${Math.round(score)}`, width - 100, 30);
    requestAnimationFrame(loop)
}



function main() {
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
