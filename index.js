const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

const height = canvas.height
const width = canvas.width

let prevTimestamp = 0
let deltaTime = 0
let all_offset = 0
let state = { 
    background_speed: 1,
    player: {
	colour: "white",
	x: 20,
	y: height/2,
	width: 20,
	height: 40,
    },
    floor: {
	colour: "yellow",
	x: 0,
	y: height/2 + 40,
	width: width,
	height: height/20,
    },
    crosses: []
}

function draw_arrow_left(x, y, width, height, colour) {
    ctx.fillStyle = colour
    ctx.fillRect(x, y, width/3, height)
    ctx.fillRect(x, y, width, height/3)
}

function draw_player() {
    //player
    ctx.fillStyle = state.player.colour
    ctx.fillRect(state.player.x, state.player.y, state.player.width, state.player.height)
}

function draw_floor() {
    //floor
    ctx.fillStyle = state.floor.colour
    ctx.fillRect(state.floor.x, state.floor.y, state.floor.width, state.floor.height)
}

function clear_screen() {
    //clear screen
    ctx.fillStyle = 'blue'
    ctx.fillRect(0, 0, width, height)
}

function update() {
    clear_screen()
    draw_floor()
    draw_player()
    for (let i = 0; i < state.crosses.length; ++i) {
	arrow_left = state.crosses[i]
	offset = all_offset + state.background_speed * deltaTime
	draw_arrow_left(arrow_left.x - offset , arrow_left.y, arrow_left.width, arrow_left.height, arrow_left.colour)
    }
    if (all_offset > 2000) {
	all_offset = 0
    }else {
	all_offset += 1
    }
}

const loop = (timestamp) => {
    deltaTime = (timestamp - prevTimestamp) / 1000;
    prevTimestamp = timestamp
    update()
    requestAnimationFrame(loop)
}


function main() {
    for (let i = 0; i < 10; ++i) {
	state.crosses[i] = { x: width / i + width, y: height / i, width: 20, height: 20, colour: "red" }
	state.crosses[i + 10] = { x: (width / i) + 200 + width, y: (height / i) - 30, width: 20, height: 20, colour: "magenta" }
	state.crosses[i + 20] = { x: (width / i) + 400 + width, y: (height / i) - 60, width: 20, height: 20, colour: "coral" }
    }

    window.requestAnimationFrame((timestamp) => {
	prevTimestamp = timestamp;
	window.requestAnimationFrame(loop);
    });

    loop()
}

main()
