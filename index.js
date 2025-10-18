import { drawText, textDimensions, colours, clearScreen } from "./utils/utils.js"
import { init as initRunner } from "./games/runner/runner.js"
import { drawCRTEffects, drawButton, drawGameFrame, drawTitle } from "./utils/graphics.js"

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d')

// To add a new game, add a button here
const buttons = [
    { text: "RUNNER", module: "runner", x: 0, y: 0, width: 300, height: 80, hovered: false },
    { text: "SNAKE", url: "games/snake/index.html", x: 0, y: 0, width: 300, height: 80, hovered: false },
    { text: "FROGGER", url: "games/frogger/", x: 0, y: 0, width: 300, height: 80, hovered: false },
    { text: "DDR", url: "games/DDR/index.html", x: 0, y: 0, width: 300, height: 80, hovered: false },
    { text: "ASTEROIDS", url: "games/asteroids/", x: 0, y: 0, width: 300, height: 80, hovered: false },
]

// A module here
const gameModules = {
    runner: {
        module: "runner",
        viewport: {
            width: 800,
            height: 600,
        },
    },
    snake: {
        module: "snake",
        url: "games/snake/index.html",
        viewport: {
            width: 1200,
            height: 810,
        },
    },
    frogger: {
        module: "frogger",
        url: "games/frogger/index.html",
        viewport: {
            width: 800,
            height: 600,
        },
    },
    ddr: {
        module: "ddr",
        url: "games/DDR/index.html",
        viewport: {
            width: 800,
            height: 800,
        },
    },
    asteroids: {
        module: "asteroids",
        url: "games/asteroids/index.html",
        viewport: {
            width: 800,
            height: 800,
        },
    }
}

// A lookup for that module here
function findGameModule(hash) {
    switch (hash) {
        case "runner": return gameModules.runner
        case "snake": return gameModules.snake
        case "frogger": return gameModules.frogger
        case "ddr": return gameModules.frogger
        case "asteroids": return gameModules.asteroids
    }
}


let currentGame = null;
let menuAnimationId = null;
let currentViewport = null;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Recalculate button positions on resize
    if (!currentGame) {
        updateButtonPositions();
    } else {
        // Centre game viewport
        const gameWidth = Math.min(currentGame.viewport.width, canvas.width * 0.8);
        const gameHeight = Math.min(currentGame.viewport.height, canvas.height * 0.8);
        currentViewport.x = (canvas.width - gameWidth) / 2;
        currentViewport.y = (canvas.height - gameHeight) / 2;
        currentViewport.width = gameWidth;
        currentViewport.height = gameHeight;
    }
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const state = {
    deltaTime: 0,
    prev_timestamp: 0,
    mouseX: 0,
    mouseY: 0,
    flickerOffset: 0,
}

// Could be worth having a button class
function updateButtonPositions() {
    const spacing = 120;
    const startY = canvas.height / 2 - ((buttons.length - 1) * spacing) / 2;

    buttons.forEach((btn, i) => {
        btn.x = canvas.width / 2 - btn.width / 2;
        btn.y = startY + (i * spacing);
    });
}

function isPointInButton(x, y, btn) {
    return x >= btn.x && x <= btn.x + btn.width &&
        y >= btn.y && y <= btn.y + btn.height;
}

function resetButtonsHover(buttons) {
    buttons.forEach((button) => {
        button.hovered = false
    })
}

function handleHashChange() {
    const hash = window.location.hash.slice(1);

    if (!hash && currentGame) {
        // Hash cleared, go back to menu
        backToMenu();
    } else if (hash && !currentGame) {
        // Hash set, start game
        const game = findGameModule(hash)
        if (game) {
            startGame(game);
        }
    }
}


function backToMenu() {
    currentGame = null;
    currentViewport = null;
    canvas.style.cursor = 'default';

    // Update button hover states
    buttons.forEach(btn => {
        btn.hovered = isPointInButton(state.mouseX, state.mouseY, btn);
    });
    // Change cursor
    canvas.style.cursor = buttons.some(btn => btn.hovered) ? 'pointer' : 'default';

    // Clear URL hash
    window.location.hash = '';

    resizeCanvas();
    window.requestAnimationFrame(menuLoop);
}

function startGame(gameModule) {
    if (menuAnimationId) {
        cancelAnimationFrame(menuAnimationId);
        menuAnimationId = null;
    }

    currentGame = gameModule;

    resetButtonsHover(buttons)
    canvas.style.cursor = 'default';
    // Update URL hash
    window.location.hash = `#${gameModule.module}`;

    // Define viewport for games (centered, 4:3 aspect ratio)
    const gameWidth = Math.min(gameModule.viewport.width, canvas.width * 0.8);
    const gameHeight = Math.min(gameModule.viewport.height, canvas.height * 0.8);
    currentViewport = {
        x: (canvas.width - gameWidth) / 2,
        y: (canvas.height - gameHeight) / 2,
        width: gameWidth,
        height: gameHeight
    };

    // Start the game module
    if (gameModule.module === "runner") {
        // Start animation loop that draws the frame
        const frameLoop = () => {
            if (currentGame) {
                drawGameFrame(ctx, canvas, currentViewport);
                const font = 'bold 64px monospace'
                const runnerTitle = "RUNNER"
                const textDim = textDimensions(ctx, runnerTitle, font)

                const titleX = currentViewport.x + currentViewport.width / 2
                const titleY = currentViewport.y - textDim.height

                drawTitle(ctx, colours.ROSE_PINK, font, runnerTitle, titleX, titleY)
                drawCRTEffects(ctx, canvas);
                requestAnimationFrame(frameLoop);
            }
        };

        initRunner(canvas, ctx, backToMenu, currentViewport);
        requestAnimationFrame(frameLoop);
    }
}

const menuLoop = (timestamp) => {
    state.deltaTime = (timestamp - state.prev_timestamp) / 1000;
    state.prev_timestamp = timestamp;

    // CRT flicker effect
    state.flickerOffset = Math.sin(timestamp * 0.05) * 0.5;

    // Clear with dark background
    clearScreen(ctx, canvas.width, canvas.height, colours.DARK_BLUE)
    // The text still goes up and down a bit for some reason, unsure why but it is at least dynamic scaled
    drawTitle(ctx, colours.ROSE_PINK, 'bold 72px monospace', "MINICLIP", canvas.width / 2, canvas.height / 5)
    drawText(ctx, colours.DARK_GREY, "24px monospace", "SELECT GAME", canvas.width / 2, canvas.height / 5 + canvas.height / 15)

    // Draw buttons
    buttons.forEach(btn => drawButton(ctx, btn, state));

    // CRT effects overlay
    drawCRTEffects(ctx, canvas);

    menuAnimationId = requestAnimationFrame(menuLoop);
}

function main() {
    updateButtonPositions();

    // Mouse move handler
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        state.mouseX = e.clientX - rect.left;
        state.mouseY = e.clientY - rect.top;

        if (currentGame) return;
        // Update button hover states
        buttons.forEach(btn => {
            btn.hovered = isPointInButton(state.mouseX, state.mouseY, btn);
        });
        // Change cursor
        canvas.style.cursor = buttons.some(btn => btn.hovered) ? 'pointer' : 'default';
    });

    // Click handler
    canvas.addEventListener('click', () => {
        if (currentGame) return; // Don't handle clicks when game is running

        buttons.forEach(btn => {
            if (btn.hovered) {
                if (btn.module) {
                    startGame(findGameModule(btn.module));
                    return
                } else {
                    window.location.href = btn.url;
                }
            }
        });
    });

    // Handle browser back/forward
    window.addEventListener('hashchange', handleHashChange);

    // Check URL hash on load and auto-start game if present
    const hash = window.location.hash.slice(1); // Remove '#'
    if (hash) {
        // Find button with matching module
        const game = findGameModule(hash)
        if (game) {
            startGame(game);
            return
        }
    }

    window.requestAnimationFrame(menuLoop);
}

main()
