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
        this.seed = 42069
        this.count = 0
        this.max_arrows = 10
        this.arrows = []
        this.start_position = width
        this.spawn_timer = 0
        this.spawn_rate = 0.1// seconds between spawns
	this.arrow_base = state.floor.y - 200
        
        this.color_palette = []
        this.palette_size = 20
        for (let i = 0; i < this.palette_size; i++) {
            let ratio = i / this.palette_size // 0.0 to 1.0
            let offset = Math.floor(ratio * 130) // 0 to 130 (so 125+130 = 255 max)
            let r = 125 + offset
            let g = 100 + offset  
            let b = 125 + offset
            this.color_palette[i] = `rgb(${r}, ${g}, ${b})` // Fixed: rgb not rbg
        }

        
        // Initialize with some arrows
        for (let i = 0; i < 5; ++i) {
            this.spawn_arrow()
        }
    }
    
    spawn_arrow() {
        const x_offset = Math.random() * width
        const y_offset = Math.random() * (state.floor.y - 200)
        
        // Calculate distance multiplier (closer to camera = faster)
        // y=0 (top) = far away, y=height/2 (bottom) = close
        const distance_ratio = y_offset / this.arrow_base
        const speed_multiplier = 0.3 + (distance_ratio * 0.8) // 0.3x to 1.0x speed
        
        // Pick color from palette
        const color_index = Math.floor(distance_ratio * (this.palette_size - 1))
	const arrow_height = height * distance_ratio * 0.1
	const arrow_width = width * distance_ratio * 0.1
        
        this.arrows[this.arrows.length] = { 
            x: this.start_position + x_offset, 
            y: y_offset, 
            width: arrow_width, 
            height: arrow_height, 
            colour: this.color_palette[color_index],
            speed_multiplier: speed_multiplier,
            is_alive: true
        }
        this.count += 1
    }
    
    
    respawn_arrow(index) {
	console.log("spawning")
        const x_offset = Math.random() * 500
        const y_offset = Math.random() * this.arrow_base
        const distance_ratio = y_offset / this.arrow_base
        const speed_multiplier = 0.3 + (distance_ratio * 0.8)
        const color_index = Math.floor(distance_ratio * (this.palette_size - 1))
	const arrow_height = height * distance_ratio * 0.1
	const arrow_width = width * distance_ratio * 0.1

        
        // Reuse existing object instead of creating new one
        this.arrows[index].x = this.start_position + x_offset
        this.arrows[index].y = y_offset
        this.arrows[index].colour = this.color_palette[color_index]
        this.arrows[index].speed_multiplier = speed_multiplier
        this.arrows[index].is_alive = true
	this.arrows[index].width = arrow_width
	this.arrows[index].height = arrow_height        
        this.count += 1
	console.log(this.arrows[index])
    }
    
    // Use whichever update method you prefer
    update() {
        this.spawn_timer += deltaTime
        if (this.count < this.max_arrows && this.spawn_timer >= this.spawn_rate) {
            // Find first dead arrow and reuse it
            for (let i = 0; i < this.arrows.length; i++) {
                if (!this.arrows[i].is_alive) {
                    this.respawn_arrow(i)
		    break;
                }
            }
            this.spawn_timer = 0
        }
        
        // Update only alive arrows
        for (let i = 0; i < this.arrows.length; ++i) {
            if (this.arrows[i].is_alive) {
                const base_speed = 200
                this.arrows[i].x -= base_speed * deltaTime * this.arrows[i].speed_multiplier
                
                if (this.arrows[i].x < (0 - this.arrows[i].width)) {
                    this.arrows[i].is_alive = false
                    this.count -= 1
                }
            }
        }
    }
    
    draw() {
        for (let i = 0; i < this.arrows.length; ++i) {
            if (this.arrows[i].is_alive) {
                const arrow = this.arrows[i]
                ctx.fillStyle = arrow.colour
                
                // Draw arrow shape
                ctx.fillRect(arrow.x, arrow.y, arrow.width / 3, arrow.height)
                ctx.fillRect(arrow.x, arrow.y, arrow.width, arrow.height / 3)
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
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText(`FPS: ${fps}`, 10, 30);
    requestAnimationFrame(loop)
}


let player = new Player(ctx)

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
