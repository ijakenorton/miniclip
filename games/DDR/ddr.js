const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const canvasAspectRatio = canvas.width / canvas.height;

// --------------------------------------------------------------------------------
// Useful constants

// Commonly used colors in the game
const Colors = {
    black: "rgba(0, 0, 0, 1)",
    white: "rgba(255, 255, 255, 1)",
    red: "rgba(255,0,0,1)",
    pauseBackground: "rgba(0,0,0,0.3)",
    symbolFieldBackground: "rgba(66, 73, 76, 0.5)",
    symbolColor: "rgba(255, 255, 255, 0.5)",
    symbolIndicator: "rgba(255, 255, 255, 1)",

    excellentHighlight: "rgba(0, 155, 202, 1)",
    goodHighlight: "rgba(21, 208, 0, 1)",
    okayHighlight: "rgba(221, 249, 37, 1)",
    missedHighlight: "rgba(187, 16, 16, 1)",
};

const progressRewardExcellent = 0.05;
const progressRewardGood = 0.025;
const progressRewardOkay = 0.01;
const progressRewardMissed = -0.025;

// --------------------------------------------------------------------------------
// Utility functions

function randomRange(low, high) {
    return Math.random() * (high - low) + low;
}

function drawText(fillStyle, font, text, x, y) {
    ctx.fillStyle = fillStyle;
    ctx.font = font;
    const textMetrics = ctx.measureText(text);
    ctx.fillText(text, x - textMetrics.width / 2, y);
}

// --------------------------------------------------------------------------------
// Game variables and state

const UserEnum = Object.freeze({
    USER_LEFT: Symbol("USER_LEFT"),
    USER_RIGHT: Symbol("USER_RIGHT"),
});

const GameStateEnum = Object.freeze({
    PLAY: Symbol("PLAY"),
    PAUSED: Symbol("PAUSED"),
    GAME_OVER: Symbol("GAME_OVER"),
});

const DirectionEnum = Object.freeze({
    RIGHT: Symbol("RIGHT"),
    UP: Symbol("UP"),
    LEFT: Symbol("LEFT"),
    DOWN: Symbol("DOWN"),
});

const gameProps = {
    // How long since the previous frame
    deltaTime: 0,
    previousTimeStamp: 0,

    gameState: GameStateEnum.PLAY,

    // The speed at which symbols move down the screen. To be updated by some small amount every frame...
    gameSpeed: 1.0,

    // The state of the game, represented as a value between 0 and +1
    // For player two and player one's victory respectively
    // When rendered, the bar may look something like this:
    // 0 <----------------------> 1
    // And is updated as players hit symbols
    // Better symbol timings give larger updates, missing a symbol gives an update in the "wrong" direction
    victoryBarProgress: 0.5,
};

class SymbolField {
    // This object represents the "field" of interest to one user
    // i.e. the column of symbols that will move down the screen,
    // and the indicators to use for timing

    // The width of the field, as a ratio to the canvas width
    static fieldWidth = 0.4;

    // The height of the field, as a ratio to the canvas height
    static fieldHeight = 0.8;

    // The margin to use from the top of the canvas, as a ratio to the canvas height
    static topMargin = 0.05;

    // This value is specified so explicitly since it will be compared to 
    // individual symbol heights later, when the user presses a key
    static indicatorY = (SymbolField.topMargin + 0.9 * SymbolField.fieldHeight);

    constructor(xRenderOffset) {
        // xRenderOffset is given as a ratio to the canvas width
        this.xRenderOffset = xRenderOffset;

        // Distance until next arrow is spawned
        this.lanes = {};
        this.lanes[DirectionEnum.RIGHT] = new SymbolLane(
            DirectionEnum.RIGHT,
            this.xRenderOffset + 7 / 8 * SymbolField.fieldWidth
        );
        this.lanes[DirectionEnum.UP] = new SymbolLane(
            DirectionEnum.UP,
            this.xRenderOffset + 5 / 8 * SymbolField.fieldWidth
        );
        this.lanes[DirectionEnum.LEFT] = new SymbolLane(
            DirectionEnum.LEFT,
            this.xRenderOffset + 1 / 8 * SymbolField.fieldWidth
        );
        this.lanes[DirectionEnum.DOWN] = new SymbolLane(
            DirectionEnum.DOWN,
            this.xRenderOffset + 3 / 8 * SymbolField.fieldWidth
        );
    }

    update() {
        for (const d of [
            DirectionEnum.RIGHT,
            DirectionEnum.UP,
            DirectionEnum.LEFT,
            DirectionEnum.DOWN,
        ]) {
            this.lanes[d].update();
        }
    }

    draw() {
        ctx.fillStyle = Colors.symbolFieldBackground;
        ctx.beginPath();
        ctx.roundRect(
            canvas.width * this.xRenderOffset,
            canvas.height * SymbolField.topMargin,
            canvas.width * SymbolField.fieldWidth,
            canvas.height * SymbolField.fieldHeight,
            [20, 20, 0, 0],
        );
        ctx.fill();

        ctx.strokeStyle = Colors.black;
        for (let i = 1; i <= 3; i += 1) {
            let lineXPosition = canvas.width * (this.xRenderOffset + i / 4 * SymbolField.fieldWidth);
            ctx.beginPath();
            ctx.moveTo(lineXPosition, canvas.height * SymbolField.topMargin);
            ctx.lineTo(lineXPosition, canvas.height * (SymbolField.topMargin + SymbolField.fieldHeight));
            ctx.lineWidth = 5;
            ctx.stroke();
        }

        for (const d of [
            DirectionEnum.RIGHT,
            DirectionEnum.UP,
            DirectionEnum.LEFT,
            DirectionEnum.DOWN,
        ]) {
            this.lanes[d].draw();
        }
    }
}

class SymbolLane {
    // The width of the lane, defined in terms of the entire field
    static laneWidth = SymbolField.fieldWidth / 4;

    constructor(laneSymbolDirection, laneCenterX) {
        // The symbol direction this lane is supposed to manage
        this.laneSymbolDirection = laneSymbolDirection

        // xRenderOffset is given as a ratio to the canvas width
        this.laneCenterX = laneCenterX;

        // The symbols in this lane
        this.gameSymbols = [];

        // The indicator for this lane
        this.gameSymbolIndicator = new GameSymbol(
            this.laneSymbolDirection,
            this.laneCenterX,
            SymbolField.indicatorY,
            Colors.white,
            true
        );
    }

    draw() {
        for (const s of this.gameSymbols) {
            s.draw();
        }

        this.gameSymbolIndicator.draw()
    }

    update() {
        for (const s of this.gameSymbols) {
            s.update();
        }
        this.gameSymbolIndicator.update()
    }
}

class GameSymbol {

    static arrowSize = 0.8 * SymbolLane.laneWidth;
    static tailWidth = 0.5 * GameSymbol.arrowSize;
    static headWidth = 1 * GameSymbol.arrowSize;
    static headLength = 0.65; // How long the head is. 0 is no head, 1 is all head

    static headPosition = -(2 * GameSymbol.headLength - 1) * GameSymbol.arrowSize / 2;

    // All drawing instructions are given from arrow tip, counter clockwise
    // Note this means we must hit seven vertices in each call
    //     |\
    //  ___| \
    // |      \
    // |       .
    // |___   /
    //     | /
    //     |/
    // These positions describe the coordinates to draw a right-facing arrow
    // Apply the correct rotations to achieve other arrows
    static drawingCoordinates = [
        [GameSymbol.arrowSize / 2, 0],
        [GameSymbol.arrowSize / 2, 0],
        [GameSymbol.headPosition, GameSymbol.headWidth / 2],
        [GameSymbol.headPosition, GameSymbol.tailWidth / 2],
        [-GameSymbol.arrowSize / 2, GameSymbol.tailWidth / 2],
        [-GameSymbol.arrowSize / 2, -GameSymbol.tailWidth / 2],
        [GameSymbol.headPosition, -GameSymbol.tailWidth / 2],
        [GameSymbol.headPosition, -GameSymbol.headWidth / 2],
        [GameSymbol.arrowSize / 2, 0],
    ]

    constructor(direction, x, y, color = Colors.symbolColor, isIndicator = false) {
        // Give the symbol direction (what way the arrow points)
        // The X, Y coordinates are given as fractions of the canvas width and height respectively
        // X,Y refer to the *center* of the symbol
        // color determines the color to draw the symbol with

        this.direction = direction;
        this.isIndicator = isIndicator;
        this.x = x;
        this.y = y;
        this.color = color;
        this.highlightColor = "rgba(0,0,0,0)";
        this.highlightAlpha = 0.0;
    }

    setHighlightColor(color) {
        this.highlightColor = color;
        this.highlightAlpha = 1.0;
    }

    update() {
        if (!this.isIndicator) {
            this.y += gameProps.gameSpeed * gameProps.deltaTime;
        }

        if (this.highlightAlpha < 0.01) {
            this.goodHighlight = 0.0;
        } else {
            this.highlightAlpha -= 2.0 * gameProps.deltaTime;
        }
    }

    draw() {
        let rotation;
        switch (this.direction) {
            case DirectionEnum.RIGHT:
                rotation = 0;
                break;

            case DirectionEnum.UP:
                rotation = 3 * Math.PI / 2;
                break;

            case DirectionEnum.LEFT:
                rotation = Math.PI;
                break;

            case DirectionEnum.DOWN:
                rotation = Math.PI / 2;
                break;
        }
        let sinRotation = Math.sin(rotation);
        let cosRotation = Math.cos(rotation);

        ctx.fillStyle = this.color;
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(canvas.width * this.x, canvas.height * this.y)
        for (const c of GameSymbol.drawingCoordinates) {
            ctx.lineTo(
                canvas.width * (this.x + c[0] * cosRotation - c[1] * sinRotation),
                canvas.height * (this.y + c[0] * sinRotation * canvasAspectRatio + c[1] * cosRotation * canvasAspectRatio)
            )
        }
        ctx.fill();

        if (this.highlightAlpha > 0.0) {
            ctx.fillStyle = this.highlightColor;
            ctx.globalAlpha = this.highlightAlpha;
            ctx.beginPath();
            ctx.moveTo(canvas.width * this.x, canvas.height * this.y)
            for (const c of GameSymbol.drawingCoordinates) {
                ctx.lineTo(
                    canvas.width * (this.x + c[0] * cosRotation - c[1] * sinRotation),
                    canvas.height * (this.y + c[0] * sinRotation * canvasAspectRatio + c[1] * cosRotation * canvasAspectRatio)
                )
            }
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    }
}

class VictoryBar {
    static xMargin = 0.05;
    static barLength = 1 - 2 * VictoryBar.xMargin;
    static yPosition = 0.95 * canvas.height;

    constructor() {

    }

    draw() {
        ctx.fillStyle = Colors.black;
        ctx.fillRect(
            0,
            canvas.height * (SymbolField.fieldHeight + SymbolField.topMargin),
            canvas.width,
            canvas.height,
        );

        ctx.lineWidth = 20;

        ctx.strokeStyle = Colors.white;
        ctx.beginPath();
        ctx.moveTo(canvas.width * VictoryBar.xMargin, VictoryBar.yPosition);
        ctx.lineTo(canvas.width * (1 - VictoryBar.xMargin), VictoryBar.yPosition);
        ctx.stroke();

        ctx.strokeStyle = Colors.excellentHighlight;
        ctx.beginPath();
        ctx.moveTo(canvas.width * (VictoryBar.barLength / 2 + VictoryBar.xMargin), VictoryBar.yPosition);
        ctx.lineTo(canvas.width * (gameProps.victoryBarProgress * VictoryBar.barLength + VictoryBar.xMargin), VictoryBar.yPosition);
        ctx.stroke();
    }
}

class GameManager {
    constructor() {
        this.symbolFields = {};
        this.symbolFields[UserEnum.USER_LEFT] = new SymbolField(0.05);
        this.symbolFields[UserEnum.USER_RIGHT] = new SymbolField(0.55);
        this.victoryBar = new VictoryBar();
    }

    userInputHandler(userID, direction) {
        if (gameProps.gameState !== GameStateEnum.PLAY) {
            return;
        }
        let progressDirection = userID === UserEnum.USER_LEFT ? 1 : -1;
        let symbolLane = this.symbolFields[userID].lanes[direction];
        let laneSymbols = symbolLane.gameSymbols;
        let laneIndicator = symbolLane.gameSymbolIndicator;

        if (laneSymbols.length === 0) {
            // User pressed a button on a lane with nothing in it.
            gameProps.victoryBarProgress += progressDirection * progressRewardMissed;
            laneIndicator.setHighlightColor(Colors.missedHighlight);
            return;
        }

        // We know the final GameSymbol is the lowest
        let lowestSymbolHeight = laneSymbols[laneSymbols.length - 1].y;
        let deltaHeight = Math.abs(SymbolField.indicatorY - lowestSymbolHeight);
        if (deltaHeight > 0.3) {
            // The symbol is simply too high, treat as a miss
            gameProps.victoryBarProgress += progressDirection * progressRewardMissed;
            laneIndicator.setHighlightColor(Colors.missedHighlight);
            return; // Purposefully do not remove symbol
        } else if (deltaHeight > 0.2) {
            gameProps.victoryBarProgress += progressDirection * progressRewardOkay;
            laneIndicator.setHighlightColor(Colors.okayHighlight);
        } else if (deltaHeight > 0.1) {
            gameProps.victoryBarProgress += progressDirection * progressRewardGood;
            laneIndicator.setHighlightColor(Colors.goodHighlight);
        } else {
            gameProps.victoryBarProgress += progressDirection * progressRewardExcellent;
            laneIndicator.setHighlightColor(Colors.excellentHighlight);
        }
        symbolLane.gameSymbols[d].pop();
    }

    update() {
        this.symbolFields[UserEnum.USER_LEFT].update();
        this.symbolFields[UserEnum.USER_RIGHT].update();

        // Unfortunately, the GameManager must be responsible for removing missed symbols from SymbolFields
        // To track which player loses points

        for (const userID of [UserEnum.USER_LEFT, UserEnum.USER_RIGHT]) {
            let progressDirection = userID === UserEnum.USER_LEFT ? 1 : -1;
            let symbolField = this.symbolFields[userID];
            for (const d of [
                DirectionEnum.RIGHT,
                DirectionEnum.UP,
                DirectionEnum.LEFT,
                DirectionEnum.DOWN,
            ]) {
                let symbolLane = symbolField.lanes[d];
                let directionSymbols = symbolLane.gameSymbols;
                if (directionSymbols.length === 0) {
                    continue;
                }
                // We know the final GameSymbol is the lowest, so only check this one for deletion
                let directionLowestSymbol = directionSymbols[directionSymbols.length - 1]
                if (directionLowestSymbol.y - GameSymbol.arrowSize > (SymbolField.fieldHeight + SymbolField.topMargin)) {
                    symbolLane.gameSymbols.pop();
                    gameProps.victoryBarProgress += progressDirection * progressRewardMissed;
                    symbolLane.gameSymbolIndicator.setHighlightColor(Colors.missedHighlight);
                }
            }
        }

        if (gameProps.victoryBarProgress >= 1.0) {
            gameProps.victoryBarProgress = 1.0;
            gameProps.gameState = GameStateEnum.GAME_OVER;
        }
        if (gameProps.victoryBarProgress <= 0.0) {
            gameProps.victoryBarProgress = 0.0;
            gameProps.gameState = GameStateEnum.GAME_OVER;
        }
    }

    draw() {
        ctx.fillStyle = Colors.black;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        this.symbolFields[UserEnum.USER_LEFT].draw();
        this.symbolFields[UserEnum.USER_RIGHT].draw();
        this.victoryBar.draw();

        if (gameProps.gameState === GameStateEnum.PAUSED) {
            ctx.fillStyle = Colors.pauseBackground;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            drawText(Colors.red, "30px Arial", "Paused", canvas.width / 2, canvas.height / 2);
        }

        if (gameProps.gameState === GameStateEnum.GAME_OVER) {
            ctx.fillStyle = Colors.pauseBackground;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            let victorMessage;
            if (gameProps.victoryBarProgress >= 1.0) {
                victorMessage = "LEFT USER WINS"
            } else {
                victorMessage = "RIGHT USER WINS"
            }
            drawText(Colors.red, "30px Arial", "GAME OVER", canvas.width / 2, canvas.height / 2);
            drawText(Colors.red, "30px Arial", victorMessage, canvas.width / 2, canvas.height / 2 + 80);
        }
    }
}

// --------------------------------------------------------------------------------
// Initialize the game and define final functions for reset, pause, etc...
// Anything that will need reference to the game manager object

let manager = new GameManager()

function reset() {
    if (gameProps.gameState !== GameStateEnum.GAME_OVER) {
        return;
    }
    manager = new GameManager();
    gameProps.gameState = GameStateEnum.PLAY;
    gameProps.victoryBarProgress = 0.5;
}

function pause() {
    if (gameProps.gameState === GameStateEnum.PAUSED) {
        gameProps.gameState = GameStateEnum.PLAY;
    } else if (gameProps.gameState === GameStateEnum.PLAY) {
        gameProps.gameState = GameStateEnum.PAUSED;
    }
}

// --------------------------------------------------------------------------------

const gameLoop = (timestamp) => {
    gameProps.deltaTime = (timestamp - gameProps.previousTimeStamp) / 1000;
    gameProps.previousTimeStamp = timestamp;
    if (gameProps.gameState === GameStateEnum.PLAY) {
        manager.update();
    }
    manager.draw();
    requestAnimationFrame(gameLoop);
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

main();