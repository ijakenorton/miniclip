const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

const height = canvas.height
const width = canvas.width
const pause_text = `Paused`
const unpause_text = `Press esc to unpause`
const restart = `Press R to restart`

const EPSILON = 0.000001
const NEW_LEVEL_AMOUNT = 30

let pause_background_colour = "rgba(0,0,0,0.7)"
let default_background_colour = "skyblue"
let default_player_colour = "black"

const state = {
    background_speed: 1,
    prev_background_speed: 1,
    prev_timestamp: 0,
    deltaTime: 0,
    prev_score: 0,
    score: 0,
    paused: false,
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
}

// Unsure if this is needed but is there for now
// TODO: this key detection may be a good thing for utils
const keys = { 
    down: false,
}

function rect_rect_collision(r1, r2) {
    if (r1.x + r1.width >= r2.x && // r1 right edge past r2 left
        r1.x <= r2.x + r2.width && // r1 left edge past r2 right
        r1.y + r1.height >= r2.y && // r1 top edge past r2 bottom
        r1.y <= r2.y + r2.height) { // r1 bottom edge past r2 top
        return true;
    }

    return false;
}
function is_landing_on_top(player, hazard) {
    const bottomDistance = Math.abs((player.y + player.height) - hazard.y);
    return bottomDistance < 10 && player.velocityY > 0;
}

function lerp(from, to, weight) {
    return from + (to - from) * weight
}

function float_equals(x, y) {
    return Math.abs(x - y) <= (EPSILON * Math.max(1, Math.max(Math.abs(x), Math.abs(y))));
}

function apply_gravity(velocity) {
    return velocity + (state.gravity * state.deltaTime)
}

function clear_screen(colour) {
    ctx.fillStyle = colour
    ctx.fillRect(0, 0, width, height)
}


class Player {
    constructor(ctx) {
        this.colour = default_player_colour
	this.standing_height = 40
	this.crouching_height = 20
        this.x = 20
        this.y = height / 2
        this.velocityY = 0
        this.width = 20
        this.height = 40
        this.extra_hitbox = 3
        this.ctx = ctx
        this.jump_height = 100
        this.jump_time_to_peak = 0.5
        this.jump_time_to_descent = 0.3
        this.collided = false
	this.is_crouching
        this.current_hazard = this.reset_floor()
        this.update_jump_values()
    }

    update_jump_values() {
        this.jump_velocity = ((2.0 * this.jump_height) / this.jump_time_to_peak) * -1.0
        this.jump_gravity = ((-2.0 * this.jump_height) / (this.jump_time_to_peak * this.jump_time_to_peak)) * -1.0
        this.fall_gravity = ((-2.0 * this.jump_height) / (this.jump_time_to_descent * this.jump_time_to_descent)) * -1.0
    }

    reset_floor() {
	return {
	    x: 0,
	    y: state.floor.y,
	    width: width, 
	    height: state.floor.height
	}
    }

    update() {
	//crouching
	if (keys.down) {
	    this.crouch()
	} else {
	    this.stand()
	}

	//movement update
	this.velocityY += this.get_gravity() * state.deltaTime
	this.y += this.velocityY * state.deltaTime

	//finished hazard
        if (this.x > (this.current_hazard.x + this.current_hazard.width)) {
            this.current_hazard = this.reset_floor()
	    if (this.is_on_floor()) {
		this.velocityY = 0
	    }
        } 

	// on hazard or floor
	if (this.is_on_floor()) {
	    this.y = this.current_hazard.y - this.height
	}

	this.check_collision()

    }

    check_collision() {
        for (let i = 0; i < spawner.hazards.items.length; ++i) {
            const current_hazard = spawner.hazards.items[i]
            if (current_hazard.is_alive) {
                if (rect_rect_collision(this, current_hazard)) {
                    current_hazard.colour = "red"
                    if (is_landing_on_top(this, current_hazard)) {
                        this.current_hazard = current_hazard
                        current_hazard.colour = "green"
                    } else {
                        current_hazard.colour = "blue"
                        this.collided = true
                    }
                }
            }
        }
    }

    draw() {
        this.ctx.fillStyle = this.colour
        this.ctx.fillRect(this.x, this.y, this.width, this.height)
    }

    jump() {
        if (this.is_on_floor()) {
            this.velocityY = this.jump_velocity
        }
    }

    crouch() {
        if (!this.is_crouching) {
            this.y += this.standing_height - this.crouching_height
            this.height = this.crouching_height
            this.is_crouching = true
        }
    }

    stand() {
        if (this.is_crouching) {
            this.y -= this.standing_height - this.crouching_height
            this.height = this.standing_height
            this.is_crouching = false
        }
    }

    can_stand() {
	return true
    }

    get_gravity() {
        return this.velocityY < 0.0 ? this.jump_gravity : this.fall_gravity
    }

    is_on_floor() {
        return this.y + this.height >= this.current_hazard.y ? true : false
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
            max: 8,
            spawn_timer: 0,
            spawn_rate: 0.1,
        }

        this.start_position = width
        this.arrow_base = state.floor.y - 200
        this.colour_palette = this.init_colour_palette(20)

        for (let i = 0; i < 5; ++i) {
            this.spawn_arrow(i)
        }
        for (let i = 0; i < 4; ++i) {
            this.spawn_hazard(i)
        }
    }

    init_colour_palette(n) {
        let colour_palette = []
        for (let i = n; i > 0; i--) {
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
        const y_offset = (Math.random() * player.jump_height * 1.5) + state.floor.y - (player.jump_height * 1.5)
        const hazard_height = 20
        const hazard_width = Math.random() * 80

        this.hazards.items[index] = {
            x: this.start_position + x_offset,
            y: y_offset,
            width: hazard_width,
            height: hazard_height,
            colour: "purple",
            speed_multiplier: 1,
            is_alive: true
        }
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
        this.arrows.count += 1
    }


    update() {
        // Update arrows
        this.arrows.spawn_timer += state.deltaTime
        if (this.arrows.count < this.arrows.max && this.arrows.spawn_timer >= this.arrows.spawn_rate) {
            // Find first dead arrow and reuse it
            for (let i = 0; i < this.arrows.items.length; i++) {
                if (!this.arrows.items[i].is_alive) {
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
                this.arrows.items[i].x -= base_speed * state.deltaTime * this.arrows.items[i].speed_multiplier * state.background_speed

                if (this.arrows.items[i].x < (0 - this.arrows.items[i].width)) {
                    this.arrows.items[i].is_alive = false
                    this.arrows.count -= 1
                }
            }
        }

        // Update hazards
        this.hazards.spawn_timer += state.deltaTime
        if (this.hazards.count < this.hazards.max && this.hazards.spawn_timer >= this.hazards.spawn_rate) {
            for (let i = 0; i < this.hazards.items.length; i++) {
                if (!this.hazards.items[i].is_alive) {
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
                this.hazards.items[i].x -= base_speed * state.deltaTime * this.hazards.items[i].speed_multiplier * state.background_speed

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
    ctx.fillRect(x + offset / 2, y + offset / 2, width - offset, height - offset)
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

function draw_fps(deltaTime) {
    const fps = Math.round(1 / state.deltaTime);
    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    ctx.fillText(`FPS: ${fps}`, 10, 30);
}

function draw_text(fillStyle, font, text, x, y) {
    ctx.fillStyle = fillStyle
    ctx.font = font
    const textMetrics = ctx.measureText(text)
    ctx.fillText(text, x - textMetrics.width / 2, y)
}

function update() {
    player.update()
    spawner.update()
}

function draw() {
    clear_screen(default_background_colour)

    spawner.draw()
    player.draw()
    draw_underfloor()
    draw_floor()

    if (state.paused) {
        clear_screen(pause_background_colour)
        draw_text("red", "30px Arial", pause_text, width / 2, height / 2)
        draw_text("red", "20px Arial", unpause_text, 150, 30)
    }

    if (player.collided) {
        clear_screen("black")
        const game_over = `Gameover, you scored: ${Math.round(state.score)}`
        draw_text("red", "30px Arial", game_over, width / 2, height / 2)
        draw_text("red", "20px Arial", restart, 100, 100)
    }
}

const loop = (timestamp) => {
    state.deltaTime = (timestamp - state.prev_timestamp) / 1000;
    state.prev_timestamp = timestamp
    if (!state.paused) {
        update()
    }
    draw()

    if (!player.collided && !state.paused) {
        state.score += state.deltaTime * state.background_speed
    }

    ctx.fillStyle = "red";
    ctx.font = "20px Arial";
    const score_text = `Score: ${Math.round(state.score)}`
    draw_text("red", "20px Arial", score_text, width - 150, 30)
    if (state.score - state.prev_score > NEW_LEVEL_AMOUNT && !player.collided) {

        state.prev_score = state.score
        state.background_speed += 1
    }
    requestAnimationFrame(loop)
}

function reset() {
    player = new Player(ctx)
    spawner = new Spawner()
    state.background_speed = 1
    state.score = 0
}

function pause() {
    if (state.paused) {
        state.background_speed = state.prev_background_speed
    } else {
        state.prev_background_speed = state.background_speed
        state.background_speed = 0
    }

    state.paused = !state.paused
}

function main() {
    document.addEventListener('keydown', (event) => {
        const key = event.key;
        // console.log(key)
        switch (key) {
            case "ArrowUp": player.jump(); break;
            case " ": player.jump(); break;
            case "w": player.jump(); break;
	    case "s": keys.down = true; break;
	    case "S": keys.down = true; break;
	    case "Control": keys.down = true; break;
            case "r": reset(); break;
            case "R": reset(); break;
            case "p": pause(); break;
            case "P": pause(); break;
            case "Escape": pause(); break;
        }
    });

    document.addEventListener('keyup', (event) => {
        const key = event.key;
        // console.log(key)
        switch (key) {
	    case "s": keys.down = false; break;
	    case "S": keys.down = false; break;
	    case "Control": keys.down = false; break;
        }
    });

    window.requestAnimationFrame((timestamp) => {
        state.prev_timestamp = timestamp;
        window.requestAnimationFrame(loop);
    });
}

main()
