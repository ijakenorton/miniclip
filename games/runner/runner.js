import { clearScreen, drawText, colours } from "../../utils/utils.js"
import { drawScanLines } from "../../utils/graphics.js"

const NEW_LEVEL_AMOUNT = 30

let pauseBackgroundColour = "rgba(0,0,0,0.7)"
let defaultBackgroundColour = "skyblue"
let default_player_colour = "black"

// Module-level variables
let canvas, ctx, height, width
let player, spawner, animationId
let onBackToMenu = null
let viewport = null // {x, y, width, height}

const state = {
    backgroundSpeed: 1,
    prevBackgroundSpeed: 1,
    prevTimestamp: 0,
    deltaTime: 0,
    prevScore: 0,
    score: 0,
    paused: false,
    floor: null,
    underfloor: null,
}

const keys = {
    down: false,
}

function rectRectCollision(r1, r2) {
    if (r1.x + r1.width >= r2.x &&
        r1.x <= r2.x + r2.width &&
        r1.y + r1.height >= r2.y &&
        r1.y <= r2.y + r2.height) {
        return true;
    }
    return false;
}

function isLandingOnTop(player, hazard) {
    const bottomDistance = Math.abs((player.y + player.height) - hazard.y);
    return bottomDistance < 10 && player.velocityY > 0;
}

class Player {
    constructor() {
        this.colour = default_player_colour
        this.standingHeight = 40
        this.crouchingHeight = 20
        this.x = 20
        this.y = height / 2
        this.velocityY = 0
        this.width = 20
        this.height = 40
        this.extraHitbox = 3
        this.jumpHeight = 100
        this.jumpTimeToPeak = 0.5
        this.jumpTimeToDescent = 0.3
        this.collided = false
        this.isCrouching = false
        this.currentHazard = this.resetFloor()
        this.updateJumpValues()
    }

    updateJumpValues() {
        this.jumpVelocity = ((2.0 * this.jumpHeight) / this.jumpTimeToPeak) * -1.0
        this.jumpGravity = ((-2.0 * this.jumpHeight) / (this.jumpTimeToPeak * this.jumpTimeToPeak)) * -1.0
        this.fallGravity = ((-2.0 * this.jumpHeight) / (this.jumpTimeToDescent * this.jumpTimeToDescent)) * -1.0
    }

    resetFloor() {
        return {
            x: 0,
            y: state.floor.y,
            width: width,
            height: state.floor.height
        }
    }

    update() {
        if (keys.down) {
            this.crouch()
        } else {
            this.stand()
        }

        this.velocityY += this.getGravity() * state.deltaTime
        this.y += this.velocityY * state.deltaTime

        if (this.x > (this.currentHazard.x + this.currentHazard.width)) {
            this.currentHazard = this.resetFloor()
            if (this.isOnFloor()) {
                this.velocityY = 0
            }
        }

        if (this.isOnFloor()) {
            this.y = this.currentHazard.y - this.height
        }

        this.checkCollision()
    }

    checkCollision() {
        for (let i = 0; i < spawner.hazards.items.length; ++i) {
            const currentHazard = spawner.hazards.items[i]
            if (currentHazard.isAlive) {
                if (rectRectCollision(this, currentHazard)) {
                    currentHazard.colour = "red"
                    if (isLandingOnTop(this, currentHazard)) {
                        this.currentHazard = currentHazard
                        currentHazard.colour = "green"
                    } else {
                        currentHazard.colour = "blue"
                        this.collided = true
                    }
                }
            }
        }
    }

    draw() {
        ctx.fillStyle = this.colour
        ctx.fillRect(this.x, this.y, this.width, this.height)
    }

    jump() {
        if (this.isOnFloor()) {
            this.velocityY = this.jumpVelocity
        }
    }

    crouch() {
        if (!this.isCrouching) {
            this.y += this.standingHeight - this.crouchingHeight
            this.height = this.crouchingHeight
            this.isCrouching = true
        }
    }

    stand() {
        if (this.isCrouching) {
            this.y -= this.standingHeight - this.crouchingHeight
            this.height = this.standingHeight
            this.isCrouching = false
        }
    }

    getGravity() {
        return this.velocityY < 0.0 ? this.jumpGravity : this.fallGravity
    }

    isOnFloor() {
        return this.y + this.height >= this.currentHazard.y ? true : false
    }
}

class Spawner {
    constructor() {
        this.seed = 42069
        this.arrows = {
            items: [],
            count: 0,
            max: 10,
            spawnTimer: 0,
            spawnRate: 0.1,
        }

        this.hazards = {
            items: [],
            count: 0,
            max: 8,
            spawnTimer: 0,
            spawnRate: 0.1,
        }

        this.startPosition = width
        this.arrowBase = state.floor.y - 200
        this.colourPalette = this.initColourPalette(20)

        for (let i = 0; i < 5; ++i) {
            this.spawnArrow(i)
        }
        for (let i = 0; i < 4; ++i) {
            this.spawnHazard(i)
        }
    }

    initColourPalette(n) {
        let colourPalette = []
        for (let i = n; i > 0; i--) {
            let ratio = i / n
            let offset = Math.floor(ratio * 130)
            let r = 125 + offset
            let g = 100 + offset
            let b = 125 + offset
            colourPalette[i] = `rgb(${r}, ${g}, ${b})`
        }
        return colourPalette
    }

    spawnHazard(index) {
        const xOffset = Math.random() * width
        const yOffset = (Math.random() * player.jumpHeight * 1.5) + state.floor.y - (player.jumpHeight * 1.5)
        const hazardHeight = 20
        const hazardWidth = Math.random() * 80

        this.hazards.items[index] = {
            x: this.startPosition + xOffset,
            y: yOffset,
            width: hazardWidth,
            height: hazardHeight,
            colour: "purple",
            speedMultiplier: 1,
            isAlive: true
        }
        this.hazards.count += 1
    }

    spawnArrow(index) {
        const xOffset = Math.random() * width
        const yOffset = Math.random() * (state.floor.y - 200)
        const distanceRatio = yOffset / this.arrowBase
        const speedMultiplier = 0.3 + (distanceRatio * 0.8)
        const colorIndex = Math.floor(distanceRatio * (this.colourPalette.length - 1))
        const arrowHeight = height * distanceRatio * 0.1
        const arrowWidth = width * distanceRatio * 0.1

        this.arrows.items[index] = {
            x: this.startPosition + xOffset,
            y: yOffset,
            width: arrowWidth,
            height: arrowHeight,
            colour: this.colourPalette[colorIndex],
            speedMultiplier: speedMultiplier,
            isAlive: true
        }
        this.arrows.count += 1
    }

    update() {
        // Update arrows
        this.arrows.spawnTimer += state.deltaTime
        if (this.arrows.count < this.arrows.max && this.arrows.spawnTimer >= this.arrows.spawnRate) {
            for (let i = 0; i < this.arrows.items.length; i++) {
                if (!this.arrows.items[i].isAlive) {
                    this.spawnArrow(i)
                    break;
                }
            }
            this.arrows.spawnTimer = 0
        }

        for (let i = 0; i < this.arrows.items.length; ++i) {
            if (this.arrows.items[i].isAlive) {
                const baseSpeed = 200
                this.arrows.items[i].x -= baseSpeed * state.deltaTime * this.arrows.items[i].speedMultiplier * state.backgroundSpeed

                if (this.arrows.items[i].x < (0 - this.arrows.items[i].width)) {
                    this.arrows.items[i].isAlive = false
                    this.arrows.count -= 1
                }
            }
        }

        // Update hazards
        this.hazards.spawnTimer += state.deltaTime
        if (this.hazards.count < this.hazards.max && this.hazards.spawnTimer >= this.hazards.spawnRate) {
            for (let i = 0; i < this.hazards.items.length; i++) {
                if (!this.hazards.items[i].isAlive) {
                    this.spawnHazard(i)
                    break;
                }
            }
            this.hazards.spawnTimer = 0
        }

        for (let i = 0; i < this.hazards.items.length; ++i) {
            if (this.hazards.items[i].isAlive) {
                const baseSpeed = 200
                this.hazards.items[i].x -= baseSpeed * state.deltaTime * this.hazards.items[i].speedMultiplier * state.backgroundSpeed

                if (this.hazards.items[i].x < (0 - this.hazards.items[i].width)) {
                    this.hazards.items[i].isAlive = false
                    this.hazards.count -= 1
                }
            }
        }
    }

    draw() {
        for (let i = 0; i < this.arrows.items.length; ++i) {
            if (this.arrows.items[i].isAlive) {
                const arrow = this.arrows.items[i]
                drawArrowLeft(arrow.x, arrow.y, arrow.width, arrow.height, arrow.colour)
            }
        }

        for (let i = 0; i < this.hazards.items.length; ++i) {
            if (this.hazards.items[i].isAlive) {
                const hazard = this.hazards.items[i]
                drawHazard(hazard.x, hazard.y, hazard.width, hazard.height, hazard.colour)
            }
        }
    }
}

function drawArrowLeft(x, y, width, height, colour) {
    ctx.fillStyle = colour
    ctx.fillRect(x, y, width / 3, height)
    ctx.fillRect(x, y, width, height / 3)
}

function drawHazard(x, y, width, height, colour) {
    const offset = 2
    ctx.fillStyle = "black"
    ctx.fillRect(x, y, width, height)
    ctx.fillStyle = colour
    ctx.fillRect(x + offset / 2, y + offset / 2, width - offset, height - offset)
}

function drawFloor() {
    ctx.fillStyle = state.floor.colour
    ctx.fillRect(state.floor.x, state.floor.y, state.floor.width, state.floor.height)
}

function drawUnderfloor() {
    ctx.fillStyle = state.underfloor.colour
    ctx.fillRect(state.underfloor.x, state.underfloor.y, state.underfloor.width, state.underfloor.height)
}

function update() {
    player.update()
    spawner.update()
}

function draw() {
    // Apply viewport transformation
    ctx.save();
    if (viewport) {
        ctx.translate(viewport.x, viewport.y);
        // Optionally clip to viewport bounds
        ctx.beginPath();
        ctx.rect(0, 0, viewport.width, viewport.height);
        ctx.clip();
    }

    clearScreen(ctx, width, height, defaultBackgroundColour)

    spawner.draw()
    player.draw()
    drawUnderfloor()
    drawFloor()

    if (state.paused) {
        clearScreen(ctx, width, height, pauseBackgroundColour)
        drawText(ctx, "red", "30px Arial", "Paused", width / 2, height / 2)
        drawText(ctx, "red", "20px Arial", "Press esc to unpause", 150, 30)
    }

    if (player.collided) {
        clearScreen(ctx, width, height, colours.FROGGER_BLACK)
        const gameOver = `GAMEOVER`
	const youScored = `YOU SCORED: ${Math.round(state.score)}`
        drawText(ctx, colours.FROGGER_RED, "30px monospace", gameOver, width / 2, height / 2 -40)
        drawText(ctx, colours.FROGGER_RED, "30px monospace", youScored, width / 2, height / 2)
        drawText(ctx, colours.FROGGER_RED, "20px monospace", "PRESS R TO RESTART OR M FOR MENU", width / 2, height / 2 + 200)
	drawScanLines(ctx, viewport, pauseBackgroundColour)
    }

    ctx.restore();
}

const loop = (timestamp) => {
    state.deltaTime = (timestamp - state.prevTimestamp) / 1000;
    state.prevTimestamp = timestamp
    if (!state.paused) {
        update()
    }
    draw()

    if (!player.collided && !state.paused) {
        state.score += state.deltaTime * state.backgroundSpeed
    }

    ctx.fillStyle = "red";
    ctx.font = "20px Arial";
    const scoreText = `Score: ${Math.round(state.score)}`
    drawText(ctx, "red", "20px Arial", scoreText, width - 150, 30)

    if (state.score - state.prevScore > NEW_LEVEL_AMOUNT && !player.collided) {
        state.prevScore = state.score
        state.backgroundSpeed += 1
    }

    animationId = requestAnimationFrame(loop)
}

function reset() {
    player = new Player(ctx)
    spawner = new Spawner()
    state.backgroundSpeed = 1
    state.score = 0
    state.prevScore = 0
}

function pause() {
    if (state.paused) {
        state.backgroundSpeed = state.prevBackgroundSpeed
    } else {
        state.prevBackgroundSpeed = state.backgroundSpeed
        state.backgroundSpeed = 0
    }
    state.paused = !state.paused
}

function handleKeyDown(event) {
    const key = event.key;
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
        case "m":
        case "M":
            if (onBackToMenu) {
                cleanup();
                onBackToMenu();
            }
            break;
    }
}

function handleKeyUp(event) {
    const key = event.key;
    switch (key) {
        case "s": keys.down = false; break;
        case "S": keys.down = false; break;
        case "Control": keys.down = false; break;
    }
}

function cleanup() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
}

export function init(canvasElement, ctxElement, backToMenuCallback, viewportConfig = null) {
    canvas = canvasElement;
    ctx = ctxElement;
    viewport = viewportConfig;

    // Use viewport dimensions if provided, otherwise use full canvas
    if (viewport) {
        width = viewport.width;
        height = viewport.height;
    } else {
        width = canvas.width;
        height = canvas.height;
    }

    onBackToMenu = backToMenuCallback;

    // Initialize floor
    state.floor = {
        colour: "brown",
        x: 0,
        y: height - 40,
        width: width,
        height: height / 20,
    };

    state.underfloor = {
        colour: "#654321",
        x: 0,
        y: height - 40,
        width: width,
        height: height / 10,
    };

    // Reset state
    state.backgroundSpeed = 1;
    state.prevBackgroundSpeed = 1;
    state.prevTimestamp = 0;
    state.deltaTime = 0;
    state.prevScore = 0;
    state.score = 0;
    state.paused = false;
    keys.down = false;

    player = new Player();
    spawner = new Spawner();

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    window.requestAnimationFrame((timestamp) => {
        state.prevTimestamp = timestamp;
        window.requestAnimationFrame(loop);
    });
}
