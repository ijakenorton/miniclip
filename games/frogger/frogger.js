const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

// --------------------------------------------------------------------------------
// Useful constants

// Grid square size, in px
const gridScale = 50;
const gridWidth = canvas.width / gridScale
const gridHeight = canvas.height / gridScale

// Render this many rows above and below the currently displayed screen for continuity
const offscreenRenderBuffer = 5

// The user position on the screen,
// i.e. the number of rows from the bottom of the screen to render the user.
const userGridHeightOffset = 3

// Log speed
// How fast the logs move (in grid cells / s, but can be float)
const minLogSpeed = 1.0
const maxLogSpeed = 5.0

// Log length
// How large logs may be (in grid cells. Must be int)
const minLogLength = 1
const maxLogLength = 5

// Log rate
// How often to spawn a new log in a row.
// Rate is a comparison to Math.Random()
// With at least one grid cell gap between logs
const minLogRate = 0.1
const maxLogRate = 0.3

// How much smaller to draw the sides of the logs (as a fraction of a grid square)
const logInset = 0.2
const frogInset = 2 * logInset

// How rounded to make the logs (and frog!)
const logRoundedRadii = gridScale / 4

// Commonly used colors in the game
const Colors = {
    black: "rgba(0,0,0,1)",
    red: "rgba(255,0,0,1)",
    pauseBackground: "rgba(0,0,0,0.7)",
    riverBackground: "rgba(4, 180, 244, 1)",
    log: "rgba(159, 95, 17, 1)",
    frog: "rgba(23, 163, 23, 1)"
}

// --------------------------------------------------------------------------------
// Utility functions

function randomRange(low, high) {
    return Math.random() * (high - low) + low
}

function draw_fps() {
    const fps = Math.round(1 / state.deltaTime);
    ctx.fillStyle = Colors.black;
    ctx.font = "16px Arial";
    ctx.fillText(`FPS: ${fps}`, 10, 30);
}

function draw_text(fillStyle, font, text, x, y) {
    ctx.fillStyle = fillStyle
    ctx.font = font
    const textMetrics = ctx.measureText(text)
    ctx.fillText(text, x - textMetrics.width / 2, y)
}

// --------------------------------------------------------------------------------
// Game variables and state

const GameStateEnum = Object.freeze({
    PLAY: Symbol("PLAY"),
    PAUSED: Symbol("PAUSED"),
    GAME_OVER: Symbol("GAME_OVER"),
})

const gameProps = {
    // How long since the previous frame
    deltaTime: 0,

    previousTimeStamp: 0,

    gameState: GameStateEnum.PLAY,

    // The current user height, indexed as a row
    userRow: 0,

    // The current user position, indexed as a col
    userColumn: gridWidth / 2,
}

class Log {
    constructor(initialPosition, length) {
        this.position = initialPosition
        this.length = length
    }

    draw(gridY) {
        ctx.fillStyle = Colors.log
        ctx.beginPath();
        ctx.roundRect(
            gridScale * (this.position + 0.5*logInset),
            gridScale * (gridY + 0.5*logInset),
            gridScale * (this.length - logInset),
            gridScale * (1 - logInset),
            logRoundedRadii,
        )
        ctx.fill()
    }
}

class RowSpawner {
    static directionLeft = -1
    static directionRight = 1

    constructor() {
        this.length = length
        this.moveDirection = (Math.random() < 0.5) === true ? RowSpawner.directionLeft : RowSpawner.directionRight;
        this.logSpeed = randomRange(minLogSpeed, maxLogSpeed)
        this.logRate = randomRange(minLogRate, maxLogRate)

        this.logs = []

        // Initialize the row with logs
        let x = 0;
        while (x < gridWidth) {
            if (Math.random() < this.logRate) {
                let logLength = Math.floor(randomRange(minLogLength, maxLogLength))
                let logPosition = (this.moveDirection === RowSpawner.directionRight) ? x : gridWidth - x - logLength;
                this.logs.push(new Log(
                    logPosition,
                    logLength,
                ))
                x += logLength
            }

            // Always leave a gap, even if log was spawned
            x += 1
        }
    }


    draw(gridY) {
        for (const log of this.logs) {
            log.draw(gridY)
        }
    }
}

class GameManager {
    constructor() {
        // Map from row index to log row, for consistency
        // Map<Number, LogRow>
        this.rows = {}

        // Initialize the first n rows
        for (let y = -offscreenRenderBuffer - userGridHeightOffset; y < gridHeight + offscreenRenderBuffer; y++) {
            this.rows[y] = new RowSpawner()
        }
    }


    draw() {
        ctx.fillStyle = Colors.riverBackground
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        for (let y = -offscreenRenderBuffer - userGridHeightOffset; y < gridHeight + offscreenRenderBuffer; y++) {
            this.rows[y].draw(y)
        }

        ctx.fillStyle = Colors.frog
        ctx.beginPath();
        ctx.roundRect(
            gridScale * (gameProps.userColumn + 0.5*frogInset),
            gridScale * (gridHeight - gameProps.userRow - userGridHeightOffset + 0.5*frogInset),
            gridScale * (1 - frogInset),
            gridScale * (1 - frogInset),
            logRoundedRadii,
        )
        ctx.fill()


        if (gameProps.gameState === GameStateEnum.PAUSED) {
            ctx.fillStyle = Colors.pauseBackground
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            draw_text("red", "30px Arial", "Paused", canvas.width / 2, canvas.height / 2)
        }

        if (gameProps.gameState === GameStateEnum.GAME_OVER) {
            ctx.fillStyle = Colors.black
            ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
    }
}

// --------------------------------------------------------------------------------
// Initialize the game and define final functions for reset, pause, etc...
// Anything that will need reference to the game manager object

let manager = new GameManager()

function reset() {
    manager = new GameManager()
    gameProps.gameState = GameStateEnum.PLAY
    gameProps.userRow = 0
}

function pause() {
    if (gameProps.gameState === GameStateEnum.PAUSED) {
        gameProps.gameState = GameStateEnum.PLAY
    } else if (gameProps.gameState === GameStateEnum.PLAY) {
        gameProps.gameState = GameStateEnum.PAUSED
    }
}



const gameLoop = (timestamp) => {
    gameProps.deltaTime = (timestamp - gameProps.previousTimeStamp) / 1000;
    gameProps.prev_timestamp = timestamp
    if (gameProps.gameState === GameStateEnum.PLAY) {
        update()
    }
    manager.draw()

    draw_text(Colors.black, "bold 20px Arial", `Height: ${gameProps.userRow}`, 50, 30)
    requestAnimationFrame(gameLoop)
}

function main() {
    document.addEventListener('keydown', (event) => {
        const key = event.key;
        switch (key) {
            case "r": reset(); break;
            case "R": reset(); break;
            case "p": pause(); break;
            case "P": pause(); break;
            case "Escape": pause(); break;
        }
    });

    window.requestAnimationFrame(gameLoop);
}

main()