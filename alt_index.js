import { draw_text, colours } from "./utils/utils.js"
import { init as initRunner } from "./alt-runner.js"

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d')

// Button configuration
const buttons = [
    { text: "RUNNER", module: "runner", x: 0, y: 0, width: 300, height: 80, hovered: false },
    { text: "SNAKE", url: "games/snake/index.html", x: 0, y: 0, width: 300, height: 80, hovered: false },
    { text: "FROGGER", url: "games/frogger/", x: 0, y: 0, width: 300, height: 80, hovered: false },
];

let currentGame = null;
let menuAnimationId = null;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Recalculate button positions on resize
    if (!currentGame) {
        updateButtonPositions();
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


function updateButtonPositions() {
    const spacing = 120;
    const startY = canvas.height / 2 - ((buttons.length - 1) * spacing) / 2;

    buttons.forEach((btn, i) => {
        btn.x = canvas.width / 2 - btn.width / 2;
        btn.y = startY + (i * spacing);
    });
}

function drawCRTEffects() {
    // Scanlines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 2;
    for (let i = 0; i < canvas.height; i += 4) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }

    // Vignette effect
    const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width / 1.5
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawButton(btn) {
    const glowIntensity = btn.hovered ? 0.8 : 0.3;
    const textColor = btn.hovered ? colours.PASTEL_GREEN : colours.BLUE_GREY;

    // Glow effect
    ctx.shadowBlur = btn.hovered ? 30 : 15;
    ctx.shadowColor = colours.PASTEL_GREEN;

    // Button border
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);

    // Button background (subtle)
    ctx.fillStyle = btn.hovered ? 'rgba(191, 255, 188, 0.1)' : 'rgba(134, 187, 216, 0.05)';
    ctx.fillRect(btn.x, btn.y, btn.width, btn.height);

    // Reset shadow for text
    ctx.shadowBlur = btn.hovered ? 20 : 10;

    // Button text
    ctx.fillStyle = textColor;
    ctx.font = '32px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.text, btn.x + btn.width / 2, btn.y + btn.height / 2 + state.flickerOffset);

    // Reset shadow
    ctx.shadowBlur = 0;
}

function isPointInButton(x, y, btn) {
    return x >= btn.x && x <= btn.x + btn.width &&
           y >= btn.y && y <= btn.y + btn.height;
}

const gameLoop = (timestamp) => {
    state.deltaTime = (timestamp - state.prev_timestamp) / 1000;
    state.prev_timestamp = timestamp;

    // CRT flicker effect
    state.flickerOffset = Math.sin(timestamp * 0.05) * 0.5;

    // Clear with dark background
    ctx.fillStyle = colours.DARK_BLUE;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.shadowBlur = 30;
    ctx.shadowColor = colours.ROSE_PINK;
    ctx.fillStyle = colours.ROSE_PINK;
    ctx.font = 'bold 72px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MINICLIP', canvas.width / 2, canvas.height / 4);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.fillStyle = colours.DARK_GREY;
    ctx.font = '24px monospace';
    ctx.fillText('SELECT GAME', canvas.width / 2, canvas.height / 4 + 60);

    // Draw buttons
    buttons.forEach(drawButton);

    // CRT effects overlay
    drawCRTEffects();

    menuAnimationId = requestAnimationFrame(gameLoop);
}

function backToMenu() {
    currentGame = null;
    canvas.style.cursor = 'default';
    resizeCanvas();
    window.requestAnimationFrame(gameLoop);
}

function startGame(gameModule) {
    // Cancel menu animation
    if (menuAnimationId) {
        cancelAnimationFrame(menuAnimationId);
        menuAnimationId = null;
    }

    currentGame = gameModule;

    // Start the game module
    if (gameModule === "runner") {
        initRunner(canvas, ctx, backToMenu);
    }
}

function main() {
    updateButtonPositions();

    // Mouse move handler
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        state.mouseX = e.clientX - rect.left;
        state.mouseY = e.clientY - rect.top;

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
                    startGame(btn.module);
                } else {
                    window.location.href = btn.url;
                }
            }
        });
    });

    window.requestAnimationFrame(gameLoop);
}

main()
