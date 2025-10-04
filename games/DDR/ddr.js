const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

// --------------------------------------------------------------------------------
// Useful constants

// Commonly used colors in the game
const Colors = {
    black: "rgba(0, 0, 0, 1)",
    red: "rgba(255,0,0,1)",
    pauseBackground: "rgba(0,0,0,0.7)",
    symbolFieldBackground: "rgba(66, 73, 76, 0.5)",
    symbolColor: "rgba(255, 255, 255, 0.7)",
    symbolIndicatorColor: "rgba(255, 255, 255, 1)",
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

const UserEnum = Object.freeze({
    USER_LEFT: Symbol("USER_LEFT"),
    USER_RIGHT: Symbol("USER_RIGHT"),
})

const GameStateEnum = Object.freeze({
    PLAY: Symbol("PLAY"),
    PAUSED: Symbol("PAUSED"),
    GAME_OVER: Symbol("GAME_OVER"),
})

const DirectionEnum = Object.freeze({
    RIGHT: Symbol("RIGHT"),
    UP: Symbol("UP"),
    LEFT: Symbol("LEFT"),
    DOWN: Symbol("DOWN"),
})

const gameProps = {
    // How long since the previous frame
    deltaTime: 0,
    previousTimeStamp: 0,

    gameState: GameStateEnum.PLAY,

    // The speed at which symbols move down the screen. To be updated by some small amount every frame...
    gameSpeed: 1.0,

    // The state of the game, represented as a value between -1 and +1
    // For player two and player one's victory respectively
    // When rendered, the bar may look something like this:
    // -1 <----------- 0 -----------> +1
    // And is updated as players hit symbols
    // Better symbol timings give larger updates, missing a symbol gives an update in the "wrong" direction
    victoryBar: 0.0,
}


class SymbolField {
    // This object represents the "field" of interest to one user
    // i.e. the column of symbols that will move down the screen,
    // and the indicators to use for timing

    // The width of the field, as a ratio to the canvas width
    static fieldWidth = 0.4
    
    // The height of the field, as a ratio to the canvas height
    static fieldHeight = 0.9

    // The margin to use from the top of the canvas, as a ratio to the canvas height
    static topMargin = 0.05

    constructor(xRenderOffset) {
        this.symbols = []

        // xRenderOffset is given as a ratio to the canvas width
        this.xRenderOffset = xRenderOffset
    }

    update() {

    }

    draw(){        
        ctx.fillStyle = Colors.symbolFieldBackground
        ctx.beginPath();
        ctx.roundRect(
            canvas.width * this.xRenderOffset,
            canvas.height * SymbolField.topMargin,
            canvas.width * SymbolField.fieldWidth,
            canvas.height * SymbolField.fieldHeight,
            [20,20,0,0],
        )
        ctx.fill()

        ctx.fillStyle = Colors.black
        for(let i = 0; i<=3; i+=1){
            let lineXPosition = canvas.width * (this.xRenderOffset + i/4 * SymbolField.fieldWidth)
            ctx.beginPath()
            ctx.moveTo(lineXPosition, canvas.height * SymbolField.topMargin)
            ctx.lineTo(lineXPosition, canvas.height * (SymbolField.topMargin + SymbolField.fieldHeight))
            ctx.lineWidth = 5
            ctx.stroke()
        }
    }
}

class GameManager {
    constructor() {
        this.symbolFields = {}
        this.symbolFields[UserEnum.USER_LEFT] = new SymbolField(0.05)
        this.symbolFields[UserEnum.USER_RIGHT] = new SymbolField(0.55)
    }

    userInputHandler(userID, direction) {
        if (gameProps.gameState !== GameStateEnum.PLAY) {
            return
        }

        switch (direction) {
            case DirectionEnum.RIGHT:
                break
            case DirectionEnum.UP:
                break
            case DirectionEnum.LEFT:
                break
            case DirectionEnum.DOWN:
                break
        }
    }

    update() {

    }

    draw() {
        ctx.fillStyle = Colors.black
        ctx.fillRect(0,0,canvas.width,canvas.height)

        this.symbolFields[UserEnum.USER_LEFT].draw()
        this.symbolFields[UserEnum.USER_RIGHT].draw()
    }
}

// --------------------------------------------------------------------------------
// Initialize the game and define final functions for reset, pause, etc...
// Anything that will need reference to the game manager object

let manager = new GameManager()

function reset() {
    manager = new GameManager()
    gameProps.gameState = GameStateEnum.PLAY
}

function pause() {
    if (gameProps.gameState === GameStateEnum.PAUSED) {
        gameProps.gameState = GameStateEnum.PLAY
    } else if (gameProps.gameState === GameStateEnum.PLAY) {
        gameProps.gameState = GameStateEnum.PAUSED
    }
}

// --------------------------------------------------------------------------------

const gameLoop = (timestamp) => {
    gameProps.deltaTime = (timestamp - gameProps.previousTimeStamp) / 1000;
    gameProps.previousTimeStamp = timestamp
    if (gameProps.gameState === GameStateEnum.PLAY) {
        manager.update()
    }
    manager.draw()
    requestAnimationFrame(gameLoop)
}

function main() {
    document.addEventListener('keydown', (event) => {
        const key = event.key;
        switch (key) {
            case "ArrowRight": manager.userInputHandler(UserEnum.USER_RIGHT, DirectionEnum.RIGHT); break;
            case "ArrowUp": manager.userInputHandler(UserEnum.USER_RIGHT, DirectionEnum.UP); break;
            case "ArrowLeft": manager.userInputHandler(UserEnum.USER_RIGHT, DirectionEnum.LEFT); break;
            case "ArrowDown": manager.userInputHandler(UserEnum.USER_RIGHT, DirectionEnum.DOWN); break;
            case "d": manager.userInputHandler(UserEnum.USER_LEFT, DirectionEnum.RIGHT); break;
            case "w": manager.userInputHandler(UserEnum.USER_LEFT, DirectionEnum.UP); break;
            case "a": manager.userInputHandler(UserEnum.USER_LEFT, DirectionEnum.LEFT); break;
            case "s": manager.userInputHandler(UserEnum.USER_LEFT, DirectionEnum.DOWN); break;
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