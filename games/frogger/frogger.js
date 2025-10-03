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
// How fast the logs move (in grid cells / frame, but can be float)
const minLogSpeed = 1e-2
const maxLogSpeed = 5e-2

// Log length
// How large logs may be (in grid cells. Must be int)
const minLogLength = 1
const maxLogLength = 6

// Log gap
// How often to spawn a new log in a row.
// Once the last spawned log has moved a distance of gap, a new log is spawned
const minLogGap = 2
const maxLogGap = 10

// How much smaller to draw the sides of the logs (as a fraction of a grid square)
const logInset = 0.1
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

function drawText(fillStyle, font, text, x, y) {
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
            gridScale * (this.position + 0.5 * logInset),
            gridScale * (gridHeight - gridY - userGridHeightOffset + 0.5 * logInset),
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

    constructor(rowIndex) {
        this.rowIndex = rowIndex
        this.moveDirection = this.rowIndex%2 === 0.0 ? RowSpawner.directionLeft : RowSpawner.directionRight;
        this.logSpeed = randomRange(minLogSpeed, maxLogSpeed)
        this.nextLogGap = randomRange(minLogGap, maxLogGap)

        this.logs = []

        // Initialize the row with logs
        let x = 0;
        while (x < gridWidth) {
            x += this.nextLogGap
            let l = this.newLog()
            l.position = (this.moveDirection === RowSpawner.directionRight) ? x : gridWidth - x - l.length;
            this.logs.push(l)
            x += l.length
            this.nextLogGap = randomRange(minLogGap, maxLogGap)
        }
    }

    // Returns a new log, just off the left or right edge of the screen depending on 
    // if logs are moving right or left respectively. i.e. at the "new" edge for this row
    newLog() {
        let logLength = Math.floor(randomRange(minLogLength, maxLogLength))
        let logPosition = (this.moveDirection === RowSpawner.directionRight) ? -logLength : gridWidth;
        return new Log(
            logPosition,
            logLength,
        )
    }

    update() {
        for (const log of this.logs) {
            log.position += this.moveDirection * this.logSpeed
        }

        // Handle removing final log from row
        if (this.logs.length > 0) {
            // The final log is always the closest to being removed, by construction
            let finalLog = this.logs[this.logs.length - 1]
            if ((this.moveDirection === RowSpawner.directionRight && finalLog.position > gridWidth) ||
                (this.moveDirection === RowSpawner.directionLeft && finalLog.position + finalLog.length < 0)) {
                this.logs.pop()
            }
        }

        // Handle spawning new logs
        if (this.logs.length === 0 ||
            (this.moveDirection === RowSpawner.directionRight && this.logs[0].position > this.nextLogGap) ||
            (this.moveDirection === RowSpawner.directionLeft && this.logs[0].position + this.logs[0].length < gridWidth - this.nextLogGap)
        ) {
            this.logs.unshift(this.newLog())
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
            this.rows[y] = new RowSpawner(y)
        }

        // Give the user some breathing room to start
        // Also ensure the frog is actually on a log to start
        this.rows[0].logs = [
            new Log(-10, gridWidth + 20)
        ]
    }

    // Checks to see if the current user position is valid, i.e. on a log.
    // Returns true if user is currently on a log, false if not.
    isValidFrogPosition() {
        // This could be made more efficient by breaking early, but it's not worth the micro optimization right now
        for (const l of this.rows[gameProps.userRow].logs) {
            if (l.position < gameProps.userColumn + 1 - frogInset && (l.position + l.length) >= gameProps.userColumn - frogInset) {
                return true
            }
        }

        return false
    }

    update() {
        for (let y = gameProps.userRow - userGridHeightOffset - offscreenRenderBuffer; y < gameProps.userRow + gridHeight + offscreenRenderBuffer; y++) {
            if (!(y in this.rows)) {
                this.rows[y] = new RowSpawner(y)
            }
            this.rows[y].update()
        }

        gameProps.userColumn += this.rows[gameProps.userRow].moveDirection * this.rows[gameProps.userRow].logSpeed

        // Check game over conditions from log updates, i.e. if frog has left grid 
        if (gameProps.userColumn < -1 || gameProps.userColumn > gridWidth) {
            gameProps.gameState = GameStateEnum.GAME_OVER
        }
    }

    draw() {
        ctx.fillStyle = Colors.riverBackground
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        for (let y = gameProps.userRow - userGridHeightOffset; y < gameProps.userRow + userGridHeightOffset + gridHeight; y++) {
            this.rows[y].draw(y - gameProps.userRow)
        }

        ctx.fillStyle = Colors.frog
        ctx.beginPath();
        ctx.roundRect(
            gridScale * (gameProps.userColumn + 0.5 * frogInset),
            gridScale * (gridHeight - userGridHeightOffset + 0.5 * frogInset),
            gridScale * (1 - frogInset),
            gridScale * (1 - frogInset),
            logRoundedRadii,
        )
        ctx.fill()


        if (gameProps.gameState === GameStateEnum.PAUSED) {
            ctx.fillStyle = Colors.pauseBackground
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            drawText(Colors.red, "30px Arial", "Paused", canvas.width / 2, canvas.height / 2)
        }

        if (gameProps.gameState === GameStateEnum.GAME_OVER) {
            ctx.fillStyle = Colors.black
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            drawText(Colors.red, "30px Arial", "Game Over", canvas.width / 2, canvas.height / 2)
            drawText(Colors.red, "30px Arial", `Height: ${gameProps.userRow}`, canvas.width / 2, canvas.height / 2 + 80)
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
    gameProps.userColumn = gridWidth / 2
}

function pause() {
    if (gameProps.gameState === GameStateEnum.PAUSED) {
        gameProps.gameState = GameStateEnum.PLAY
    } else if (gameProps.gameState === GameStateEnum.PLAY) {
        gameProps.gameState = GameStateEnum.PAUSED
    }
}

function moveUserRight() {
    gameProps.userColumn += 1
    if (!manager.isValidFrogPosition()) {
        gameProps.gameState = GameStateEnum.GAME_OVER
    }
}

function moveUserUp() {
    gameProps.userRow += 1
    if (!manager.isValidFrogPosition()) {
        gameProps.gameState = GameStateEnum.GAME_OVER
    }
}

function moveUserLeft() {
    gameProps.userColumn -= 1
    if (!manager.isValidFrogPosition()) {
        gameProps.gameState = GameStateEnum.GAME_OVER
    }
}

function moveUserDown() {
    gameProps.userRow -= 1
    if (!manager.isValidFrogPosition()) {
        gameProps.gameState = GameStateEnum.GAME_OVER
    }
}

// --------------------------------------------------------------------------------

const gameLoop = (timestamp) => {
    gameProps.deltaTime = (timestamp - gameProps.previousTimeStamp) / 1000;
    gameProps.prev_timestamp = timestamp
    if (gameProps.gameState === GameStateEnum.PLAY) {
        manager.update()
    }
    manager.draw()

    drawText(Colors.black, "bold 20px Arial", `Height: ${gameProps.userRow}`, 50, 30)
    requestAnimationFrame(gameLoop)
}

function main() {
    document.addEventListener('keydown', (event) => {
        const key = event.key;
        switch (key) {
            case "ArrowRight": moveUserRight(); break;
            case "ArrowUp": moveUserUp(); break;
            case "ArrowLeft": moveUserLeft(); break;
            case "ArrowDown": moveUserDown(); break;
            case "d": moveUserRight(); break;
            case "w": moveUserUp(); break;
            case "a": moveUserLeft(); break;
            case "s": moveUserDown(); break;
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